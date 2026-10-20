# ALGOLAB — REST API Documentation

## 1. Overview & Conventions

The ALGOLAB Backend Runner exposes a RESTful JSON API on port 3001 (default: `http://127.0.0.1:3001`).

- **Data Format:** All request and response bodies use `application/json`.
- **CORS Policy:** Strict origin checking. Whitelisted local origins (`http://localhost:8000`, `http://127.0.0.1:8000`) and configured domains receive CORS headers with credentials allowed.
- **Authentication:** Session cookie `algolab_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`).
- **Standard Error Format:**
  ```json
  {
    "error": "Descriptive human-readable error message"
  }
  ```

---

## 2. API Endpoints

### 2.1 Health Check Probe
`GET /api/health`

Checks server status, reachability, and version.

**Authentication:** None  
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "algolab-runner",
  "version": "1.0.0"
}
```

---

### 2.2 Student Registration
`POST /api/auth/register`

Creates a new student account, hashes password via bcrypt, creates a persistent session, and sets the `algolab_session` cookie.

**Authentication:** None  
**Request Body:**
```json
{
  "name": "Preetpal Singh",
  "email": "preetpal@example.com",
  "password": "SecretPassword123"
}
```
**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "Preetpal Singh",
    "email": "preetpal@example.com"
  }
}
```
**Error Responses:**
- `400 Bad Request`: Validation failure (name missing, invalid email, password < 8 characters).
- `409 Conflict`: Email address already registered.

---

### 2.3 Student Login
`POST /api/auth/login`

Authenticates credentials, creates a new session in MySQL, and returns an `HttpOnly` cookie.

**Authentication:** None  
**Request Body:**
```json
{
  "email": "preetpal@example.com",
  "password": "SecretPassword123"
}
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Preetpal Singh",
    "email": "preetpal@example.com"
  }
}
```
**Error Responses:**
- `401 Unauthorized`: Invalid email or password.

---

### 2.4 Student Logout
`POST /api/auth/logout`

Invalidates the active session in MySQL and instructs client to clear `algolab_session` cookie.

**Authentication:** Required (`algolab_session` cookie)  
**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 2.5 Current User Profile
`GET /api/auth/me`

Retrieves the currently authenticated student profile.

**Authentication:** Required  
**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "name": "Preetpal Singh",
    "email": "preetpal@example.com"
  }
}
```
**Error Responses:**
- `401 Unauthorized`: No active session found.

---

### 2.6 Code Lab Execution & JDI Tracing
`POST /api/execute`

Executes student Java code inside an ephemeral Docker container and returns the JDI execution trace.

**Authentication:** None  
**Request Body:**
```json
{
  "code": "public class Main { public static void main(String[] args) { int x = 42; System.out.println(x); } }",
  "mainClass": "Main",
  "stdin": ""
}
```
**Response (200 OK):**
```json
{
  "outcome": "success",
  "containerExitCode": 0,
  "stepCount": 2,
  "events": [
    {
      "type": "step",
      "line": 1,
      "method": "main",
      "variables": { "args": { "type": "java.lang.String[]", "value": "[]" } }
    },
    {
      "type": "step",
      "line": 1,
      "method": "main",
      "variables": { "x": { "type": "int", "value": 42 } }
    },
    {
      "type": "exit",
      "exitCode": 0,
      "stdout": "42\n",
      "stderr": ""
    }
  ],
  "exitEvent": { "stdout": "42\n" }
}
```
**Error Outcomes (200 OK with specific outcome):**
- `compilation_error`: Syntax errors or missing symbols.
- `timeout`: Infinite loop execution exceeded deadline.
- `runtime_error`: Uncaught Java exception.
- `503 Service Unavailable`: Docker daemon unavailable.

---

### 2.7 Public Problem Catalog
`GET /api/problems`

Returns list of public problems. Strips secret evaluation test cases.

**Authentication:** None  
**Response (200 OK):**
```json
{
  "problems": [
    {
      "id": "reverse-array",
      "title": "Reverse an Array",
      "difficulty": "Easy",
      "topic": "Arrays",
      "description": "Given an array of integers, reverse the array...",
      "sampleCases": [
        { "id": 1, "input": "5\n1 2 3 4 5", "expectedOutput": "5 4 3 2 1" }
      ],
      "starterCode": "public class Solution { ... }"
    }
  ]
}
```

---

### 2.8 Practice Arena Solution Judging
`POST /api/judge`

Evaluates code against sample or hidden test suite. Automatically records submission in MySQL if authenticated.

**Authentication:** Optional  
**Request Body:**
```json
{
  "problemId": "reverse-array",
  "code": "public class Solution { public static void main(String[] args) { ... } }",
  "mode": "submit"
}
```
**Response (200 OK):**
```json
{
  "verdict": "Accepted",
  "passedCount": 5,
  "totalCount": 5,
  "executionTimeMs": 142
}
```
**Sample Mode Response (`mode: "sample"`):**
```json
{
  "verdict": "Accepted",
  "passedCount": 2,
  "totalCount": 2,
  "sampleResults": [
    { "testNumber": 1, "passed": true, "input": "5\n1 2 3 4 5", "expectedOutput": "5 4 3 2 1", "actualOutput": "5 4 3 2 1" }
  ]
}
```

---

### 2.9 Submission History
`GET /api/submissions`

Returns chronological list of submissions for the authenticated student.

**Authentication:** Required  
**Response (200 OK):**
```json
{
  "submissions": [
    {
      "id": 101,
      "problemId": "reverse-array",
      "verdict": "Accepted",
      "passedTests": 5,
      "totalTests": 5,
      "executionTimeMs": 142,
      "createdAt": "2026-10-21T01:30:00.000Z"
    }
  ]
}
```

---

### 2.10 Problem Progress
`GET /api/progress`

Returns solve status summary for the authenticated student.

**Authentication:** Required  
**Response (200 OK):**
```json
{
  "solvedCount": 3,
  "totalProblems": 5,
  "progress": [
    { "problemId": "reverse-array", "isSolved": true, "firstSolvedAt": "2026-10-21T01:30:00.000Z" },
    { "problemId": "find-largest", "isSolved": true, "firstSolvedAt": "2026-10-21T01:35:00.000Z" }
  ]
}
```

---

### 2.11 Laboratory Working State
`GET /api/lab-state/:labId` & `PUT /api/lab-state/:labId`

Retrieves or persists cross-device laboratory state JSON (e.g., `codelab`, `stack`, `tree`).

**Authentication:** Required  
**PUT Request Body:**
```json
{
  "code": "...",
  "template": "bubble-sort",
  "timestamp": 1729450000000
}
```
**Response (200 OK):**
```json
{
  "message": "Lab state saved successfully"
}
```
