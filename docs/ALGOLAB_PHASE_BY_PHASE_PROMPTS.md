# ALGOLAB --- Phase-by-Phase Build Prompts for Claude / Antigravity

**Project:** ALGOLAB --- Interactive DSA Coding, Dry-Run, Visualization,
and Learning Platform\
**Stack constraint:** HTML, CSS, vanilla JavaScript, SQL/MySQL; Java is
the first language students can submit in Code Lab. A lightweight
server-side JavaScript API may be used for secure SQL access and
execution-service integration.\
**Purpose:** Run these prompts one phase at a time in Claude Code or
Antigravity. Do not submit all phases as one giant task.

------------------------------------------------------------------------

# How to use this document

1.  Put the ALGOLAB project folder under Git version control.
2.  Place the existing project documentation in the project root or
    `docs/`:
    -   `MEMORY.md`
    -   `FEATURE_BREAKDOWN.md`
    -   `PRD.md`
    -   `SYSTEM_ARCHITECTURE.md`
    -   `DRD.md`
    -   `DFD.md`
3.  Open the project folder in your coding environment.
4.  Give the agent the **Global Instructions** below first.
5.  Run Phase 0, review its report, then run one phase at a time.
6.  Do not move to the next phase until the current phase's acceptance
    criteria pass.
7.  After each phase, inspect the diff, run the app and tests, and
    commit the working version.
8.  If the agent proposes a framework migration or changes the stack,
    stop it and remind it of the constraints.

## Global Instructions (send once at the start)

``` text
You are the implementation engineer for ALGOLAB. First read MEMORY.md, FEATURE_BREAKDOWN.md, PRD.md, SYSTEM_ARCHITECTURE.md, DRD.md, and DFD.md if they exist.

NON-NEGOTIABLE CONSTRAINTS
- Keep the frontend in HTML5, CSS3, and vanilla JavaScript.
- Use SQL/MySQL for relational persistence unless the existing repository already has a different SQL database configured.
- Java is the first language supported in Code Lab.
- Do not migrate the frontend to React, Next.js, Vue, Angular, or another frontend framework.
- Do not replace SQL with NoSQL.
- A small server-side JavaScript API (for example Node.js) is permitted for secure database access and service integration. Never connect browser JavaScript directly to MySQL.
- Preserve existing working pages and features. Inspect before modifying. Do not delete files or perform destructive refactors without explaining the need and receiving approval.
- Keep Algorithm Explorer and Maze Lab.
- Every supported visualization must include a simple, accurate explanation of what is happening and why.
- Never claim a hard-coded demonstration is a trace of student-submitted code.
- Ordinary Java execution and actual Java tracing are separate capabilities. Do not claim tracing works until a real trace has been verified.
- Never run untrusted student Java code directly in the trusted application server.
- Keep code understandable for a third-semester B.Tech student.

WORKING STYLE
- Work only on the phase explicitly requested.
- First state the intended plan and files likely to change.
- Make small, reviewable changes.
- Reuse the existing project where possible.
- Test the phase before reporting completion.
- Do not use mock data without clearly labeling it as mock/test data.
- Do not add dependencies without explaining why.
- After work, report: changed files, features implemented, tests run and results, known limitations, exact run commands, and next recommended phase.
- Update MEMORY.md and relevant architecture/requirements docs when a decision changes.
- Stop and ask before destructive changes or major architectural changes.
```

------------------------------------------------------------------------

# Phase 0 --- Audit the existing project and make a safe plan

## Prompt

``` text
Perform Phase 0 only: audit the existing ALGOLAB repository. Do not implement new features yet.

Read all project documents, especially MEMORY.md, FEATURE_BREAKDOWN.md, PRD.md, SYSTEM_ARCHITECTURE.md, DRD.md, and DFD.md.

Inspect the existing source tree and report:
1. Existing pages, CSS, JavaScript, assets, package files, and backend/database files.
2. Which features currently work, partially work, or are placeholders.
3. How the current Bubble Sort/algorithm visualizer works.
4. Whether a backend or SQL database is already configured.
5. Current run commands and dependencies.
6. Existing design patterns and files worth reusing.
7. Gaps between the repository and the PRD.
8. Security risks, especially any client-side secrets or unsafe code execution.
9. A phased implementation plan with dependencies and acceptance criteria.

Do not rewrite the project, migrate frameworks, delete files, install dependencies, or create a new application. If a feature cannot be verified from code, label it “not verified” rather than assuming it works.

End with a concise recommendation for the first implementation milestone.
```

