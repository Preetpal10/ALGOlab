# ALGOLAB — Ubuntu Linux VM Deployment Guide (Phase 12.4)

This document provides the production deployment specification and step-by-step instructions for deploying the **ALGOLAB Java Execution Runner** on an **Ubuntu Linux VM (22.04 or 24.04 LTS)** behind an **Nginx HTTPS reverse proxy** with **Docker Engine** sandbox isolation.

---

## 1. Architecture Overview

```
                      [ PUBLIC INTERNET ]
                               │
               HTTPS :443 (Let's Encrypt TLS)
                               ▼
                   ┌───────────────────────┐
                   │   Ubuntu Linux Host   │
                   │                       │
                   │   Nginx Reverse Proxy │
                   │   (Rate limit, CORS)  │
                   └───────────┬───────────┘
                               │ HTTP (Loopback only)
                               ▼
                   ┌───────────────────────┐
                   │ Node.js API Service   │
                   │ (127.0.0.1:3001)      │
                   │ User: 'algolab'       │
                   └───────────┬───────────┘
                               │ Docker CLI / Socket
                               ▼
                   ┌───────────────────────┐
                   │   Docker Daemon       │
                   │   (dockerd)           │
                   └───────────┬───────────┘
                               │ Ephemeral Container
                               ▼
    ┌─────────────────────────────────────────────────────┐
    │  Container: algolab-runner:latest                   │
    │  - Network: none                                    │
    │  - User: 1001:1001 (unprivileged)                   │
    │  - Filesystem: read-only root                       │
    │  - Limits: 256MB RAM, 1.0 CPU, 64 PIDs              │
    │  - Capabilities: ALL dropped                        │
    │  - Mount: Source file bound read-only               │
    │  - Scratch: tmpfs (/tmp & /sandbox/build)           │
    └─────────────────────────────────────────────────────┘
```

---

## 2. Docker Sandbox Security Specifications

Every Java execution is spawned inside an ephemeral container. The security invariants are enforced directly in `backend/runner/docker-runner.js` and `Dockerfile`:

| Security Control | Flag / Setting | Purpose & Defense |
|---|---|---|
| **Zero Network Access** | `--network none` | Disables network stack entirely inside container. Untrusted code cannot perform port scans, connect to LAN/WAN, or access cloud metadata services (e.g. `169.254.169.254`). |
| **Read-Only Root Filesystem** | `--read-only` | Prevents writing to system binaries, libraries, or configuration files. |
| **Non-Root Execution** | `--user 1001:1001` | Runs as unprivileged `runner` user (UID/GID 1001). Zero root/sudo permissions. |
| **All Capabilities Dropped** | `--cap-drop ALL` | Strips all Linux kernel capabilities (e.g. `CAP_NET_ADMIN`, `CAP_SYS_ADMIN`, `CAP_SYS_PTRACE`). |
| **Privilege Escalation Prevention** | `--security-opt no-new-privileges:true` | Prevents execution of `setuid` binaries from gaining elevated privileges. |
| **RAM Bounding** | `--memory 256m --memory-swap 256m` | Strict 256MB limit without swap. Defeats memory bombs and host OOM panic. |
| **CPU Bounding** | `--cpus 1.0` | Restricts computation to 1 core, preventing CPU starvation of the host server. |
| **PID / Thread Bounding** | `--pids-limit 64` | Completely defeats fork bombs and unbounded thread creation. |
| **In-Memory Scratch Space** | `--tmpfs /sandbox/build:rw,exec,nosuid,size=32m,mode=1777` | Java compilation and bytecode execution occur strictly in RAM tmpfs; destroyed upon container exit. |
| **Ephemeral Container Lifecycle** | `--rm` + `proc.kill('SIGKILL')` | Containers are automatically deleted upon exit; timeout triggers host-side hard termination. |
| **Read-Only Code Mount** | `-v /tmp/algolab_job_.../Main.java:/sandbox/build/Main.java:ro` | Student code is mounted strictly read-only. |

---

## 3. Host System Requirements & Hardware Sizing

- **Operating System:** Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (x86_64 or arm64).
- **Minimum VM Specs:**
  - 2 vCPU
  - 2 GB RAM (4 GB recommended for concurrent builds)
  - 20 GB SSD storage
- **Network Ports:**
  - Inbound: Port 22 (SSH), Port 80 (HTTP for ACME challenges), Port 443 (HTTPS).
  - Outbound: All standard outbound for apt, docker pull, and ACME cert renewal.
  - **Port 3001 must NEVER be exposed publicly.** It must remain bound to `127.0.0.1`.

