# ALGOLAB — Interactive Data Structures & Algorithms Learning Platform

**Learn DSA by visualizing algorithms, executing Java programs, and understanding how code works step by step.**

ALGOLAB is an interactive web-based learning platform designed to help students understand Data Structures and Algorithms (DSA) through visualizations, Java code execution, execution tracing, and educational explanations.

Instead of only reading algorithm implementations, students can explore how algorithms work, observe changes in data structures, execute Java code, and inspect program execution step by step.

> **Project Status:** Active Development  
> **Project Type:** B.Tech Computer Science & Engineering Project

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Java Code Execution and Tracing](#java-code-execution-and-tracing)
- [Automated Testing](#automated-testing)
- [Current Limitations](#current-limitations)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [Author](#author)

---

## 📖 Overview

Learning DSA can be challenging when students have to understand algorithms only through theoretical explanations or static code examples.

ALGOLAB aims to make learning more interactive by combining algorithm visualization with Java programming and execution tracing.

The platform brings together several learning modules:

- **Algorithm Visualizer:** Understand sorting and searching algorithms through visual steps.
- **Code Lab:** Write and execute Java programs.
- **Execution Tracing:** Inspect captured program execution events and variable states.
- **Stack Lab:** Learn stack operations through interactive LIFO visualization.
- **Queue Lab:** Understand queue operations through FIFO visualization.
- **Maze Lab:** Explore pathfinding algorithms such as BFS and DFS.
- **Algorithm Explorer:** Browse supported algorithms and data structures.

The goal is to help students move from memorizing algorithms to understanding how they execute.

## 🎯 Problem Statement

Students often struggle to understand Data Structures and Algorithms because theoretical explanations and conventional code examples do not always make program execution easy to visualize.

Common difficulties include:

- Understanding how variables change during execution.
- Following array operations and algorithm iterations.
- Distinguishing between different data structures.
- Understanding how data structures change after individual operations.
- Identifying the behavior of loops and conditional statements.
- Debugging Java programs and interpreting their execution.

ALGOLAB addresses these challenges through interactive visualizations, executable Java examples, and step-by-step execution inspection.

## 🎯 Project Objectives

1. Provide an interactive environment for learning DSA.
2. Visualize sorting and searching algorithms.
3. Demonstrate fundamental data structures through interactive operations.
4. Allow students to write and execute Java programs.
5. Capture genuine program execution events for step-by-step inspection.
6. Display variable and data-state information where supported by the tracer.
7. Provide contextual explanations to improve conceptual understanding.
8. Create a foundation for future practice problems, progress tracking, and personalized learning.

---

## ✨ Features

### 1. Algorithm Visualizer

The Algorithm Visualizer helps students understand algorithm behavior through graphical representations and step-by-step interaction.

**Supported algorithms include:**

- Bubble Sort
- Selection Sort
- Insertion Sort
- Linear Search
- Binary Search

Features include algorithm selection, visual state changes, and interactive exploration where implemented.

### 2. Code Lab — Java Programming

Code Lab provides an environment for writing and executing Java programs.

Key capabilities include:

- Java code editor.
- Starter code templates for supported examples.
- Code execution through the backend service.
- Standard input and output handling where supported.
- Compiler error reporting.
- Execution trace controls.
- Variable and state inspection.
- Step-by-step educational explanations.

The execution and tracing workflow depends on the backend service being available.

### 3. Java Execution Tracing

ALGOLAB integrates Java execution with a tracing mechanism based on the **Java Debug Interface (JDI)**.

The tracing system captures execution events so students can inspect how their programs progress.

Depending on the program and captured event, students can explore:

- Executed source lines.
- Local variable values.
- Array state snapshots.
- Program output.
- Execution errors and termination information.

The captured trace is used by the frontend playback interface.

**Important distinction:** The Code Lab trace represents captured Java execution events. High-level visualizer animations are separate and should not be interpreted as source-level debugging events.

### 4. Stack Lab

Stack Lab demonstrates the **Last In, First Out (LIFO)** principle.

Implemented operations include:

- Push
- Pop
- Peek
- Clear
- Playback controls
- Step navigation
- Speed control
- Stack state inspection

The visualization illustrates how elements enter and leave a stack and how its state changes after operations.

### 5. Queue Lab

Queue Lab demonstrates the **First In, First Out (FIFO)** principle.

Implemented operations include:

- Enqueue
- Dequeue
- Peek / Front
- Empty-queue checking
- Size inspection
- Clear
- Reset and replay
- Step-by-step playback

The horizontal visualization identifies the front and rear of the queue and illustrates how elements are inserted and removed.

### 6. Maze Lab

Maze Lab demonstrates pathfinding and traversal on a grid.

Implemented capabilities include:

- Maze generation using a recursive backtracking approach.
- Breadth-First Search (BFS).
- Depth-First Search (DFS).
- Animated exploration.
- Playback controls.

BFS can find a shortest path in an unweighted grid when a path exists. DFS explores paths without generally guaranteeing the shortest route.

### 7. Algorithm Explorer

The Algorithm Explorer provides a central place to discover supported algorithms and data structures.

It connects learning topics to their corresponding visualization modules where available.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Webpage structure |
| CSS3 | Layout, styling, and animations |
| Vanilla JavaScript | Frontend logic and interactive visualizations |
| Java | Programming language used in Code Lab |
| Node.js | Backend API and execution orchestration |
| Java Debug Interface (JDI) | Java execution tracing |
| Docker | Isolated execution environment for submitted Java programs |
| npm | Backend scripts and test execution |
| Git and GitHub | Version control and source-code hosting |
| MySQL | Planned persistent data storage |

The frontend uses vanilla JavaScript rather than a frontend framework.

---

## 🏗️ System Architecture

ALGOLAB separates its visual learning interface from the Java execution service.

```text
                    STUDENT
                       |
                       v
              ALGOLAB FRONTEND
             HTML / CSS / JavaScript
                       |
          +------------+-------------+
          |            |             |
          v            v             v
    Algorithm       Data          Code Lab
    Visualizers   Structures         |
          |            |             v
          |            |       Node.js HTTP API
          |            |             |
          |            |             v
          |            |       Docker Runner
          |            |             |
          |            |             v
          |            |       Java Execution
          |            |             |
          |            |             v
          |            |        JDI Tracer
          |            |             |
          |            |             v
          |            |       Execution Events
          |            |             |
          +------------+-------------+
                       |
                       v
              VISUALIZATION &
             EDUCATIONAL FEEDBACK
```

The frontend handles visualizations and user interactions. The backend manages Java execution requests and communicates with the Docker-based runner.

The tracing component captures execution events, which are returned to Code Lab for playback and inspection.

**Database integration, persistent user accounts, and learning-progress storage are planned enhancements rather than completed features.**

---

## 📁 Project Structure

The following represents the main project areas. Exact filenames may vary as development continues.

```text
ALGOLAB/
│
├── frontend/
│   ├── index.html
│   ├── visualizer.html
│   ├── algorithms.html
│   ├── maze.html
│   ├── codelab.html
│   ├── stack.html
│   ├── queue.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── visualizer.js
│       ├── codelab.js
│       ├── stack.js
│       ├── queue.js
│       ├── playback-engine.js
│       └── explanation-engine.js
│
├── backend/
│   └── runner/
│       ├── server.js
│       ├── docker-runner.js
│       ├── Dockerfile
│       ├── package.json
│       └── tests/
│
├── .gitignore
├── .gitattributes
├── .env.example
└── README.md
```

This is a representative structure, not a guarantee that every listed file is present in the latest commit.

---

## 🚀 Getting Started

### Prerequisites

Install the following software:

- Git
- Node.js and npm
- Java Development Kit (JDK)
- Docker Desktop with Docker Engine running
- A modern web browser

The project has previously been developed and tested using Node.js 24.x and Java 25.x. Docker must be available for the containerized Java execution workflow.

### 1. Clone the Repository

```bash
git clone https://github.com/Preetpal10/ALGOLab.git
```

Navigate to the project directory:

```bash
cd ALGOLab
```

### 2. Verify the Development Environment

Check Node.js:

```bash
node --version
npm --version
```

Check Java:

```bash
java -version
javac -version
```

Check Docker:

```bash
docker --version
docker info
```

Docker must be running before attempting containerized Java execution.

### 3. Install Backend Dependencies

Navigate to the backend runner:

```bash
cd backend/runner
npm install
```

Return to the project root when needed:

```bash
cd ../..
```

The frontend consists of static HTML, CSS, and JavaScript files and does not require a frontend build step in its current architecture.

---

## 💻 Running the Application

### 1. Start the Java Execution Backend

Open a terminal in the project root:

```bash
cd backend/runner
npm start
```

Keep this terminal open while testing Code Lab.

The server's default host and port should be confirmed in the current `backend/runner/server.js` configuration. Previous development configuration used `127.0.0.1:3001`.

### 2. Check Backend Health

If the server uses the default local configuration, run this command in another terminal.

**PowerShell:**

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
```

A successful health response indicates that the HTTP API is reachable. It does not, by itself, prove that Java execution and tracing work end to end.

### 3. Serve the Frontend

From the project root, open another terminal:

```bash
npx serve frontend -l 8000
```

Open the website in your browser.

**Homepage**

```text
http://localhost:8000/
```

**Code Lab**

```text
http://localhost:8000/codelab.html
```

**Algorithm Explorer**

```text
http://localhost:8000/algorithms.html
```

**Maze Lab**

```text
http://localhost:8000/maze.html
```

**Stack Lab**

```text
http://localhost:8000/stack.html
```

**Queue Lab**

```text
http://localhost:8000/queue.html
```

If a route or filename differs in your latest repository, use the actual filename.

---

## ☕ Java Code Execution and Tracing

Code Lab is designed to connect Java source code with actual execution events.

The intended workflow is:

1. The student writes or selects a Java program.
2. The frontend submits the program to the backend API.
3. The backend passes the request to the Docker execution runner.
4. The Java program is compiled and executed in the container.
5. The tracing component captures execution events.
6. The backend returns the execution results and trace data.
7. The frontend displays the output and allows the student to inspect the trace.

The execution service must be running for the complete workflow to function in a local development environment.

### Execution Security

The runner uses Docker to isolate Java execution from the Node.js application process. Container resource limits and restricted execution settings are important because student-submitted code is untrusted.

The current project is a development-stage learning platform. Its execution environment should not be assumed to provide production-grade security for arbitrary public submissions without further security review.

---

## 🧪 Automated Testing

ALGOLAB uses Node.js automated tests to validate the tracing pipeline, visualizer logic, and data-structure behavior.

The Phase 10.2 development report recorded the following test results:

| Test Suite | Reported Result |
|---|---:|
| Queue Lab | 30/30 |
| Stack Lab | 22/22 |
| Routing and bug fixes | 41/41 |
| Educational explanations | 14/14 |
| Playback engine | 13/13 |
| Linear Search | 18/18 |
| Binary Search | 20/20 |
| **Total** | **158/158** |

These are results reported in the Phase 10.2 development report. They should be rerun against the current checkout before being presented as independently verified results.

To run the Queue Lab tests:

```bash
cd backend/runner
npm run test:queue
```

To run the Stack Lab tests:

```bash
npm run test:stack
```

To run the routing and playback regression tests:

```bash
npm run test:bugfix
```

To run the playback tests:

```bash
npm run test:playback
```

To run the educational explanation tests:

```bash
npm run test:explanation
```

To run the search tests:

```bash
npm run test:linear
npm run test:binary
```

The available test scripts can change during development. Check `backend/runner/package.json` for the commands supported by the current version.

Automated tests and manual browser testing are separate. A passing unit test does not necessarily prove that every interface works correctly in a browser.

---

## ⚠️ Current Limitations

ALGOLAB is actively under development.

The current implementation has the following known scope boundaries:

- MySQL integration and persistent application data are planned.
- Authentication and student accounts are planned.
- Persistent learning progress and saved results are planned.
- Practice Arena and comprehensive automated solution judging are planned.
- Queue Lab and other interactive visualizers should be manually tested in the browser before release.
- Public Java execution requires a properly deployed and security-reviewed backend.
- The development execution environment should not be treated as a production multi-tenant sandbox.

Some functionality is available locally but may not work on a static public deployment if it depends on the local backend.

---

## 🔮 Future Enhancements

The following features are candidates for future development.

### Data Structures

- Linked List Lab.
- Additional queue implementations.
- More advanced data-structure visualizations.

### Practice Arena

- DSA problem catalog.
- Problem descriptions and constraints.
- Sample input and output.
- Test-case evaluation.
- Submission results and feedback.

### Database Integration

- MySQL database design.
- Persistent problem and test-case storage.
- Saved user data.
- Learning-progress records.

### Authentication and Progress

- Student registration and login.
- User profiles.
- Progress tracking.
- Bookmarked algorithms.
- Completed problem history.

### Learning Experience

- Additional algorithm explanations.
- More Java starter templates.
- Improved execution tracing.
- Expanded algorithm coverage.
- Better mobile usability.

These are planned enhancements, not claims about existing functionality.

---

## 🤝 Contributing

ALGOLAB is an educational project developed to explore interactive algorithm learning, Java execution tracing, and data-structure visualization.

Suggestions and improvements are welcome.

When proposing changes:

1. Preserve the existing HTML, CSS, and vanilla JavaScript architecture.
2. Test changes against existing functionality.
3. Avoid introducing unnecessary dependencies.
4. Keep execution and tracing results truthful.
5. Document significant architectural changes.

---

## 👨‍💻 Author

Preetpal Singh
B.Tech — Computer Science & Engineering

**Project:** ALGOLAB — Interactive Data Structures & Algorithms Learning Platform

**GitHub:** https://github.com/Preetpal10

---


## 📄 License

The project's license has not yet been specified.

A suitable open-source license can be added after deciding how the project may be used, modified, and distributed.