## Acceptance criteria

-   Existing project structure is documented.
-   Working features are distinguished from incomplete features.
-   No files have been destructively changed.
-   The next phase is clear and small.

------------------------------------------------------------------------

# Phase 1 --- Create the Code Lab interface

## Prompt

``` text
Implement Phase 1 only: create the Code Lab frontend interface using the existing HTML, CSS, and vanilla JavaScript stack.

First inspect and reuse the existing design system, navigation, colors, typography, and responsive patterns. Do not replace the whole site.

Create or improve code-lab.html and the smallest set of CSS/JS files needed. The page should include:
1. A code editor area suitable for Java examples. A lightweight editor library such as CodeMirror may be proposed, but explain the dependency before adding it.
2. Java starter-code/example selector.
3. Standard-input panel.
4. Run Code button.
5. Debug & Visualize button.
6. Output/error panel.
7. Source-code line area with a clear current-line style.
8. Variables panel.
9. Array visualization panel.
10. Explanation panel.
11. Playback controls: Play, Pause, Previous Step, Next Step, Reset, speed selector, and step counter.
12. A clear state indicating that execution/tracing is not connected yet. If demo trace data is used for layout testing, label it “DEMO DATA — NOT REAL JAVA EXECUTION.”
13. Links to the existing Algorithm Explorer and Maze Lab.

Requirements:
- Keep the interface simple for a beginner and responsive on laptop/tablet widths.
- Every color or marker used in a visualization must have a visible legend.
- Use accessible labels, visible focus states, and clear error/empty/loading states.
- Do not pretend Run or Debug works if it is only a UI placeholder.
- Do not migrate to React or another frontend framework.
- Do not remove existing working pages.

After implementation, run the available checks and report changed files, how to open the page, and which controls are still placeholders.
```

## Acceptance criteria

-   Code Lab page opens and navigation works.
-   Layout is responsive.
-   No button falsely claims a backend action has succeeded.
-   Placeholder/demo states are explicitly labelled.

------------------------------------------------------------------------

# Phase 2 --- Build a reusable trace player with clearly labelled fixtures

## Prompt

``` text
Implement Phase 2 only: build the reusable execution-state playback engine. This phase must not claim to trace Java yet.

Create a documented trace/state format and implement:
- Initial state and ordered states/events.
- Current step index.
- Next Step and Previous Step.
- Play and Pause.
- Reset.
- Speed control.
- Timeline/step counter.
- State rendering for source line, variables, and an array.
- A clear “test fixture/demo trace” label when using sample data.

Use a tiny, deterministic example such as summing an array. Keep the trace fixture in a separate file so it can later be replaced by real trace output.

Every state must include or map to a beginner-friendly explanation answering, as appropriate:
- What is shown?
- What is happening?
- Why?
- What changed?
- What comes next?

The displayed source line, variable values, array state, and explanation must all correspond to the selected state. Previous Step must restore a prior stored state; do not attempt to reverse arbitrary operations manually.

Add tests or a repeatable manual test procedure for playback, reverse navigation, reset, and explanation/state synchronization. Do not implement Java execution or claim real tracing in this phase.
```

## Acceptance criteria

-   Playback controls work deterministically.
-   Previous/next/reset restore consistent state.
-   The explanation matches the selected fixture state.
-   Test data is clearly marked as a fixture.

------------------------------------------------------------------------

# Phase 3 --- Implement ordinary Java code execution safely

## Prompt

