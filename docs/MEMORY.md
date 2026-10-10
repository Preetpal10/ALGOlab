# ALGOLAB --- Project Memory for AI Coding Agents

**Purpose:** Read this file before making changes. It preserves the
project goals, constraints, decisions, and implementation rules across
Antigravity/Claude sessions.

## 1. Project identity

ALGOLAB is an Interactive DSA Coding, Dry-Run, Visualization, and
Learning Platform for a third-semester B.Tech project.

The defining experience is:

**Write Code → Run → Debug & Visualize → Understand → Fix → Practice**

The main differentiator is helping a student understand their own
supported Java DSA code through real execution tracing, variable/array
visualization, and clear explanations.

## 2. Non-negotiable technology constraints

-   Keep the frontend in HTML, CSS, and vanilla JavaScript.
-   Use SQL/MySQL for persistent structured data unless the existing
    project already has a different SQL database configured.
-   Java is the first language students write and run in Code Lab.
-   A small server-side JavaScript layer may be used for API and SQL
    access. Do not expose database credentials in browser code.
-   Do not migrate to React, Next.js, Vue, or another frontend
    framework.
-   Do not replace SQL with NoSQL.
-   Do not rewrite the whole project just to change its structure or
    visual style.
-   Audit the existing repository before changing or deleting files.

## 3. Product priorities

### Highest priority

1.  Code Lab
2.  Java code execution
3.  A real, restricted execution-tracing proof of concept
4.  Line highlighting, variable inspector, array visualization
5.  Step forward/backward, play/pause/reset
6.  Plain-language explanation for every supported visualized operation

### Also retain

-   Algorithm Explorer and predefined algorithm visualizations
-   Maze Lab with maze generation and pathfinding
-   DSA Practice Arena with problem statements and test cases

### Later features

-   More advanced data structures
-   SQL-backed accounts/progress/bookmarks
-   Saved trace sessions
-   AI hints and explanations
-   Admin/content management

## 4. Explanation rule --- apply to every visualization

Every supported visualization event must answer, as appropriate: 1. What
am I seeing? 2. What is happening? 3. Why is it happening? 4. What
changed? 5. What comes next?

Default explanations should be short and beginner-friendly. Offer an
optional expanded explanation. Explanation text must match the actual
event/state. Never invent values or pretend a built-in animation came
from student code.

## 5. Critical technical truth

Running Java and tracing Java are separate capabilities.

-   An ordinary execution API may return output/errors but not variable
    history.
-   Student Java cannot be compiled natively by browser HTML/CSS/JS
    alone.
-   Use a sandboxed Java execution service or an isolated execution
    environment.
-   Implement a separate tracing mechanism for supported constructs.
-   Never run untrusted code directly inside the trusted application
    server.
-   Start with a documented subset: basic variables, conditions, loops,
    array reads/writes, and method calls/returns.
-   Clearly state when tracing is unsupported or incomplete.
-   Do not fabricate a trace from a predefined algorithm.

## 6. Recommended architecture

-   HTML/CSS/JS frontend
-   Server-side JavaScript API for SQL and service calls
-   SQL/MySQL database
-   Sandboxed Java execution service
-   Restricted Java tracing layer
-   Normalized trace events
-   State history/playback engine
-   Reusable visualizers
-   Deterministic explanation rules

Separate execution, tracing, playback, rendering, and explanation code.

## 7. Initial supported built-in visualizations

Prioritize: - Array traversal - Find maximum/minimum - Linear Search -
Binary Search - Bubble Sort - Selection Sort - Two Pointers - Sliding
Window

Then add: - Stack/queue - Linked list - Trees/BST - BFS/DFS and graph
visualization - Maze pathfinding

## 8. Maze Lab rules

-   Explain what a maze is and how a grid represents a graph.
-   Explain every meaningful step.
-   BFS finds a minimum-move path in an unweighted grid when one exists.
-   DFS does not generally guarantee a shortest path.
-   Dijkstra requires nonnegative edge weights.
-   A\* requires an appropriate heuristic and defined movement costs.
-   Keep explored-cell count distinct from path length/cost.
-   Do not claim the path is shortest unless the algorithm/configuration
    guarantees it.

## 9. Code quality rules

-   Keep files small and responsibilities clear.
-   Use meaningful names and comments for non-obvious logic.
-   Reuse shared components rather than duplicating visualization
    controls.
