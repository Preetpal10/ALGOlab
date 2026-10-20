# ALGOLAB — Technical Documentation

## 1. System Overview

ALGOLAB is an interactive Data Structures & Algorithms learning platform constructed as a decoupled, multi-tier web application:

1. **Client Tier (Frontend):** Pure HTML5, Vanilla CSS3, and ES6 JavaScript modules. No heavyweight virtual DOM frameworks or CSS frameworks are employed.
2. **Application Server Tier (Backend Runner):** A lightweight Node.js (v18+) service running an HTTP server (native `node:http`) listening on port 3001. Handles CORS, session management, judging, rate limiting, and process orchestration.
3. **Execution Sandbox Tier:** An isolated Docker container (`algolab-runner:latest`) based on OpenJDK 17. Compiles student Java code and executes it under JDI (`Tracer.java`) to emit JSONL execution events.
4. **Data Tier:** A MySQL 8.0 relational database storing student accounts, persistent sessions, submission records, problem progress, and laboratory configurations.

---

## 2. Frontend Architecture

### 2.1 UI Layout & Navigation System
All 14 platform pages (`index.html`, `codelab.html`, `practice.html`, `dashboard.html`, `visualizer.html`, `stack.html`, `queue.html`, `linkedlist.html`, `tree.html`, `graph.html`, `maze.html`, `algorithms.html`, `login.html`, `register.html`) share a standardized layout:
- **Collapsible Sidebar (`#app-sidebar`):** Dark slate theme (`#0f172a`), fixed at 260px desktop width, collapsible via toggle button.
- **Top Bar (`.app-topbar`):** Provides hamburger menu button for mobile drawer navigation (< 900px), brand identity, quick links, and authentication status.
- **Main Content Area (`.app-main`):** Light slate background (`#f8fafc`) housing module cards, visualizer canvases, and editors.

### 2.2 Client-Side Visualizer Engines
- **`visualizer.js`:** Pure functional step generators for Bubble Sort, Selection Sort, Insertion Sort, Linear Search, and Binary Search. Steps yield array snapshots, comparing indices, swap flags, and status text.
- **`stack.js` & `queue.js`:** StackEngine and QueueEngine maintaining history timelines, underflow guards, and DOM element transitions.
- **`linkedlist.js`:** LinkedListEngine maintaining head, tail, and node pointers with traversal animation states.
- **`tree.js`:** TreeEngine maintaining Binary Search Tree (BST) recursive algorithms with SVG node rendering and level-order traversal coordinate layout.
- **`graph.js`:** GraphEngine managing vertex list and adjacency matrix, computing BFS and DFS traversals with visited node markers.
- **`maze.js`:** Grid pathfinding engine with wall toggles, start/end markers, and BFS/DFS queue/stack visualizations.

### 2.3 Code Lab & Trace Playback
- **`TracePlaybackEngine` (`js/playback-engine.js`):** Ingests JSONL trace arrays emitted by the server. Manages timeline stepping (`stepNext()`, `stepPrev()`, `goToStep()`), variable inspection (`getCurrentStep()`), auto-play intervals, and line gutter highlighting.
- **`ExplanationEngine` (`js/explanation-engine.js`):** Inspects step differences (array updates, variable reassignments, loop evaluations) and maps them to educational Markdown explanations.

---

## 3. Backend Architecture

### 3.1 HTTP Server & Middleware (`server.js`)
- **Port & Host:** Binds to `127.0.0.1:3001` by default.
- **CORS Handling:** Dynamically checks `Origin` header against approved origins (`http://localhost:8000`, `http://127.0.0.1:8000`, configured Netlify/domain origins). Rejects unapproved origins with 403 Forbidden.
- **Rate Limiting & Concurrency:** Restricts concurrent compilations via `MAX_CONCURRENCY=2`. Incoming requests beyond capacity receive HTTP 429 Too Many Requests.
- **Request Deadlines:** Requests are bounded by a 25,000ms server deadline.
- **Session Authentication:** Reads `algolab_session` cookie, verifies existence in `sessions` table, and checks `expires_at` against current UTC time.

### 3.2 Judging Engine (`judge.js`)
- Evaluates student solutions against authoritative problem test cases.
- Normalizes student stdout (strips trailing whitespace, collapses multiple spaces, normalizes CRLF).
- Sanitizes compiler errors, removing internal container file paths (`/sandbox/build/`) and host paths.
- Enforces fail-fast execution in `submit` mode; evaluates all test cases in `sample` mode.
- Redacts hidden test case inputs and expected outputs on failure to prevent hardcoded solutions.

---

## 4. Docker Execution Sandbox & JDI Instrumentation

### 4.1 Container Isolation Parameters (`docker-runner.js`)
```javascript
const dockerArgs = [
  'run',
  '--rm',
  '--network', 'none',            // Block all network sockets
  '--read-only',                 // Disallow filesystem writes
  '--memory', '256m',             // Hard RAM ceiling
  '--cpus', '1.0',                // Max 1 CPU core
  '--pids-limit', '64',           // Prevent fork bombs
  '--user', '1001:1001',          // Run as non-root user
  '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
  '-v', `${tempDir}:/sandbox:ro`, // Read-only source mounting
  'algolab-runner:latest',
  'java', '-cp', '/app/tracer:/sandbox', 'tracer.Tracer',
  '--source', `/sandbox/${mainClass}.java`
];
```

### 4.2 JDI Execution Tracer (`Tracer.java`)
- Uses `com.sun.jdi.Bootstrap.virtualMachineManager()`.
- Spawns target JVM with `CommandLineLaunch`.
- Configures `MethodEntryRequest` on `main(String[] args)` and `StepRequest(STEP_LINE, STEP_INTO)`.
- At each line event:
  - Retrieves `Location.lineNumber()` and `Method.name()`.
  - Introspects `StackFrame.visibleVariables()` and extracts primitive/string values.
  - Inspects array references via `ArrayReference.getValues()`.
  - Serializes snapshot to stdout formatted as a single JSON line.
- Enforces truncation limits (`maxEvents: 1000`, `maxArrayLength: 50`, `maxStringLength: 100`) to prevent memory exhaustion.

---

## 5. End-to-End Application Workflow

```
1. Student writes Java solution in Practice Arena or Code Lab.
2. Client sends HTTP POST to /api/judge or /api/execute with JSON payload.
3. Server validates request headers, content-length (<= 128 KB), and source code.
4. Server writes source to unique temporary directory (e.g., /tmp/algolab_job_xxx).
5. Docker spawns ephemeral container mounting directory as read-only.
6. OpenJDK compiles and JDI Tracer instruments program line-by-line.
7. Tracer streams JSONL events to container stdout.
8. docker-runner collects stdout, parses events, and deletes temp directory.
9. Server classifies execution result (Accepted, Wrong Answer, Compilation Error, Timeout).
10. If authenticated, server persists record to MySQL submissions table.
11. Client receives JSON response, updates verdict badge, and renders results.
```