``` text
Implement Phase 3 only: connect Code Lab's Run Code action to a safe Java execution service.

First evaluate the current project and recommend a sandboxed execution provider or isolated execution arrangement. Judge0 may be evaluated, but verify its current API requirements and do not assume it returns runtime traces.

Requirements:
1. Submit the current Java source and standard input through a server-side API.
2. Display stdout and stderr safely as text.
3. Distinguish success, compilation error, runtime error, timeout, execution-service failure, and invalid request.
4. Enforce request-size and execution/resource limits supported by the chosen service.
5. Keep service tokens and database credentials on the server, never in frontend JavaScript or committed files.
6. Never execute untrusted Java source directly inside the trusted web application process.
7. Handle network failure and service unavailability.
8. Show a loading state and prevent accidental duplicate submissions.
9. Keep Run Code separate from Debug & Visualize. Ordinary execution does not prove tracing works.
10. Document setup and required environment variables in a safe example file such as .env.example; do not create or commit real secrets.

Do not add a full tracing system in this phase. Do not expose hidden test cases. If the chosen provider cannot safely satisfy the requirements, stop and report the limitation and alternatives before building a risky workaround.

Test at least: a successful program, compilation error, runtime error, empty input, and timeout/resource-limit behavior where supported.
```

## Acceptance criteria

-   Java code executes through the chosen isolated service.
-   Output and errors are correctly classified.
-   No credentials are exposed to the browser.
-   The UI does not imply that ordinary execution creates a trace.

------------------------------------------------------------------------

# Phase 4 --- Prove real Java tracing before building around it

## Prompt

``` text
Implement Phase 4 only: create a technical proof of concept for actual Java execution tracing.

This is a critical architecture gate. Do not build more visualizers until the tracer is proven.

Investigate and choose a feasible method, such as a Java debugger integration (for example JDI) or carefully controlled bytecode/source instrumentation. Verify that the chosen method can work with the selected execution environment. An ordinary code execution API that returns only output/errors is not sufficient.

Start with a very small Java program that:
- Initializes an integer variable.
- Creates an integer array.
- Runs a loop.
- Reads an array element.
- Updates a variable.
- Writes an array element or performs a swap.

The proof of concept must capture, where supported:
1. Source line or executable location.
2. Ordered event index.
3. Relevant variable values.
4. Array state or array read/write.
5. Program output.
6. Completion, exception, timeout, and trace truncation status.

Define a normalized trace-event format and document which fields are guaranteed versus optional. Use a bounded trace length and safe execution limits. Do not pretend unsupported Java constructs are traced.

Create a repeatable test showing that the trace values match the program's actual execution. If the environment or provider makes genuine tracing infeasible, stop and explain the blocker and smallest safe alternative; do not substitute fake events.

Do not implement a broad visualization catalogue in this phase.
```

## Acceptance criteria

-   A real Java program produces a real trace.
-   At least one source location, variable update, and array operation
    are verified.
-   Trace limits and unsupported constructs are documented.
-   If this cannot be achieved, no UI feature is labelled as real
    tracing.

------------------------------------------------------------------------

# Phase 5 --- Connect the real trace to Code Lab

## Prompt

``` text
Implement Phase 5 only: connect the proven Java tracing output from Phase 4 to the Code Lab trace player.

Requirements:
1. Replace the demo fixture as the default Debug & Visualize source only after real tracing works.
2. Keep demo fixtures available only for tests and label them clearly.
3. Highlight the source line corresponding to the selected trace state when source mapping is available.
4. Display recorded variable values.
5. Display recorded array values and indices.
6. Render the current event and beginner-friendly explanation.
7. Implement Next, Previous, Play, Pause, Reset, speed, and timeline controls over actual trace states.
8. Make backward navigation restore exact recorded state.
9. If trace is unsupported, incomplete, truncated, or fails, show a clear status and retain normal execution results where possible.
10. Do not invent values, operations, source lines, or algorithm meaning.

Use deterministic explanation rules based on trace event types. For example, an array-read event should explain that an element is being read, while an array-write event should explain what value changed. Add a neutral fallback explanation for unknown event types.

Test with at least two different student-edited programs and verify that the trace changes when the source code changes.
```

## Acceptance criteria

-   Code Lab displays actual trace states for the supported Java subset.
-   State, source line, variables, array, and explanation stay
    synchronized.
-   Unsupported code is reported honestly.

------------------------------------------------------------------------

# Phase 6 --- Add robust beginner-friendly explanations

## Prompt

