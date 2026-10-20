# ALGOLAB --- System Architecture

**Version:** 1.0\
**Core stack:** HTML, CSS, JavaScript, SQL/MySQL\
**Initial student code language:** Java

## 1. Architecture principles

1.  Preserve the HTML/CSS/JavaScript frontend.
2.  Use SQL for structured persistent data.
3.  Separate code execution from visualization.
4.  Treat runtime traces as the source of truth for live visualization.
5.  Make supported tracing limits explicit.
6.  Reuse visualization components across algorithms.
7.  Never run untrusted Java source in the trusted application process.
8.  Preserve existing working project features and audit files before
    major changes.

## 2. Logical architecture

``` text
Browser
├── HTML pages / navigation
├── CSS layout and animations
└── JavaScript frontend
    ├── Code editor integration
    ├── Execution API client
    ├── Trace playback/state manager
    ├── Explanation renderer
    ├── Array/variable visualizer
    ├── Data-structure visualizers
    ├── Algorithm Explorer
    └── Maze Lab
             |
             | HTTPS / JSON
             v
Server-side JavaScript API
├── Input validation
├── Authentication/authorization (later)
├── Problem and submission routes
├── SQL repository/data access
├── Execution-service adapter
└── Trace-service adapter
      |                     |
      v                     v
SQL database          Sandboxed Java runner
                            |
                            v
                    Java tracing mechanism
                            |
                            v
                    Normalized trace events
                            |
                            v
                 Frontend trace/state playback
```

This is a logical diagram. The tracing mechanism may run in the same
isolated execution environment as the Java program or in a separate
service, depending on the implementation selected.

## 3. Technology responsibilities

### HTML

-   Page structure
-   Code Lab panels
-   Controls
-   Forms and accessible labels

### CSS

-   Layout, responsive behavior, visual states
-   Array-cell and graph-node styling
-   Animations and transitions
-   Reduced-motion support

### Browser JavaScript

-   UI interactions
-   Built-in JavaScript-based algorithm visualizers
-   API requests
-   Trace playback and state history
-   Explanation rules for known event types
-   Rendering arrays, graphs, trees, and maze grids

### Server-side JavaScript

-   API endpoints
-   SQL access
-   Input validation
-   Authentication/authorization
-   Code execution-service integration
-   Trace-service integration
-   Rate limits and request-size controls

### SQL/MySQL

-   Users and account metadata
-   Algorithms and problem content
-   Test-case metadata
-   Submissions and results
-   Progress, bookmarks, quiz results
-   Saved maze configurations

### Java execution service

-   Compile and execute student Java code
-   Accept standard input
-   Return stdout/stderr and execution status
-   Enforce resource limits
-   Run within an isolated environment

### Trace engine

-   Capture supported execution events
-   Map events to source lines when possible
-   Record variable/array/method events
-   Emit a normalized event sequence
-   Reject or mark unsupported constructs honestly

## 4. Critical architectural distinction

Ordinary Java execution and trace generation are different capabilities.

An execution service may return final output, compilation errors, and
runtime errors without providing variable-by-variable history.
Therefore: - Run Code can use a standard sandboxed Java execution
service. - Debug & Visualize must use a separate tracing capability. -
Do not assume an ordinary execution API returns a trace. - Do not fake a
trace by running a hard-coded visualizer and claiming it represents the
submitted code.

For a semester project, define a restricted tracing subset first: basic
local variables, conditions, loops, array reads/writes, and method
calls/returns. Expand only after validating the first implementation.

## 5. Request flows

### 5.1 Run Code

1.  Browser collects source and stdin.
2.  Browser sends request to the server API.
3.  API validates payload and applies rate limits.
4.  API submits code to the sandboxed Java runner.
5.  Runner compiles/executes under resource limits.
6.  API returns status, stdout, stderr, and safe execution metadata.
7.  Browser renders results.

### 5.2 Debug & Visualize

1.  Browser submits source and input to the trace endpoint.
2.  API validates source and requested tracing mode.
3.  Trace environment executes supported code while recording events.
4.  Trace processor normalizes events and source mappings.
5.  API returns bounded trace data or a trace-session identifier.
6.  Browser creates/loads state history.
7.  Student moves through states.
8.  Visualizers and explanation panel render the selected state.

For long traces, prefer a session identifier and paginated/batched trace
retrieval rather than returning an unlimited payload.

### 5.3 Built-in algorithm visualization

