# ALGOLAB — Safe Java Execution Architecture & Docker Readiness

**Document Version:** 1.0  
**Phase:** Safe Java Execution Architecture & Docker Readiness  
**Target Platform:** Windows 10/11 Host + WSL2 + Docker Container Sandbox  

---

## 1. Threat Model & Security Boundaries

```
[ UNTRUSTED ZONE ]                 [ TRUST BOUNDARY ]                [ TRUSTED ZONE ]
Student Java Code ──(JDI Socket)──► tracer.Tracer ──(JSONL Stdout)──► Node.js API Service
  - Filesystem access attempts        - Non-root user                   - Port 3000
  - Network sockets / HTTP            - In-memory pipes only            - MySQL DB
  - Fork bombs / threads              - Hard timeouts                   - User Auth
  - Resource exhaustion               - Bounded buffers                 - Frontend Static Files
       ▲                                     ▲
       └─────────── INSIDE CONTAINER ────────┘
                    (--network none, --read-only, --memory 256m)
```

### Threat Vectors Addressed:
1. **Arbitrary Host Code Execution:** Untrusted Java accessing host filesystem, registry, environment variables, or running shell commands.
2. **Denial of Service (DoS):** Infinite loops, memory allocation bombs (`new byte[Integer.MAX_VALUE]`), fork bombs (`Runtime.getRuntime().exec()`).
3. **Network Exfiltration / SSRF:** Student programs opening sockets, port scanning internal network, calling AWS/cloud metadata services, or participating in botnets.
4. **Privilege Escalation:** Exploiting kernel or container runtime vulnerabilities to break out to the host.
5. **Data Tampering & Trace Forgery:** Outputting crafted strings to mimic JDI trace events or manipulating judging status.

---

## 2. Docker Container Isolation Design

Every untrusted student code execution runs in an ephemeral, strictly isolated Docker container using a hardened base image.

### 2.1 Proposed Container Launch Configuration

```bash
docker run --rm \
  --name "algolab-run-<uuid>" \
  --network none \
  --memory 256m \
  --memory-swap 256m \
  --cpus 1.0 \
  --pids-limit 64 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=32m \
  --tmpfs /sandbox/build:rw,exec,nosuid,size=32m \
  --user 1001:1001 \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --stop-timeout 7 \
  algolab-runner:latest \
  java -cp /app/tracer tracer.Tracer \
    --source /sandbox/build/Solution.java \
    --timeout-ms 5000 \
    --max-events 1000 \
    --max-output-bytes 10000 \
    --max-array-length 50 \
    --max-string-length 100
```

### 2.2 Security Controls Matrix

| Control | Implementation | Purpose & Defense |
| :--- | :--- | :--- |
| **Network Isolation** | `--network none` | Disables network interface completely inside container (`lo` only). Zero internet or LAN access. |
| **Memory Limit** | `--memory 256m --memory-swap 256m` | Prevents OOM of host machine. JVM heap sized accordingly (`-Xmx192m`). |
| **CPU Limit** | `--cpus 1.0` | Prevents CPU starvation of the host server. |
| **PID / Thread Limit** | `--pids-limit 64` | Completely defeats fork bombs and runaway thread generation. |
| **Execution Timeout** | Dual layer: 5s internal JDI watchdog + 7s `--stop-timeout` container termination | Guarantees infinite loops cannot hang indefinitely. |
| **Process Tree Cleanup** | `ProcessHandle.descendants().forEach(destroyForcibly)` + `docker run --rm` | Eliminates orphaned child processes on both JVM and container level. |
| **Read-Only Root Filesystem** | `--read-only` | Root filesystem cannot be modified or written to. |
| **Isolated Temp Storage** | `--tmpfs /sandbox/build:rw,exec,nosuid,size=32m` | Compilation occurs in RAM-backed tmpfs; destroyed immediately upon container exit. |
| **Non-Root Execution** | `--user 1001:1001` (user `runner`) | Container processes run as unprivileged user without sudo or root privileges. |
| **Capability Dropping** | `--cap-drop ALL` + `no-new-privileges:true` | Drops all Linux capabilities (`CAP_NET_RAW`, `CAP_SYS_ADMIN`, `CAP_SYS_PTRACE`). |
| **Trace Forgery Protection** | Student stdout bounded and JSON-quoted inside `exit` event | Student stdout cannot inject JSONL records into tracer output stream. |
| **Private Debug Interface** | In-memory pipe connection (`LaunchingConnector`) | JDI debugging sockets are strictly internal and never exposed to any network interface. |

---

## 3. Docker Readiness Verification on Current Host

### Current Host Inspection Results:
- **Host OS:** Windows (detected via PowerShell environment)
- **Docker Command Check (`docker --version`):**
  ```
  docker : The term 'docker' is not recognized as the name of a cmdlet, function, script file, or operable program.
  ```
- **WSL Command Check (`wsl --status`):**
  ```
  The Windows Subsystem for Linux is not installed. You can install by running 'wsl.exe --install'.
  ```

### Current Status: **UNAVAILABLE**
Docker Desktop is not installed or available on the path, and WSL2 is not installed.

---

## 4. Prerequisites & Installation Guide for Windows + WSL2

> [!IMPORTANT]
> In accordance with project safety rules, no system changes or software installations are performed automatically. The user must manually complete these steps when ready.

### Step 1: Verify Hardware Virtualization
1. Open Task Manager (`Ctrl + Shift + Esc`).
2. Go to the **Performance** tab -> **CPU**.
3. Verify that **Virtualization: Enabled** is displayed.
   *(If disabled, enable Intel VT-x or AMD-V in BIOS/UEFI settings).*

### Step 2: Install WSL2
Open an administrative PowerShell prompt and execute:
```powershell
wsl --install --no-distribution
```
*(A system restart may be required).*

### Step 3: Install Docker Desktop for Windows
1. Download Docker Desktop from: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Run the installer and ensure the option **"Use WSL 2 instead of Hyper-V"** is checked.
3. Complete installation and start Docker Desktop.

### Step 4: Verification Commands
Once installed, execute the following commands in PowerShell to verify readiness:
```powershell
# 1. Verify WSL status
wsl --status

# 2. Verify Docker CLI
docker --version

# 3. Verify Docker daemon is running
docker ps

# 4. Run test container with isolation
docker run --rm --network none hello-world
```

---

## 5. Security Limitations & Honest Status

> [!CAUTION]
> **Honest Operational Boundary:**  
> Until Docker Desktop and the containerized runner are operational, **untrusted student Java execution MUST NOT be permitted on the host machine.**  
> JDI alone is a diagnostic introspection interface, not a sandbox boundary.  
> The existing Code Lab continues to use verified deterministic test fixtures, and live execution endpoints remain disabled.