``` text
Implement Phase 6 only: improve the explanation engine and visualization teaching experience.

Every supported visualization step must explain, in simple language:
1. What the student is seeing.
2. What is happening.
3. Why it is happening.
4. What changed.
5. What comes next, when relevant.

Implement explanations for supported events such as:
- Line reached
- Variable initialized/updated
- Condition true/false
- Loop progression
- Array read
- Array write
- Array swap
- Method call/return
- Output
- Exception
- Unsupported or incomplete trace

Requirements:
- Use real values from the selected trace state.
- Keep the default explanation concise and beginner-friendly.
- Offer an optional expanded “Why does this matter?” or “Learn the concept” section.
- Distinguish a generic runtime explanation from an algorithm-specific explanation.
- Do not claim a program is Bubble Sort, BFS, or another algorithm unless it is a built-in visualization or the algorithm identification is reliable and explicitly supported.
- Never ask an LLM to invent runtime values.
- Provide a visible legend for every visual marker/color.
- Ensure color is not the only way to convey state.

Add tests or a documented checklist for explanation accuracy.
```

## Acceptance criteria

-   Every supported trace event has a useful explanation or honest
    fallback.
-   Values in explanations match the selected trace state.
-   Legends and labels are visible.

------------------------------------------------------------------------

# Phase 7 --- Build and validate core DSA visualizers

## Prompt

``` text
Implement Phase 7 only: improve and extend built-in DSA visualizers. Keep them separate from generic Java tracing; never claim a built-in visualization is the student's trace.

Start with:
1. Array traversal
2. Find maximum/minimum
3. Linear Search
4. Binary Search
5. Bubble Sort
6. Selection Sort
7. Two Pointers
8. Sliding Window

For each visualizer:
- Accept sample and valid custom input.
- Validate input and show understandable errors.
- Generate actual steps from that algorithm's implementation.
- Support Play, Pause, Next, Previous, Reset, and speed control.
- Show relevant indices, pointers, comparisons, window boundaries, and values.
- Explain every meaningful step in plain language.
- Display a visible legend.
- Show final output and appropriate complexity information.
- Test edge cases and verify final results.

For sliding window, explain window boundaries and why the window expands/shrinks. For binary search, show low/high/mid and explain which range is discarded. For sorting, distinguish comparison, swap, and already-correct order.

Use reusable state/player components where practical. Do not add every possible algorithm at once; complete and test this set before expanding.
```

## Acceptance criteria

-   Each listed algorithm has correct final results.
-   Controls and explanations match the algorithm state.
-   Invalid input is handled clearly.

------------------------------------------------------------------------

# Phase 8 --- Build DSA Practice Arena

## Prompt

``` text
Implement Phase 8 only: build the first DSA Practice Arena with 10–15 tested problems.

Start with:
- Print/traverse array
- Find maximum
- Reverse array
- Move zeros
- Linear Search
- Binary Search
- Bubble Sort or Selection Sort
- Two Sum
- Valid Palindrome
- A two-pointer problem
- Longest Substring Without Repeating Characters
- Stack operations

Each problem must include:
- Title, topic, difficulty
- Clear statement
- Input/output format
- Constraints
- Examples
- Java starter code
- Run
- Submit
- Debug & Visualize where tracing supports the code
- Hints
- Explanation and complexity

Separate actions:
- Run executes sample/custom input.
- Submit evaluates the configured test suite.
- Debug & Visualize traces supported execution.

Requirements:
- Keep hidden test cases and expected outputs server-side.
- Show pass/fail counts and safe diagnostics.
- Let students inspect a failed test through the tracer when supported.
- Do not replace the student's code with a reference solution.
- Provide progressive hints rather than revealing the complete answer immediately.
- Test correct, incorrect, boundary, and invalid solutions.

Use a small, maintainable problem catalogue. Do not attempt to recreate all of LeetCode.
```

## Acceptance criteria

-   Students can select a problem, write code, run, submit, and see
    results.
-   Hidden tests remain private.
-   Tracing is available only where actually supported.

------------------------------------------------------------------------

# Phase 9 --- Improve Algorithm Explorer

## Prompt

``` text
Implement Phase 9 only: retain and improve the existing Algorithm Explorer and predefined algorithm visualization pages.

First inspect existing pages and reuse working visualizations. Do not remove the current Bubble Sort visualization.

For each published algorithm page, include:
- What the algorithm/data structure is
- Why it is used
- How it works
- Example input and output
- Java example or pseudocode
- Time complexity, including best/average/worst cases where applicable
- Auxiliary space complexity
- Interactive visualization
- A step-by-step explanation
- Common mistakes
- Related practice problems

Prioritize sorting, searching, arrays, stacks, queues, linked lists, trees/BST, and graph traversal. Publish only algorithms whose implementation and explanation are tested.

Use consistent controls and legends. Keep the explanation synchronized with the actual built-in algorithm state. Link a learning page to the corresponding practice problem and, when useful, a Java example in Code Lab.
```

