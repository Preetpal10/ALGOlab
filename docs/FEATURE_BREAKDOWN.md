# ALGOLAB --- Full Feature Breakdown

**Project:** ALGOLAB --- Interactive DSA Coding, Dry-Run, Visualization,
and Learning Platform\
**Version:** 1.0\
**Audience:** Student developer, Antigravity, Claude, project evaluator

## 1. Product vision

ALGOLAB helps students understand Data Structures and Algorithms by
connecting code they write with execution states, visualizations,
explanations, debugging, and practice. The main product experience is
**Write Code → Run → Debug & Visualize → Understand → Fix → Practice**.

The project must retain the existing Algorithm Explorer and Maze Lab.
The primary differentiator is visualizing supported student-written Java
DSA code, not merely animating hard-coded algorithms.

## 2. Technology constraints

-   Frontend: HTML5, CSS3, vanilla JavaScript.
-   Database: SQL, preferably MySQL unless the existing project already
    uses another SQL database.
-   Java is the initial language students write and run inside Code Lab.
-   A server-side JavaScript layer (for example, Node.js) may be used to
    protect database credentials and call execution services. This is a
    backend implementation detail, not a frontend framework migration.
-   Do not migrate the frontend to React, Next.js, Vue, or another
    framework without explicit approval.
-   Do not replace SQL with a NoSQL database.
-   Review the existing project before changing files, routes, design,
    or working features.

## 3. Roles

### Visitor

-   View home page and public learning content.
-   Browse algorithms and Maze Lab demonstrations.
-   Use any guest features explicitly enabled by the application.

### Student

-   Write and run Java code.
-   Visualize supported code execution.
-   Solve practice problems.
-   Review test results and debugging information.
-   Save progress, bookmarks, and sessions when authenticated.
-   Use Algorithm Explorer and Maze Lab.

### Administrator/content manager (later phase)

-   Manage algorithm explanations and practice problems.
-   Manage test cases and learning content.
-   This role is not required for the first MVP unless the evaluator
    requires it.

## 4. Navigation and pages

1.  Home
2.  Code Lab
3.  DSA Practice Arena
4.  Algorithm Explorer
5.  Algorithm Visualizer
6.  Maze Lab
7.  Dashboard / My Progress
8.  Login / Register (when authentication is implemented)
9.  Help / About

The navigation should be consistent across pages. Code Lab should be the
primary call to action.

## 5. Feature priorities

-   **P0:** Required for the first useful working version.
-   **P1:** Required for the first complete demonstration after P0.
-   **P2:** Valuable follow-up features.
-   **P3:** Future enhancements.

## 6. Code Lab --- primary module

### 6.1 Code editor (P0)

-   Editable Java code area.
-   Line numbers and Java syntax highlighting if supported by the
    selected editor.
-   Starter code and example templates.
-   Clear/reset editor with confirmation if unsaved work would be lost.
-   Copy/paste and keyboard-friendly interaction.
-   Keep the editor usable on common laptop screen sizes.
-   Use a library such as CodeMirror only if useful; it does not replace
    the HTML/CSS/JavaScript stack.

**Acceptance criteria** - A student can type, edit, paste, and reset
code. - The current code is the code submitted for execution. -
Resetting is intentional and does not silently discard work.

### 6.2 Input panel (P0)

-   Text area for standard input (stdin).
-   Example input for supported programs.
-   Explain whether the current program expects input.
-   Preserve input when switching between Run and Debug where
    appropriate.

### 6.3 Run Code (P0)

-   Submit Java source and input to a server-side execution service.
-   Display standard output and standard error separately when
    available.
-   Show compilation error, runtime error, timeout, execution failure,
    or success distinctly.
-   Apply execution time, memory, output-size, and request-size limits.
-   Never execute arbitrary Java source directly in the trusted web
    server process.
-   Never expose database credentials or execution-service secrets in
    browser JavaScript.

**Important constraint:** HTML/CSS/JavaScript in the browser cannot
natively compile arbitrary Java source. Real Java execution requires a
Java runtime service or a suitable sandboxed execution provider.

### 6.4 Debug & Visualize (P0 foundational capability; restricted scope)

-   Start a trace for a supported Java program.
-   Highlight the current source line when source mapping is available.
-   Display supported local variables and their values.
-   Display array state and relevant array indices.
-   Display conditions and loop progression when trace data is
    available.
-   Record an ordered sequence of trace states/events.
-   Let the student step forward and backward through recorded states.
-   Explain unsupported constructs honestly; do not fabricate a trace.

