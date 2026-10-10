# ALGOLAB --- Product Requirements Document (PRD)

**Version:** 1.0\
**Status:** Product definition for implementation\
**Primary users:** Students learning Java and DSA

## 1. Product summary

ALGOLAB is a browser-based learning platform that helps students write
Java DSA code, execute it, inspect supported execution states, visualize
arrays and data structures, understand each operation through
plain-language explanations, debug incorrect solutions, and practice
coding problems. It retains the existing Algorithm Explorer and Maze
Lab.

## 2. Problem statement

Students often struggle to connect source code to runtime behavior.
Static tutorials show code and final output but may not reveal changing
variables, loop iterations, array modifications, pointer movement,
recursion, or graph exploration. Traditional algorithm animations are
useful but often visualize a predefined algorithm rather than the
student's own implementation.

ALGOLAB addresses this by connecting: - Student-authored code - Real
execution and trace data where supported - Step-by-step playback -
Visual representations of supported structures - Simple explanations
synchronized to execution - Practice problems and debugging feedback

## 3. Product goals

1.  Make code execution understandable to beginner DSA students.
2.  Let students run Java code from a browser-based editor.
3.  Provide truthful line-by-line tracing for a clearly defined
    supported subset.
4.  Synchronize source-line highlighting, variables, arrays, and
    explanations.
5.  Retain and improve built-in algorithm visualizations and Maze Lab.
6.  Offer practice problems with test-case feedback.
7.  Use HTML, CSS, JavaScript, and SQL as the project's core technology
    direction.
8.  Keep the codebase understandable and suitable for a third-semester
    B.Tech project.

## 4. Non-goals for the first version

-   Perfect visualization of every possible Java program.
-   Multiple programming languages.
-   Full commercial-scale competitive programming judge.
-   Distributed execution infrastructure.
-   AI-generated explanations as the source of truth for runtime events.
-   A full administrator CMS.
-   Advanced concurrency, multithreading, reflection, native calls, or
    arbitrary library visualization.
-   Rewriting the frontend in React/Next.js or replacing SQL with NoSQL.

## 5. Target personas

### Persona A: Beginner DSA student

Needs simple explanations of loops, variables, arrays, conditions, and
functions.

### Persona B: Student debugging a solution

Needs to inspect a failed test case, understand variable changes, and
locate where behavior diverges from expectations.

### Persona C: Student learning an algorithm

Needs a built-in visual demonstration, Java example, complexity
explanation, and related practice.

### Persona D: Student learning graphs

Needs to generate a maze, watch BFS/DFS/pathfinding, and understand the
role of queue, stack, visited set, distances, and path reconstruction.

## 6. Key user journeys

### Journey 1: Run code

1.  Open Code Lab.
2.  Enter Java code and optional input.
3.  Click Run.
4.  See output or a clearly classified error.
5.  Edit and rerun.

### Journey 2: Visualize supported code

1.  Enter a supported Java program.
2.  Click Debug & Visualize.
3.  View current source line, variables, and relevant array/data
    structure.
4.  Read the current-step explanation.
5.  Move forward/backward or play/pause.
6.  Reset or inspect another step.

### Journey 3: Solve a problem

1.  Open DSA Practice Arena.
2.  Select a problem.
3.  Read statement, constraints, and examples.
4.  Write Java code.
5.  Run sample/custom input.
6.  Submit to configured test cases.
7.  Inspect failures and visualize if supported.
8.  Review hints and complexity.

### Journey 4: Learn a built-in algorithm

1.  Open Algorithm Explorer.
2.  Select a topic.
3.  Read what/why/how explanation.
4.  Enter custom input or use an example.
5.  Control the visualization.
6.  Read the explanation for each step.
7.  Open a related practice problem.

### Journey 5: Learn pathfinding

1.  Open Maze Lab.
2.  Generate or edit a maze.
3.  Set start and destination.
4.  Select BFS, DFS, Dijkstra, or A\* when applicable.
5.  Step through exploration.
6.  Read why each cell is explored.
7.  Review the final path and metrics.

## 7. Functional requirements

### FR-01: Code editing

The application shall allow students to edit Java source code in a
browser editor.

### FR-02: Java execution

The application shall submit code and input to a server-side sandboxed
execution service and display output/errors.

### FR-03: Execution tracing

The application shall trace only supported constructs and clearly
disclose tracing limitations.

### FR-04: State playback

The application shall support forward/backward navigation through stored
trace states.

### FR-05: Source highlighting

When source mapping is available, the selected trace state shall
highlight its associated source line.