## Acceptance criteria

-   Existing algorithm pages still work.
-   Each published algorithm has accurate explanations and complexity.
-   Visualizations and practice pages are connected.

------------------------------------------------------------------------

# Phase 10 --- Build Maze Lab with full explanations

## Prompt

``` text
Implement Phase 10 only: retain and improve Maze Lab as a complete educational module.

Features:
- Generate maze
- Clear/regenerate
- Set start and destination
- Add/remove walls
- Validate grid boundaries and endpoints
- BFS
- DFS
- Dijkstra and A* only when weighted/movement-cost assumptions are defined
- Play/Pause/Next/Previous/Reset/speed
- Visited-cell count
- Path length/cost
- Final path
- Optional save-maze support if persistence is already ready

Every meaningful step must explain:
- Which cell is current
- Why it is being explored
- Whether it is blocked/already visited
- How the queue/stack/priority structure changes, where applicable
- What changed
- What the next step is likely to be

Rules:
- BFS finds a minimum-move path in an unweighted grid if one exists.
- DFS does not generally guarantee a shortest path.
- Dijkstra requires nonnegative edge weights.
- A* needs a suitable heuristic and well-defined costs.
- Keep explored-cell count separate from path length/cost.
- Do not claim a shortest path unless the algorithm and configuration guarantee it.

Add a visible legend and a “What is Maze Lab?” explanation that explains how cells map to graph vertices and legal moves map to edges. Test reachable, unreachable, trivial, and boundary cases.
```

## Acceptance criteria

-   Maze controls and pathfinding are correct.
-   Every meaningful step has an explanation.
-   Algorithm guarantees are described accurately.

------------------------------------------------------------------------

# Phase 11 --- Add SQL database and server-side persistence

## Prompt

``` text
Implement Phase 11 only: add SQL persistence for the features that are ready.

First inspect whether a database and backend already exist. Use SQL/MySQL unless the repository has an established SQL choice. Keep the frontend HTML/CSS/vanilla JS. A lightweight server-side JavaScript API is permitted; do not connect browser code directly to MySQL.

Design and document relational tables for the required features, such as:
- Users
- AlgorithmCategories
- Algorithms
- Problems
- TestCases
- Submissions
- QuizQuestions/QuizResults (if quiz is implemented)
- UserProgress
- Bookmarks
- MazeHistory
- ExecutionSessions metadata (only if saved sessions are needed)

Requirements:
- Primary keys, foreign keys, constraints, and useful indexes.
- Parameterized queries.
- Password hashes only, never plaintext passwords.
- Keep credentials in server-side environment variables.
- Add `.env.example` without real secrets.
- Add schema and seed scripts.
- Enforce authorization for user-owned records.
- Do not store full trace payloads indefinitely by default.
- Keep hidden test inputs/expected outputs server-side.
- Add error handling for unavailable database and invalid requests.

Implement only the persistence needed by the current working features. Do not build an admin CMS or add tables for speculative features without a clear use case.
```

## Acceptance criteria

-   Schema and seed scripts run reproducibly.
-   Persistent records survive reload/new session.
-   Database credentials are never shipped to the browser.
-   Private records have authorization checks.

------------------------------------------------------------------------

# Phase 12 --- Authentication, progress, bookmarks, and history

## Prompt

``` text
Implement Phase 12 only: add student accounts and personalized learning features using the existing SQL backend.

Features:
- Register
- Login
- Logout
- Secure session/authentication handling
- Password hashing on the server
- User dashboard
- Recent problems/algorithms
- Quiz/submission history where implemented
- Bookmarks
- Saved maze configurations where supported
- Topic progress based on meaningful activity

Requirements:
- Validate inputs on the server.
- Do not store plaintext passwords.
- Protect private API routes.
- Verify ownership before reading/updating user records.
- Do not count merely opening a page as mastering a topic.
- Handle duplicate email, invalid credentials, expired sessions, and server errors.
- Add tests for authorization and persistence.

Keep the scope appropriate for a student project. Do not implement password recovery unless a secure reset flow can be completed.
```

