# Implementation Prompt for Antigravity / Claude

You are helping build ALGOLAB, a third-semester B.Tech project. Before
making changes, read `MEMORY.md`, `PRD.md`, `FEATURE_BREAKDOWN.md`,
`SYSTEM_ARCHITECTURE.md`, `DRD.md`, and `DFD.md`.

## Hard constraints

-   Preserve HTML, CSS, vanilla JavaScript, and SQL/MySQL as the core
    stack.
-   Java is the first student-submitted language.
-   Do not migrate the frontend to React, Next.js, Vue, or another
    framework.
-   Do not replace SQL with NoSQL.
-   Inspect the existing repository before changing anything.
-   Do not delete or replace working pages/features without approval.
-   Keep Algorithm Explorer and Maze Lab.
-   Every supported visualization must include a clear beginner-friendly
    explanation.
-   Never pretend a hard-coded algorithm animation is the trace of the
    student's submitted code.
-   Never run untrusted Java code directly inside the trusted
    application server.

## Work process

1.  Inspect the repository and report the existing structure and current
    functionality.
2.  Identify what can be reused.
3.  Propose a small, testable implementation plan for the next
    milestone.
4.  Wait for approval before destructive changes or large migrations.
5.  Implement only the agreed milestone.
6.  Test it and report exact results.
7.  List changed files, run instructions, limitations, and next steps.
8.  Update the documentation when architecture or requirements change.

## First task

Do not attempt to build the entire product at once. First inspect the
current project and design a proof of concept for the core feature: -
Java source editor - Java execution through a sandboxed runner - A
restricted, genuine tracing mechanism - Current source-line highlight -
Variable and array state - Step forward/backward and play/pause -
Explanation panel driven by actual trace events

Before choosing a tracing implementation, prove that it can capture
source lines, a variable update, and an array write for a small Java
program. An ordinary execution API returning only stdout/stderr is not
sufficient for the visualization requirement.

If the current environment cannot support real Java tracing, explain the
constraint and propose the smallest safe alternative. Do not label mock
data as real tracing.

Use simple, maintainable code suitable for a third-semester student. Do
not add a large framework unless explicitly approved.