1.  Student selects a built-in algorithm.
2.  Browser validates input.
3.  JavaScript algorithm implementation generates steps/events.
4.  State player presents steps.
5.  Explanation rules describe the actual built-in algorithm operation.
6.  Final result is validated against expected test cases.

### 5.4 Maze Lab

1.  Generate or edit a grid.
2.  Validate start/end and grid constraints.
3.  Selected pathfinding algorithm generates exploration events.
4.  Player renders explored cells and queue/stack/distances as
    applicable.
5.  Explanation panel explains each event.
6.  Reconstruct and show the final path if one is found.

## 6. Suggested trace event contract

A normalized event may contain: - `eventId` - `stepIndex` -
`eventType` - `sourceFile` (optional) - `sourceLine` (optional) -
`callDepth` (optional) - `variableName` (optional) - `oldValue` /
`newValue` (optional) - `arrayId` / `index` (optional) -
`conditionResult` (optional) - `methodName` (optional) - `output`
(optional) - `metadata` (bounded, safe, structured data)

Example only:

``` json
{
  "stepIndex": 12,
  "eventType": "array_write",
  "sourceLine": 8,
  "arrayId": "arr",
  "index": 2,
  "oldValue": 8,
  "newValue": 5
}
```

This example defines an event shape, not an implemented API. Final
fields should follow the selected tracer's actual capabilities.

## 7. State management

-   Treat trace events/states as immutable history.
-   The selected step index determines the visible state.
-   Previous Step selects a prior recorded state.
-   Next Step selects the next recorded state.
-   Play advances through the same state sequence at a controlled rate.
-   Reset selects the initial state.
-   Cap number of events and state payload size.
-   Consider snapshot-plus-delta storage if full snapshots become too
    large.

## 8. Explanation engine

Use a deterministic rule-based explanation engine first. - Map supported
event types to beginner-friendly messages. - Include actual values from
the selected trace state. - Separate generic explanation from
algorithm-specific concept notes. - Never invent an event or value. - If
the event is unknown, show a neutral message such as "This operation is
recorded, but ALGOLAB does not yet have a detailed explanation for it."

AI explanations may be a future enhancement, but must be grounded in
actual trace data and should not replace execution.

## 9. Data architecture

Suggested relational entities: - Users - AlgorithmCategories -
Algorithms - Problems - TestCases - Submissions - ExecutionSessions -
QuizQuestions - QuizResults - UserProgress - Bookmarks - MazeHistory

Use primary keys, foreign keys, appropriate indexes, parameterized SQL,
and migration/seed scripts. Keep passwords hashed server-side. Do not
store full trace payloads indefinitely by default.

## 10. API outline

Possible routes; refine before implementation: - `POST /api/execute` ---
ordinary code execution - `POST /api/trace` --- start supported trace -
`GET /api/trace/:id` --- fetch trace metadata or bounded events -
`GET /api/problems` --- list problems - `GET /api/problems/:id` ---
problem detail - `POST /api/problems/:id/run` --- run against
sample/custom input - `POST /api/problems/:id/submit` --- evaluate
configured test cases - `GET /api/algorithms` --- list algorithms -
`GET /api/mazes/:id` --- retrieve a saved maze (later) -
`POST /api/mazes` --- save a maze (later) - `POST /api/auth/register`,
`/api/auth/login` --- when authentication is implemented

Never trust a user-supplied user ID without verifying the authenticated
session.

## 11. Security and reliability

-   Sandboxed code execution with strict CPU/time/memory/output limits.
-   No direct browser-to-MySQL connections.
-   No secrets in frontend files.
-   Request size limits and rate limiting.
-   Parameterized SQL.
-   Authentication and authorization on private records.
-   Hide hidden test input/output.
-   Restrict trace size and execution duration.
-   Gracefully handle runner unavailability.
-   Do not render student output as trusted HTML; escape it.
-   Log operational failures without logging passwords or secrets.

## 12. Deployment

For local development: - Static frontend served locally or by the
server. - Server-side JavaScript API. - SQL database. - Sandboxed Java
execution service or a clearly documented local runner. - Environment
variables for credentials and service endpoints.

Do not commit `.env` files or credentials to GitHub. Document setup and
expected service dependencies in README.

## 13. Architecture decision gates

Before implementing tracing, test a proof of concept that can: 1.
Compile/run a small Java program. 2. Capture a source line. 3. Capture a
local variable change. 4. Capture an array write. 5. Produce
deterministic replayable states. 6. Stop safely on timeout. If these
cannot be achieved with the selected execution service, revise the
tracing approach before building the full UI around it.