---

## 4. Step-by-Step Ubuntu Deployment Guide

### Phase A — VM Creation & SSH Hardening
1. Create a Linux VM instance in your chosen cloud provider (e.g. AWS EC2, DigitalOcean Droplet, Hetzner, Linode, GCP Compute Engine).
2. Attach a static public IPv4 address.
3. Connect via SSH:
   ```bash
   ssh root@<VM_PUBLIC_IP>
   ```
4. Update packages and install essential utilities:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl wget git ufw unattended-upgrades
   ```

---

### Phase B — Docker Engine & Node.js Installation
> **IMPORTANT:** Install Docker Engine from the official Docker repository, **NOT** via Snap (`snap install docker` has namespace isolation issues with bind mounts).

1. Install official Docker Engine:
   ```bash
   sudo apt install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

   echo \
     "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
     $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
     sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
   ```
2. Verify Docker service:
   ```bash
   sudo systemctl status docker --no-pager
   sudo docker run --rm hello-world
   ```
3. Install Node.js 20 or 22 LTS (via NodeSource):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   node --version # Must output v20.x or v22.x
   ```

---

### Phase C — Service User Setup & Permissions
Create a dedicated system user `algolab` with membership in the `docker` group:
```bash
sudo useradd --system --shell /usr/sbin/nologin --home-dir /opt/algolab algolab
sudo usermod -aG docker algolab
```

---

### Phase D — Repository Checkout & Docker Image Build
1. Clone the repository into `/opt/algolab`:
   ```bash
   sudo mkdir -p /opt/algolab
   sudo git clone https://github.com/<YOUR_USER>/ALGOlab.git /opt/algolab
   sudo chown -R algolab:algolab /opt/algolab
   ```
2. Build the sandboxed runner image:
   ```bash
   cd /opt/algolab/backend/runner
   sudo docker build -t algolab-runner:latest .
   ```
3. Test container execution manually:
   ```bash
   sudo docker run --rm algolab-runner:latest --help
   ```

---

### Phase E — Configuration & Environment File
1. Create a secure configuration directory:
   ```bash
   sudo mkdir -p /etc/algolab
   ```
2. Create `/etc/algolab/runner.env`:
   ```bash
   sudo cat << 'EOF' > /etc/algolab/runner.env
   # ALGOLAB Runner Production Configuration
   HOST=127.0.0.1
   PORT=3001
   NODE_ENV=production

   # Allowed CORS origins (Set to your exact Netlify production URL)
   # Example: https://algolab.netlify.app
   ALLOWED_ORIGIN=https://<YOUR_NETLIFY_APP>.netlify.app

   # Resource constraints
   MAX_CONCURRENCY=2
   MAX_BODY_BYTES=131072
   MAX_SOURCE_BYTES=65536
   REQUEST_TIMEOUT_MS=30000
   EOF
   ```
3. Restrict permissions so only root and the `algolab` group can read it:
   ```bash
   sudo chown root:algolab /etc/algolab/runner.env
   sudo chmod 640 /etc/algolab/runner.env
   ```

---

### Phase F — systemd Service Unit
Create `/etc/systemd/system/algolab-runner.service`:
```ini
[Unit]
Description=ALGOLAB Java Execution Runner API Service
After=network.target docker.service
Requires=docker.service
Documentation=https://github.com/<YOUR_USER>/ALGOlab

[Service]
Type=simple
User=algolab
Group=algolab
WorkingDirectory=/opt/algolab/backend/runner
EnvironmentFile=/etc/algolab/runner.env
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5s

# Process security limits
LimitNOFILE=65536
LimitNPROC=4096

# Sandbox isolation notes:
# PrivateTmp MUST be false so that the host Docker daemon
# can access temporary source files created in /tmp.
PrivateTmp=false
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable algolab-runner
sudo systemctl start algolab-runner
sudo systemctl status algolab-runner --no-pager
```

Verify that the local health check returns HTTP 200:
```bash
curl -i http://127.0.0.1:3001/api/health
# Expected output: {"status":"ok","service":"algolab-runner",...}
```

---

### Phase G — Nginx Reverse Proxy & Rate Limiting
1. Install Nginx:
   ```bash
   sudo apt install -y nginx
   ```