**Technical constraint:** A normal code-execution API generally returns
output and errors, not a full debugger trace. A separate tracing
mechanism is required. Use a debugger/instrumentation approach or a
deliberately limited instrumented execution environment. Start with a
narrow supported subset.

### 6.5 Playback controls (P0)

-   Play, pause, next step, previous step, reset, and speed control.
-   Timeline or step counter.
-   Playback controls operate on the trace, not on a separate animation
    that diverges from code execution.
-   Previous Step restores a previously recorded state; it must not
    attempt to reverse arbitrary program operations manually.

### 6.6 Variables inspector (P0)

-   Display relevant variable names and current values.
-   Distinguish unavailable/uninitialized values from actual values.
-   Update based on selected trace state.
-   Explain important value changes in plain language.
-   Avoid dumping huge or sensitive runtime objects.

### 6.7 Array visualization (P0)

-   Show array cells and indices.
-   Highlight the element currently read or written.
-   Animate swaps only when a swap is actually represented by the trace.
-   Show before/after values for supported writes.
-   Explain read, comparison, write, and swap events separately.

### 6.8 Explanation panel (P0)

Every supported visualized event must explain: 1. **What am I seeing?**
2. **What is happening?** 3. **Why is it happening?** 4. **What
changed?** 5. **What comes next?**

Keep the default explanation to one or two beginner-friendly sentences.
Offer an optional expanded concept explanation. Explanations must be
based on actual trace events or a clearly identified predefined
algorithm simulation---not guessed execution.

### 6.9 Error and limitation handling (P0)

-   Explain compilation and runtime errors without claiming the program
    succeeded.
-   Show a clear message when a program runs but its code cannot be
    traced.
-   Show which features are supported for the current trace.
-   If tracing fails, preserve ordinary execution output when available.
-   Avoid displaying a fabricated array/graph state.

## 7. Trace and visualization engine

### 7.1 Trace event model (P0)

Normalize supported events into a consistent internal format. Suggested
event types: - `line` - `variable_init` - `variable_update` -
`condition` - `array_read` - `array_write` - `array_swap` -
`method_call` - `method_return` - `output` - `exception`

An event may contain a source line, variable name, old/new value, array
identifier/index, call depth, and explanation metadata. This is a
conceptual schema; refine it after selecting the tracing implementation.

### 7.2 State history (P0)

-   Store trace states in memory for the current session initially.
-   Support deterministic forward/backward navigation.
-   Use snapshots plus deltas if trace size becomes large.
-   Cap trace length and output size.
-   Do not persist every event to SQL by default.

### 7.3 Visualizer registry (P1)

Reusable visualization components: - Array - Variables/call stack -
Stack and queue - Linked list - Tree/BST - Graph - Sliding window/two
pointers - Maze grid

Only activate specialized visualizers when the trace format or selected
built-in algorithm provides sufficient trustworthy information.

## 8. DSA Practice Arena

### 8.1 Problem library (P1)

Organize problems by topic and difficulty: - Arrays - Strings -
Searching - Sorting - Two pointers - Sliding window - Linked lists -
Stacks and queues - Trees - Graphs - Recursion - Dynamic programming
(later)

Start with 10--15 tested problems rather than a large incomplete
catalogue.

### 8.2 Problem detail page (P1)

Each problem includes: - Title and difficulty - Problem statement -
Input/output description - Constraints - Example cases - Starter Java
code - Run - Submit - Debug & Visualize when supported - Hints -
Explanation and complexity - Related problems

### 8.3 Run versus Submit (P1)

-   **Run:** execute against sample or custom input.
-   **Submit:** evaluate against the configured test suite.
-   **Debug & Visualize:** trace supported execution and show state
    changes.
-   Show passed/failed counts and the failing case where policy allows.
-   Do not expose hidden test inputs in the student-facing response.

### 8.4 Starter problem set (P1)

Recommended initial set: 1. Print/traverse an array 2. Find maximum
element 3. Reverse an array 4. Move zeros 5. Linear Search 6. Binary
Search 7. Bubble Sort 8. Selection Sort 9. Two Sum 10. Valid Palindrome
11. Two Pointers example 12. Longest Substring Without Repeating
Characters 13. Stack operations 14. Reverse Linked List (after
linked-list trace support) 15. BFS on a small graph (after graph trace
support)

## 9. Algorithm Explorer

### 9.1 Categories (P1)

