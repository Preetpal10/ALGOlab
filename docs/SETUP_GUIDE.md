# ALGOLAB — Local Environment Setup Guide

This guide provides complete, step-by-step instructions for running ALGOLAB locally on **Windows 10/11 using PowerShell**.

---

## 1. System Requirements

- **Operating System:** Windows 10/11 64-bit
- **Shell:** Windows PowerShell (Run as Administrator for service setup)
- **Node.js:** v18.0.0 or later ([Download](https://nodejs.org/))
- **MySQL Server:** 8.0 or later ([Download](https://dev.mysql.com/downloads/installer/))
- **Java Development Kit:** OpenJDK 17 or Oracle JDK 17+ ([Download](https://adoptium.net/))
- **Docker Desktop:** Required for live sandboxed Java execution ([Download](https://www.docker.com/products/docker-desktop/))

Verify installations in PowerShell:
```powershell
node -v
npm -v
javac -version
mysql --version
docker --version
```

---

## 2. Step-by-Step Installation

### Step 2.1: Clone the Repository
```powershell
cd $HOME\Downloads
git clone https://github.com/Preetpal10/ALGOLab.git ALGOLAB
cd ALGOLAB
```

### Step 2.2: Configure Environment Files
Copy the example environment templates:
```powershell
Copy-Item .env.example .env
Copy-Item backend/runner/.env.example backend/runner/.env
```

Open `backend/runner/.env` and specify your local MySQL credentials:
```env
# Server Port & Binding
PORT=3001
HOST=127.0.0.1

# MySQL Database Connection
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=algolab
DB_USER=algolab_app
DB_PASSWORD=your_actual_password_here
DB_CONNECTION_LIMIT=10

# CORS Allowed Origins
ALLOWED_ORIGIN=http://localhost:8000,http://127.0.0.1:8000
```
> **Security Note:** Never commit `backend/runner/.env` to Git. It is automatically ignored by `.gitignore`.

### Step 2.3: Initialize the MySQL Database
Log into MySQL using the root account:
```powershell
mysql -u root -p
```
Run the following SQL commands to create the database and dedicated application user:
```sql
CREATE DATABASE IF NOT EXISTS algolab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'algolab_app'@'localhost' IDENTIFIED BY 'your_actual_password_here';
GRANT ALL PRIVILEGES ON algolab.* TO 'algolab_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 2.4: Install Backend Dependencies & Run Migrations
Navigate to `backend/runner`:
```powershell
cd backend/runner
npm install
npm run db:migrate
```
Expected output:
```
[MIGRATION SUCCESS] Database 'algolab' schema created/verified successfully.
```

### Step 2.5: Build Docker Runner Image (For Sandboxed Java Execution)
Ensure Docker Desktop is running, then build the runner image from `backend/runner`:
```powershell
docker build -t algolab-runner:latest .
```
*(If Docker is not installed, ALGOLAB can still run in Offline Demo mode with pre-recorded traces).*

---

## 3. Starting the Services

### Terminal 1: Start Backend Runner
In PowerShell, from `backend/runner`:
```powershell
npm start
```
Expected output:
```
ALGOLAB Execution Runner listening on http://127.0.0.1:3001
Health check: http://127.0.0.1:3001/api/health
```

### Terminal 2: Serve the Frontend
In a separate PowerShell window, navigate to the `frontend` directory and serve via Python's built-in HTTP server:
```powershell
cd C:\Users\m s i\Downloads\ALGOLAB-frontend_3\frontend
python -m http.server 8000
```
Or alternatively via Node `npx serve`:
```powershell
npx -y serve -l 8000 frontend
```

---

## 4. Accessing the Application

Open your browser (Chrome, Edge, Firefox) and navigate to:
```
http://localhost:8000
```

- **Practice Arena:** `http://localhost:8000/practice.html`
- **Code Lab:** `http://localhost:8000/codelab.html`
- **Dashboard:** `http://localhost:8000/dashboard.html`
- **Visualizers:** `http://localhost:8000/visualizer.html`, `stack.html`, `tree.html`, etc.

---

## 5. Troubleshooting & FAQ

1. **"Backend Offline" in Practice Arena:**
   - Verify that Terminal 1 running `npm start` in `backend/runner` is active on port 3001.
   - Test `curl http://127.0.0.1:3001/api/health`.

2. **"Judge Unavailable (503)" on Code Run:**
   - Docker Desktop is not started or `algolab-runner:latest` image is not built. Start Docker Desktop and verify with `docker ps`.

3. **Database Authentication Error (`ER_ACCESS_DENIED_ERROR`):**
   - Check `backend/runner/.env` to ensure `DB_USER` and `DB_PASSWORD` match the user created in MySQL.