## Acceptance criteria

-   Account workflows function.
-   Private data is isolated by user.
-   Progress/history reflect real stored activity.

------------------------------------------------------------------------

# Phase 13 --- Optional AI learning assistant

## Prompt

``` text
Implement Phase 13 only if the core Code Lab, trace engine, practice system, and safety controls are already reliable.

Design an optional AI learning assistant that can:
- Explain a selected code line
- Explain a selected trace event
- Offer progressive debugging hints
- Explain time/space complexity
- Suggest a next concept to review

The assistant must receive the actual submitted code, selected trace state/event, and test result as context where available. It must not invent runtime values, claim unobserved operations occurred, or silently rewrite the student's code.

Requirements:
- Clearly separate AI-generated advice from verified execution data.
- Prefer hints before full solutions.
- Protect API keys on the server.
- Apply request limits and safe error handling.
- Do not send passwords, secrets, or unnecessary personal data to an AI service.
- If no AI API is configured, the core project must still work with deterministic explanations.
- Explain the cost/dependency before adding an AI provider.

Do not implement this phase before the core trace pipeline is trustworthy.
```

## Acceptance criteria

-   AI advice is optional and clearly labelled.
-   Verified trace data remains authoritative.
-   The application works without AI credentials.

------------------------------------------------------------------------

# Phase 14 --- Final testing, documentation, and project demo

## Prompt

``` text
Implement Phase 14 only: conduct a complete quality pass and prepare ALGOLAB for project evaluation.

Do not add major new features. Audit the project against PRD.md, FEATURE_BREAKDOWN.md, SYSTEM_ARCHITECTURE.md, DRD.md, and DFD.md.

Tasks:
1. Test every navigation route.
2. Test every built-in algorithm with normal and edge cases.
3. Test Run, Submit, and Debug & Visualize separately.
4. Test successful Java code, compilation errors, runtime errors, timeouts, and unsupported tracing.
5. Verify trace values match the real Java execution for the supported subset.
6. Verify source-line highlighting, variables, array states, explanations, and playback remain synchronized.
7. Verify previous/next/reset.
8. Test practice pass/fail and hidden-test protection.
9. Test Maze Lab reachable/unreachable and algorithm guarantees.
10. Test SQL persistence and user authorization.
11. Check responsive behavior and keyboard accessibility.
12. Check for exposed secrets, unsafe HTML rendering, direct browser-to-SQL access, and unbounded code execution.
13. Remove accidental debug logging and clearly label remaining demo data.
14. Update README with prerequisites, environment setup, database setup, execution-service setup, run commands, tests, and known limitations.
15. Update MEMORY.md and diagrams/docs to match the implemented architecture.

Create a final test report listing:
- Test
- Expected result
- Actual result
- Pass/fail
- Known limitations

Do not claim any untested feature works. List incomplete items honestly.
```

## Acceptance criteria

-   The project can be set up from the README.
-   Core user journeys are tested.
-   Known limitations are documented.
-   Project demonstration steps are ready.

------------------------------------------------------------------------

# Suggested milestone order

  -----------------------------------------------------------------------
  Milestone               Phases                  Result
  ----------------------- ----------------------- -----------------------
  A --- Audit and         0--1                    Understand current
  interface                                       project and build Code
                                                  Lab UI

  B --- Playback          2                       Reusable trace player
  foundation                                      using labelled fixtures

  C --- Run Java safely   3                       Real code execution

  D --- Real tracing      4--5                    Actual supported Java
  proof                                           trace shown in UI

  E --- Teaching          6--7                    Explanations and core
  experience                                      visualizers

  F --- Practice and      8--10                   Practice Arena,
  learning                                        Algorithm Explorer,
                                                  Maze Lab

  G --- Persistence       11--12                  SQL-backed accounts and
                                                  progress

  H --- Optional          13                      AI hints/explanations
  intelligence                                    

  I --- Submission        14                      Tested and documented
  readiness                                       project
  -----------------------------------------------------------------------

## Critical advice

The highest-risk work is Phase 4: genuine Java tracing. Prove it early.
Do not spend weeks polishing a fake line-by-line debugger before
confirming the tracer can capture actual Java runtime events.