-   Sorting: Bubble, Selection, Insertion, Merge, Quick
-   Searching: Linear, Binary
-   Data structures: Arrays, Stacks, Queues, Linked Lists, Trees/BST
-   Graphs: BFS, DFS, Dijkstra, A\*
-   Complexity: Big O, best/average/worst case, time and space

### 9.2 Algorithm learning page (P1)

Every algorithm page must contain: - What it is - Why it is used - How
it works - Input and expected output - Java example or pseudocode -
Complexity with a plain-language explanation - Interactive
visualization - Current-step explanation - Common mistakes - Related
practice problems

### 9.3 Built-in visualization controls (P1)

-   Custom input and sample input
-   Play/pause
-   Next/previous
-   Reset
-   Speed
-   Current operation and counters where meaningful
-   Explanation synchronized with the actual algorithm state

Built-in algorithm visualizations can be implemented directly in
JavaScript and need not depend on the Java code tracer.

## 10. Maze Lab

### 10.1 Maze creation (P1)

-   Generate maze.
-   Clear/regenerate maze.
-   Set start and destination.
-   Add/remove walls manually.
-   Validate start/destination and grid boundaries.
-   Ensure generated mazes have a path when the selected generator
    promises one.

### 10.2 Algorithms (P1/P2)

-   BFS: first path with the fewest moves in an unweighted grid, if
    reachable.
-   DFS: depth-first exploration; not generally shortest.
-   Dijkstra: minimum-cost path for nonnegative edge weights.
-   A\*: heuristic-guided search; use a suitable heuristic such as
    Manhattan distance for four-direction movement with uniform movement
    costs.

### 10.3 Maze visualization explanation (P1)

Every step explains: - Current cell - Why it is being explored -
Queue/stack/priority state when relevant - Why a cell is blocked or
already visited - What changed - Whether a path has been found - How the
final path was reconstructed

### 10.4 Maze comparison (P2)

Compare explored cells, path length/cost, and result. Keep path length
distinct from explored-cell count. Execution time is optional and should
be measured consistently.

### 10.5 Save maze (P2)

Save grid configuration, start/end positions, selected algorithm,
result/path, and timestamp for authenticated students.

## 11. Supporting modules

### 11.1 Authentication (P2)

-   Register, login, logout.
-   Secure password hashing on the server.
-   Session/authentication management.
-   Authorization checks for user-owned records.
-   Password recovery only if a secure reset flow is implemented.

### 11.2 Progress (P2)

-   Topics visited/completed
-   Quiz attempts and scores
-   Practice submissions
-   Recent activity
-   Avoid treating merely opening a page as proof of mastery.

### 11.3 Bookmarks/history (P2)

-   Save algorithms and problems.
-   View recent items.
-   Save selected visualization sessions only when the stored format is
    useful and bounded.

### 11.4 Quiz system (P2)

-   Topic-specific questions
-   Correct answers and explanations
-   Score calculation
-   Attempt history

### 11.5 Admin/content management (P3)

-   Manage algorithm explanations and problems
-   Manage test cases
-   Validate content before publication

## 12. Cross-cutting requirements

-   Responsive layout for laptop and mobile.
-   Clear empty, loading, success, and error states.
-   Keyboard-accessible controls and visible focus.
-   Consistent color meanings and legends.
-   Do not rely on color alone to convey state.
-   Keep animations understandable and allow reduced motion where
    practical.
-   Explain all icons or unfamiliar controls with labels/tooltips.
-   Never claim a visualization is based on the student's code unless it
    is actually derived from that execution or clearly identified as a
    separate predefined demonstration.

## 13. Recommended implementation order

1.  Audit existing project.
2.  Design Code Lab interface.
3.  Build generic trace player using mock fixtures clearly labelled as
    test data.
4.  Build array and variable panels.
5.  Implement and test built-in algorithm visualizations.
6.  Implement sandboxed Java execution.
7.  Implement a restricted Java tracing proof of concept.
8.  Connect real traces to the playback/visualization engine.
9.  Add practice problems and test cases.
10. Improve Algorithm Explorer and Maze Lab.
11. Add SQL persistence, accounts, progress, and bookmarks.
12. Add more data structures and optional AI hints.

## 14. Definition of done

A feature is complete only when: - It works with valid input. - Invalid
input is handled. - The visual state matches the actual
algorithm/trace. - Its explanation is accurate and beginner-friendly. -
Controls work consistently. - Relevant test cases pass. - Limitations
are disclosed rather than hidden.
