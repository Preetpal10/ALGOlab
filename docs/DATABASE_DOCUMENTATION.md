# ALGOLAB — Database Documentation

## 1. Database Overview

The ALGOLAB database tier provides persistent, multi-device storage for student authentication, session management, judging submission history, problem progress tracking, and laboratory working states.

- **DBMS:** MySQL Server 8.0
- **Database Name:** `algolab`
- **Default Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Storage Engine:** InnoDB (ACID-compliant, foreign-key constraints enabled)
- **Driver:** `mysql2` (Connection Pool managed in `backend/runner/db/connection.js`)
- **Migration Script:** `backend/runner/db/migrate.js` (DDL source: `backend/runner/db/schema.sql`)

---

## 2. Table Schemas & Specifications

### 2.1 `users` Table
Stores registered student accounts with securely hashed passwords.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Unique student user identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Student full name |
| `email` | `VARCHAR(191)` | `NOT NULL UNIQUE` | Account email (login credential) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Salted bcrypt password hash |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Last profile modification |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY idx_users_email (email)`

---

### 2.2 `sessions` Table
Stores persistent, server-managed authentication sessions associated with client cookies.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `session_id` | `VARCHAR(128)` | `PRIMARY KEY` | Cryptographically random hex token |
| `user_id` | `INT` | `NOT NULL, FK -> users(id)` | Associated student user |
| `expires_at` | `DATETIME` | `NOT NULL` | Session expiry time (typically 7 days) |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Session creation timestamp |

**Foreign Keys & Cascades:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `PRIMARY KEY (session_id)`
- `INDEX idx_sessions_user (user_id)`
- `INDEX idx_sessions_expires (expires_at)`

---

### 2.3 `submissions` Table
Records every formal solution submission evaluated by the Practice Arena judging engine.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Unique submission identifier |
| `user_id` | `INT` | `NOT NULL, FK -> users(id)` | Submitting student |
| `problem_id` | `VARCHAR(64)` | `NOT NULL` | Problem slug (e.g., `reverse-array`) |
| `source_code` | `MEDIUMTEXT` | `NOT NULL` | Exact submitted Java source code |
| `verdict` | `VARCHAR(32)` | `NOT NULL` | `Accepted`, `Wrong Answer`, `Compilation Error`, etc. |
| `passed_tests` | `INT` | `NOT NULL DEFAULT 0` | Count of passed test cases |
| `total_tests` | `INT` | `NOT NULL DEFAULT 0` | Total test cases in evaluation suite |
| `execution_time_ms` | `INT` | `NULL` | Wall-clock execution time in milliseconds |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Submission timestamp |

**Foreign Keys & Cascades:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_submissions_user_created (user_id, created_at DESC)`
- `INDEX idx_submissions_problem (problem_id)`
- `INDEX idx_submissions_verdict (verdict)`

---

### 2.4 `problem_progress` Table
Tracks whether each registered student has solved specific problems.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Unique progress entry identifier |
| `user_id` | `INT` | `NOT NULL, FK -> users(id)` | Student identifier |
| `problem_id` | `VARCHAR(64)` | `NOT NULL` | Problem slug |
| `is_solved` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | True if user ever earned `Accepted` |
| `first_solved_at` | `DATETIME` | `NULL` | Timestamp when first accepted |
| `last_attempt_at` | `DATETIME` | `NOT NULL` | Timestamp of most recent attempt |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Record modification timestamp |

**Foreign Keys & Cascades:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

**Unique Constraints & Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY uq_user_problem (user_id, problem_id)`
- `INDEX idx_progress_user (user_id)`
- `INDEX idx_progress_user_solved (user_id, is_solved)`

---

### 2.5 `lab_states` Table
Persists active working drafts and visualizer setups across devices.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Unique record identifier |
| `user_id` | `INT` | `NOT NULL, FK -> users(id)` | Student identifier |
| `lab_id` | `VARCHAR(64)` | `NOT NULL` | Laboratory module slug (e.g., `codelab`) |
| `state_json` | `MEDIUMTEXT` | `NOT NULL` | Serialized JSON state |
| `updated_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | State update timestamp |

**Foreign Keys & Cascades:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

**Unique Constraints & Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE KEY uq_user_lab (user_id, lab_id)`
- `INDEX idx_lab_states_user (user_id)`

---

## 3. Database Migration & Connection Pooling

### Connection Pool Configuration (`db/connection.js`)
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'algolab_app',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'algolab',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
});
```

### Running Migration
To execute the schema DDL against your MySQL server:
```powershell
npm run db:migrate
```
The script reads `schema.sql`, connects with credentials loaded from `backend/runner/.env`, creates tables if they do not exist, and reports status.