### FR-06: Variable panel

The application shall display supported variable values corresponding to
the selected state.

### FR-07: Array panel

The application shall display supported array values and indices
corresponding to the selected state.

### FR-08: Explanations

Every supported visualization event shall provide a simple, accurate
explanation of what is happening and why.

### FR-09: Trace integrity

The application shall not substitute a predefined algorithm result for
the student's actual execution while claiming to visualize the student's
code.

### FR-10: Practice problems

The application shall provide problem statements, starter code,
examples, configured test cases, and result feedback.

### FR-11: Built-in algorithms

The application shall retain and improve predefined algorithm
visualizations.

### FR-12: Maze Lab

The application shall provide maze creation/editing and step-based
pathfinding demonstrations.

### FR-13: Persistence

When accounts/database features are enabled, the application shall
persist appropriate users, submissions, progress, bookmarks, quiz
results, and saved mazes in SQL.

### FR-14: Error handling

The application shall distinguish compilation errors, runtime errors,
timeouts, unsupported tracing, and incorrect answers.

## 8. Non-functional requirements

### Usability

-   Beginner-friendly labels.
-   Consistent visual language.
-   Short default explanations.
-   Optional deeper explanations.
-   Clear legends and accessible controls.

### Performance

-   Keep animations responsive for modest inputs.
-   Bound trace length and output size.
-   Avoid storing/copying unnecessarily large state snapshots.
-   Provide a non-animated or summary mode for larger inputs if needed.

### Security

-   Execute submitted code in an isolated environment with time and
    memory limits.
-   Keep secrets and database credentials server-side.
-   Validate inputs and enforce authorization.
-   Rate-limit code execution and prevent excessive submissions.
-   Do not expose hidden test cases.

### Reliability

-   The visualization must reflect recorded trace data.
-   If tracing fails, show a clear message and preserve ordinary
    execution output when possible.
-   Built-in visualizers must be deterministic for the same input and
    algorithm settings.

### Maintainability

-   Keep code execution, trace processing, state history, visualization
    components, and explanation rules separate.
-   Use reusable components and documented data formats.
-   Preserve existing working features unless an approved change
    requires modification.

## 9. MVP scope

The first meaningful MVP includes: - Code Lab UI - Java Run workflow
using a sandboxed execution service - A restricted tracing proof of
concept - Line highlight, variables, array state -
Next/previous/play/pause/reset - Beginner-friendly explanations -
Built-in array traversal, linear search, binary search, and Bubble Sort
visualizations - Initial practice problem library - Existing Algorithm
Explorer and a working Maze Lab demonstration

SQL-backed authentication and persistent history can be scheduled after
the core execution/trace proof of concept unless they are mandatory for
evaluation.

## 10. Success criteria

-   A student can execute a supported Java program and see its output.
-   A supported program produces a trace that can be stepped through
    accurately.
-   The selected source line and displayed variable/array state
    correspond to the same trace state.
-   Every supported visualized event has a correct explanation.
-   Forward and backward navigation restore correct prior states.
-   Built-in algorithm visualizations produce correct results for test
    cases.
-   Maze algorithms behave according to their documented guarantees.
-   Invalid code and unsupported trace constructs produce honest,
    understandable messages.
-   SQL records persist correctly once persistence is implemented.

## 11. Risks and mitigations

  --------------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- --------------------------
  Arbitrary Java tracing  Core feature may be     Start with a small,
  is difficult            delayed                 documented supported
                                                  subset

  Execution service only  No trace available      Implement a separate
  returns output                                  debugger/instrumentation
                                                  layer

  Trace and animation     Misleads students       Drive playback only from
  diverge                                         trace/state data

  Unsafe code execution   Security risk           Use an isolated runner and
                                                  strict resource limits

  Too many features for   Incomplete project      Prioritize vertical slice
  semester scope                                  and defer advanced modules

  Explanation is too      Students remain         Short plain-language
  technical               confused                messages plus optional
                                                  details

  Existing prototype      Lost work               Audit, commit/backup, and
  breaks during redesign                          modify incrementally
  --------------------------------------------------------------------------

## 12. Release milestones

-   M0: Existing project audit and requirements freeze
-   M1: Code Lab interface
-   M2: Built-in visualization player
-   M3: Sandboxed Java execution
-   M4: Restricted real Java tracing
-   M5: DSA Practice Arena
-   M6: Algorithm Explorer and Maze Lab integration
-   M7: SQL persistence and user features
-   M8: Testing, documentation, and demonstration
