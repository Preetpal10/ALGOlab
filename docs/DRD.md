# ALGOLAB --- Detailed Requirements Document (DRD)

**Version:** 1.0\
**Purpose:** Detailed, testable requirements for implementation and
evaluation

## 1. Scope

This document translates ALGOLAB's product vision into requirements that
can be implemented and verified. The initial target is a
student-friendly web application using HTML, CSS, JavaScript, SQL/MySQL,
and Java as the first language executed in Code Lab.

## 2. Requirement identifiers

-   UI: Interface
-   CODE: Code Lab and execution
-   TRACE: Runtime tracing
-   VIS: Visualization
-   PRACTICE: Practice Arena
-   ALG: Algorithm Explorer
-   MAZE: Maze Lab
-   DATA: Database/persistence
-   SEC: Security
-   DOC: Documentation

## 3. UI requirements

### UI-01 Navigation

The application shall provide consistent navigation to Code Lab,
Practice, Algorithm Explorer, and Maze Lab.

**Verification:** Open each navigation item from at least two pages and
confirm it routes to the correct destination.

### UI-02 Responsive layout

Core pages shall remain usable at common laptop and tablet widths.

**Verification:** Check layout, scrolling, controls, and code editor at
multiple viewport sizes.

### UI-03 Beginner-friendly labels

Controls shall use clear labels; unfamiliar icons shall have tooltips or
text labels.

**Verification:** A first-time student can identify Run, Debug &
Visualize, Next Step, Previous Step, Reset, and explanation controls.

### UI-04 Visualization legend

Each visualizer shall provide a legend explaining the meaning of colors,
borders, and markers.

**Verification:** The user can identify the current item, visited item,
wall, path, and other displayed states without guessing.

## 4. Code execution requirements

### CODE-01 Source submission

The application shall submit the current Java source and selected input
to the server-side execution layer.

### CODE-02 Result classification

The result shall distinguish success, compilation failure, runtime
failure, timeout, runner error, and unsupported tracing.

### CODE-03 Resource limits

Execution shall be bounded by configurable time, memory, output, and
request-size limits.

### CODE-04 Output safety

Program output shall be rendered as text, not trusted HTML.

### CODE-05 Honest behavior

The application shall not show a successful result if the runner reports
a failure.

## 5. Trace requirements

### TRACE-01 Supported subset

The team shall document which Java constructs can be traced in each
release.

### TRACE-02 Source mapping

For trace events with valid source mappings, the UI shall highlight the
associated source line.

### TRACE-03 Variables

The variable panel shall match values recorded for the selected trace
state.

### TRACE-04 Array state

Array visualization shall match recorded values and indices.

### TRACE-05 State navigation

Next and Previous shall move between stored states and restore the
correct corresponding values.

### TRACE-06 Playback

Play and Pause shall advance/pause the selected trace sequence without
changing the underlying order.

### TRACE-07 Reset

Reset shall return to the initial recorded state.

### TRACE-08 Trace limits

The tracer shall stop or truncate traces according to configured limits
and tell the student when the trace is incomplete.

### TRACE-09 Unsupported operation

Unsupported code shall produce a clear limitation message rather than a
fabricated visual state.

### TRACE-10 Trace integrity

The visible trace must be derived from the submitted program's execution
or be clearly labelled as a separate built-in demonstration.

## 6. Explanation requirements

### VIS-01 Explanation on every supported step

Each supported visualized event shall have a plain-language explanation.

### VIS-02 Explanation format

The default explanation shall answer as many of these as relevant: -
What is being shown? - What is happening? - Why is it happening? - What
changed? - What comes next?

### VIS-03 Accuracy

Values and outcomes mentioned in the explanation shall match the
selected state/event.

### VIS-04 Complexity explanation

Complexity pages shall explain notation in beginner-friendly language
and distinguish theoretical complexity from measured runtime.

### VIS-05 Empty/unavailable state

If a visualizer cannot interpret the current program, it shall explain
that the visualization is unavailable for the current trace while
preserving other useful output.

## 7. Built-in algorithm requirements

### ALG-01 Input

Each built-in visualizer shall accept valid sample or custom input.

### ALG-02 Controls

Each applicable visualizer shall support play, pause, next, previous,
reset, and speed controls.

### ALG-03 Correctness

The final visualized state shall match the result of the implemented
algorithm.

