# ALGOLAB --- Data Flow Diagrams (DFD)

**Version:** 1.0\
**Purpose:** Show how information moves through ALGOLAB.

## 1. External entities

-   **E1 Student:** writes code, supplies input, chooses problems and
    algorithms.
-   **E2 Code Execution Service:** compiles and runs Java in an isolated
    environment.
-   **E3 SQL Database:** stores accounts, problem content, submissions,
    progress, and saved mazes.
-   **E4 Administrator/Content Manager:** maintains learning content in
    a later release.

## 2. Level 0 --- Context diagram

``` text
                  Code / Input / Requests
        +--------------------------------------+
        |                                      v
   +-----------+                        +----------------+
   |  Student  | <--- Results, Trace, --|    ALGOLAB     |
   |           |     Visuals, Feedback  |    Platform   |
   +-----------+                        +----------------+
                                               |    ^
                                      Execute  |    | Output/status/trace
                                               v    |
                                      +--------------------+
                                      | Code Execution and |
                                      | Trace Environment  |
                                      +--------------------+
                                               |
                                               | Read/write records
                                               v
                                      +--------------------+
                                      |    SQL Database    |
                                      +--------------------+
```

## 3. Level 1 --- Main processes

``` text
Student
  |
  | Source code + input
  v
[1.0 Code Lab UI]
  |
  | Execute request
  v
[2.0 Execution Coordinator] ---------> [E2 Sandboxed Java Runner]
  |                                          |
  |                                          | Output/errors
  |<-----------------------------------------+
  |
  | Trace request
  v
[3.0 Trace Processor] <--------------- [Java Tracing Mechanism]
  |
  | Normalized trace events
  v
[4.0 State History and Playback]
  |
  | Selected state
  v
[5.0 Visualization and Explanation]
  |
  | Current line, variables, arrays, explanation
  v
Student

Student <----> [6.0 Practice / Algorithm Explorer / Maze Lab]
                         |
                         | problem, algorithm, result, progress
                         v
                    [E3 SQL Database]
```

## 4. Level 2 --- Debug & Visualize flow

1.  Student submits Java source and input.
2.  Server validates request and limits.
3.  Tracing environment runs supported code.
4.  Tracer records source-line and runtime events.
5.  Trace processor normalizes events.
6.  State manager constructs or retrieves replayable states.
7.  Frontend selects a state index.
8.  Code panel highlights the associated source line.
9.  Variable and array panels render recorded values.
10. Explanation engine generates a deterministic explanation from the
    event.
11. Student moves to the next or previous state.
12. If trace coverage is incomplete, UI displays a limitation notice.

## 5. Level 2 --- Practice submission flow

1.  Student opens a problem.
2.  Problem content and examples are loaded from the
    application/database.
3.  Student writes code.
4.  Run sends code and custom/sample input to execution.
5.  Submit runs configured test cases.
6.  Test runner returns pass/fail results and safe diagnostics.
7.  Student may select a failed case for tracing if supported.
8.  Submission metadata and result may be saved to SQL.
9.  Hidden tests remain hidden from the student.

## 6. Level 2 --- Maze Lab flow

1.  Student generates or edits a grid.
2.  Grid validation checks start, end, and boundaries.
3.  Student chooses BFS, DFS, Dijkstra, or A\*.
4.  Algorithm generates exploration events.
5.  Playback renders visited cells and current frontier.
6.  Explanation describes each meaningful event.
7.  Algorithm returns path-found status, path, explored count, and path
    cost/length where relevant.
8.  Student can save the maze in a later release.

## 7. Data stores

-   **D1 SQL:** users, algorithm content, problems, test cases,
    submissions, progress, bookmarks, quiz results, maze history.
-   **D2 Trace session store (initially memory):** bounded event
    sequence/state history for the active debugging session.
-   **D3 Problem/test content:** may be stored in SQL or seed files
    during the prototype.

## 8. Data-flow and security notes

-   Browser never connects directly to SQL.
-   Browser sends source/input to a server API.
-   Server sends code to a sandboxed runner.
-   Credentials and service secrets remain server-side.
-   Execution results and traces are bounded before returning to the
    browser.
-   Student output is rendered as text, not trusted HTML.
-   Hidden test cases are not returned to the browser.