-   Validate user input.
-   Handle empty, invalid, and large inputs.
-   Use parameterized SQL queries.
-   Keep secrets in server-side environment variables; never commit
    `.env`.
-   Escape/render code output as text.
-   Add tests for algorithms and trace/state synchronization.
-   Do not add dependencies without explaining why they are needed.
-   Do not delete existing working features without explicit approval.
-   Do not silently replace real features with mock data.

## 10. Required working process for Antigravity/Claude

Before coding: 1. Inspect the repository and identify existing entry
points and features. 2. Read `PRD.md`, `FEATURE_BREAKDOWN.md`,
`SYSTEM_ARCHITECTURE.md`, `DRD.md`, and `DFD.md`. 3. Summarize the
current architecture and gaps. 4. Propose a small implementation plan
for the next milestone. 5. Preserve existing working code and make a Git
commit/backup before risky changes.

While coding: 1. Work in small phases. 2. Implement one vertical slice
at a time. 3. Do not build all modules at once. 4. Do not claim real
Java tracing works until it is demonstrated with a real Java program. 5.
Keep trace formats documented. 6. Test before moving to the next phase.

After coding: 1. List files created/changed. 2. Explain what works and
what remains incomplete. 3. Provide exact commands to run/test the
project. 4. Report known limitations honestly. 5. Update this file and
the relevant docs if a design decision changes.

## 11. First milestone

Build one end-to-end proof of concept: 1. Student enters a simple Java
array-traversal program. 2. Program executes in a sandbox. 3. A tracing
mechanism captures at least source line, variable change, and array
state for the supported example. 4. UI highlights the current line. 5.
Variable and array panels match the trace. 6. Explanation panel explains
the operation. 7. Student can step forward and backward through states.

Do not begin by implementing every algorithm, all database tables, or AI
assistance. Prove the core trace pipeline first.

## 12. Definition of done

A feature is done only if it: - Works for its declared supported
scope. - Handles errors and edge cases. - Has accurate explanations. -
Matches actual state/trace. - Has been tested. - Has clear user-facing
limitations where applicable. - Does not break existing features.

## 13. Development Progress and Phase History

### Current Status
- Current phase: Phase 1 — Code Lab UI.
- Last progress update: 2026-10-10.
- Agent reported that the seven Code Lab UI checks passed.
- Independent verification of all reported tests is still required.

### Phase 1 — Code Lab UI

Implemented or reported implemented:
- Java code editor.
- Java language selector.
- Starter-code template selector.
- Run Code button.
- Reset Code button.
- Standard input area.
- Console Output panel.
- Clear Console button.
- Execution trace controls.
- Trace Visualization panel.
- Variable & State Inspector.
- Submit Solution button.
- Practice Arena Submission Status panel.

### Reported Test Results

The agent's verification report marked these checks PASS:
1. Submit Solution button visibility.
2. Submission status panel visibility.
3. Honest submission-unavailable message.
4. Run Code displays an honest unavailable message.
5. Clear Console clears the console.
6. Template selection and Reset Code behavior.
7. Navigation links.

These are agent-reported results. Re-test manually before
treating them as independently verified.

### Files Reported Created or Modified

- frontend/codelab.html — Code Lab page.
- frontend/js/codelab.js — Code Lab interactions.
- frontend/css/style.css — UI styling.
- frontend/index.html — Homepage/navigation changes.
- frontend/algorithms.html — Verify changes.
- frontend/visualizer.html — Verify changes.
- frontend/maze.html — Verify changes.

Confirm the exact file list using `git status`.

### Known Limitations

- Java execution service is not yet connected.
- Genuine Java execution tracing is not yet connected.
- Source-line highlighting from real execution events is pending.
- Variable and array state synchronization is pending.
- Practice Arena judging and test-case evaluation are not implemented.
- Do not fabricate execution output, trace events, or judging results.

### Git Checkpoint

- Branch previously observed: main.
- Initial commit previously observed: cfeeb83.
- Current working-tree status must be checked.
- Phase 1 changes have not been confirmed committed or pushed.

### Next Recommended Action

1. Verify the Phase 1 implementation manually.
2. Review `git status` and inspect the changed files.
3. Fix any failed checks.
4. Commit Phase 1 only after review and testing.
5. Investigate a secure Java execution and genuine tracing
   proof of concept.
6. Do not start the full Practice Arena judging system before
   validating the execution foundation.