2. Create `/etc/nginx/sites-available/algolab-api`:
   ```nginx
   # Rate limiting zone: max 5 requests per second per IP with a burst of 10
   limit_req_zone $binary_remote_addr zone=algolab_api_limit:10m rate=5r/s;

   server {
       listen 80;
       server_name <API_SUBDOMAIN>; # e.g. api.yourdomain.com

       # Reject oversized request bodies
       client_max_body_size 256k;

       location / {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl http2;
       server_name <API_SUBDOMAIN>;

       # SSL certificates will be configured by Certbot
       # ssl_certificate /etc/letsencrypt/live/<API_SUBDOMAIN>/fullchain.pem;
       # ssl_certificate_key /etc/letsencrypt/live/<API_SUBDOMAIN>/privkey.pem;

       client_max_body_size 256k;

       # Security headers
       add_header X-Content-Type-Options nosniff always;
       add_header X-Frame-Options DENY always;
       add_header X-XSS-Protection "1; mode=block" always;

       location /api/ {
           limit_req zone=algolab_api_limit burst=10 nodelay;

           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;

           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Execution timeouts (allow up to 35s for compilation and JDI tracing)
           proxy_connect_timeout 5s;
           proxy_read_timeout 35s;
           proxy_send_timeout 35s;
       }
   }
   ```
3. Enable the site and test configuration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/algolab-api /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Phase H — TLS Certificate (Let's Encrypt / Certbot)
1. Install Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Ensure DNS `A` record for `<API_SUBDOMAIN>` points to your VM's public IP address.
3. Obtain and install certificates:
   ```bash
   sudo certbot --nginx -d <API_SUBDOMAIN>
   ```
4. Verify auto-renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

---

### Phase I — Firewall Hardening (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```
Verify that port 3001 is **NOT** listed in `ufw status`.

---

### Phase J — End-to-End Verification Testing
1. Test public health check:
   ```bash
   curl -i https://<API_SUBDOMAIN>/api/health
   # Expected: HTTP 200 OK with {"status":"ok","service":"algolab-runner"}
   ```
2. Test code execution with approved origin:
   ```bash
   curl -i -X POST https://<API_SUBDOMAIN>/api/execute \
     -H "Content-Type: application/json" \
     -H "Origin: https://<YOUR_NETLIFY_APP>.netlify.app" \
     -d '{
       "code": "public class Main { public static void main(String[] args) { System.out.println(10 + 20); } }",
       "mainClass": "Main"
     }'
   # Expected: HTTP 200 OK with outcome="success", stdout="30\n", stepCount > 0
   ```
3. Test CORS rejection with unapproved origin:
   ```bash
   curl -i -X POST https://<API_SUBDOMAIN>/api/execute \
     -H "Content-Type: application/json" \
     -H "Origin: https://malicious-site.example.com" \
     -d '{ "code": "class A {}" }'
   # Expected: HTTP 403 Forbidden
   ```
4. Test rate-limit response:
   - Flooding requests in rapid succession will return `HTTP 503` or `HTTP 429` from Nginx.

---

## 5. Critical Linux Pitfalls & Troubleshooting Matrix

| Symptom | Cause | Solution |
|---|---|---|
| `docker_unavailable` in API response | Service user `algolab` lacks permission to talk to `/var/run/docker.sock`. | Run `sudo usermod -aG docker algolab` and `sudo systemctl restart algolab-runner`. |
| `Source file not found` inside container | `PrivateTmp=true` in systemd unit prevented Docker daemon from seeing `/tmp/algolab_job_*`. | Ensure `PrivateTmp=false` in `/etc/systemd/system/algolab-runner.service` and run `systemctl daemon-reload && systemctl restart algolab-runner`. |
| Permission Denied on `Main.java` inside container | Temp source file lacked read permission for container user UID 1001. | Fixed in code: `fs.writeFile` explicitly sets `0o644` file and `0o755` directory permissions. |
| Mixed-Content Warning in Browser | Frontend is loaded over `https://` but API URL was configured with `http://`. | Browser blocks HTTP calls from HTTPS origin. Configure `window.ALGOLAB_API_URL` with `https://<API_SUBDOMAIN>`. |
| `502 Bad Gateway` from Nginx | Node.js backend is down or not listening on `127.0.0.1:3001`. | Check service logs: `journalctl -u algolab-runner -n 50 --no-pager`. |
| `413 Request Entity Too Large` | Submission exceeds 128KB Nginx/Node.js body limit. | Standard limit behavior. Students should write concise DSA solutions, not large binary data. |