### ALG-04 Algorithm-specific explanation

Each step shall explain the operation being performed.

### ALG-05 Complexity

Each algorithm page shall include correct best/average/worst time
complexity where applicable and auxiliary space complexity.

### ALG-06 Initial algorithm set

First release should prioritize array traversal, Linear Search, Binary
Search, Bubble Sort, and Selection Sort. Expand after tests pass.

## 8. Practice Arena requirements

### PRACTICE-01 Problem statement

Each problem shall show statement, examples, constraints, and supported
language.

### PRACTICE-02 Run

Run shall evaluate the current code against selected sample/custom
input.

### PRACTICE-03 Submit

Submit shall evaluate against the configured problem test suite.

### PRACTICE-04 Result details

The result shall show pass/fail counts and safe diagnostic information.

### PRACTICE-05 Hidden tests

Hidden test inputs and expected outputs shall not be disclosed.

### PRACTICE-06 Debug

When tracing is supported, a failed case shall be selectable for Debug &
Visualize.

### PRACTICE-07 Hints

Hints shall be optional and progressively reveal more help.

## 9. Maze Lab requirements

### MAZE-01 Grid editing

The student shall be able to generate, clear, and edit a maze, and set
start/end cells.

### MAZE-02 Validation

Start and destination must be valid traversable cells; invalid grid
states shall be handled clearly.

### MAZE-03 BFS

BFS shall use queue-based level-order exploration and return a shortest
path by number of moves in an unweighted grid when a path exists.

### MAZE-04 DFS

DFS shall show depth-first exploration and backtracking; the UI shall
not claim it always finds a shortest path.

### MAZE-05 Dijkstra/A\*

Weighted pathfinding shall only be enabled when costs and heuristic
assumptions are defined and valid.

### MAZE-06 Explanation

Every meaningful maze step shall explain the current cell, reason for
exploration, and relevant queue/stack/distance state.

### MAZE-07 Metrics

Path length/cost and explored-cell count shall be separate metrics.

## 10. SQL/data requirements

### DATA-01 Relational integrity

Tables shall use primary keys and foreign keys where appropriate.

### DATA-02 Parameterized queries

All database queries involving user input shall use parameterized
queries or an equivalent safe query mechanism.

### DATA-03 Password handling

Passwords shall never be stored in plain text.

### DATA-04 User ownership

A student shall only read or modify private records authorized for that
student.

### DATA-05 Persistence

Records claimed as saved shall still be available after a new
session/reload.

### DATA-06 Minimal trace persistence

Full execution traces shall not be retained indefinitely unless a clear
feature requires it.

## 11. Security requirements

### SEC-01 Isolation

Untrusted student code shall execute in an isolated environment, not
directly inside the trusted application server.

### SEC-02 Limits

Enforce execution time, memory, output, and request limits.

### SEC-03 Secrets

Database passwords and execution-service credentials shall remain
server-side and outside source control.

### SEC-04 Input validation

Validate code payload size, stdin size, problem identifiers, and all
other request data.

### SEC-05 Rate limits

Apply appropriate limits to code execution and submission endpoints.

### SEC-06 HTML injection

Render student source/output as text or safely escaped content.

## 12. Testing requirements

-   Unit-test built-in algorithms with normal, edge, empty, and invalid
    inputs where applicable.
-   Verify trace state against a small known Java program.
-   Verify source line, variable value, and array value synchronization.
-   Verify backward and forward playback.
-   Verify explanation accuracy for each supported event type.
-   Test compilation/runtime errors and timeouts.
-   Test BFS shortest-path behavior on unweighted grids.
-   Test DFS behavior without asserting shortest path.
-   Test SQL persistence and user authorization.
-   Test the UI at different viewport sizes.

## 13. Release gates

### Gate A --- UI prototype

Navigation and panels work; mock trace data is clearly labelled.

### Gate B --- execution

Java code can execute safely and results/errors are correctly shown.

### Gate C --- tracing proof of concept

At least one supported program generates a real trace with source line,
variable update, and array state.

### Gate D --- core learning MVP

Array/variable trace player and selected built-in visualizers have
accurate explanations.

### Gate E --- practice and Maze Lab

Practice test cases and Maze Lab work correctly.

### Gate F --- final project

Persistence, security, testing, documentation, and demonstration are
complete to the agreed scope.
