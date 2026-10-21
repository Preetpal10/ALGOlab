# ALGOLAB
### Interactive Data Structures and Algorithm Visualization & Learning Platform

**Learn algorithms by watching them execute.**

ALGOLAB is a web-based educational platform designed to help students understand Data Structures and Algorithms (DSA) through interactive visualizations, Java code execution, step-by-step execution tracing, and programming practice.

Instead of relying only on static diagrams or theoretical explanations, ALGOLAB provides an interactive environment where learners can explore algorithm behavior, observe changes in data structures, write Java programs, inspect variable states, and practice solving programming problems.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Database Overview](#database-overview)
- [Security Considerations](#security-considerations)
- [Current Limitations](#current-limitations)
- [Future Scope](#future-scope)
- [Academic Information](#academic-information)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

Learning Data Structures and Algorithms is an essential part of computer science education. However, understanding how algorithms execute internally can be difficult when students only read source code or study static diagrams.

ALGOLAB addresses this challenge by connecting algorithm theory with interactive execution and visualization.

The platform provides dedicated learning environments for sorting, searching, linear data structures, trees, graphs, and maze pathfinding. Its Code Lab allows students to write Java programs and inspect their execution through tracing and visualization tools. The Practice Arena provides programming problems and a workflow for evaluating submitted solutions.

### Core Learning Workflow

1. **Explore:** Select an algorithm or data structure.
2. **Understand:** Examine its logic and behavior.
3. **Write Code:** Create or modify a Java program.
4. **Execute:** Run the program in the supported execution environment.
5. **Visualize:** Observe execution steps and relevant program state.
6. **Practice:** Solve programming problems and review results.

### Project Identity

| Attribute | Details |
|---|---|
| Project Name | ALGOLAB |
| Full Title | Interactive Data Structures and Algorithm Visualization & Learning Platform |
| Project Type | Web-Based Educational Application |
| Domain | Computer Science Education |
| Primary Language for Code Lab | Java |
| Academic Program | B.Tech Computer Science and Engineering |
| University | Rayat Bahra University |

---

## Problem Statement

Students often face difficulties understanding Data Structures and Algorithms because:

- Algorithm execution is difficult to visualize mentally.
- Loops and conditional statements can be challenging to trace.
- Changes in array elements, pointers, and variables are not always obvious.
- Static diagrams do not show every execution step.
- Students may understand the theory but struggle to implement it in code.
- Practicing programming problems does not always explain why a solution succeeds or fails.

ALGOLAB aims to reduce these difficulties by combining interactive visualization, program execution, execution tracing, and programming practice in one learning platform.

---

## Objectives

The main objectives of ALGOLAB are:

1. Develop an interactive platform for learning Data Structures and Algorithms.
2. Visualize algorithm execution through meaningful state changes.
3. Provide an environment for writing and running Java programs.
4. Help students inspect variable values and program execution steps.
5. Explain important operations during algorithm execution.
6. Provide interactive labs for exploring common data structures.
7. Offer programming practice with automated test-case evaluation.
8. Support the persistence of relevant user information, submissions, and learning progress.
9. Create a foundation for future educational features and additional algorithms.

---

## Key Features

### 1. Interactive Dashboard and Navigation

The application provides a shared navigation experience for accessing its learning modules.

Features include:

- Navigation between available learning modules.
- Responsive interface for different screen sizes.
- Sidebar navigation with toggle controls.
- Access to the platform's main learning areas.

### 2. Algorithm Visualizer

The visualizer helps students understand how sorting and searching algorithms operate.

Available algorithm implementations include:

- Bubble Sort
- Selection Sort
- Insertion Sort
- Linear Search
- Binary Search

Depending on the selected visualizer, students can explore the algorithm's execution, observe changes in the data, and use the available playback controls.

### 3. Data Structure Labs

ALGOLAB includes interactive learning environments for common data structures.

**Stack Lab**
- Push and pop operations.
- Stack state visualization.
- Last-In, First-Out (LIFO) behavior.

**Queue Lab**
- Enqueue and dequeue operations.
- Queue state visualization.
- First-In, First-Out (FIFO) behavior.

**Linked List Lab**
- Linked list operations.
- Node and pointer relationships.
- Visualization of structural changes.

**Tree Lab**
- Binary Search Tree operations.
- Insertion and deletion.
- Tree traversal and structural visualization.

The exact operations available depend on the individual lab implementation.

### 4. Graph Lab

The Graph Lab helps students understand graph traversal and shortest-path concepts.

Supported graph algorithms include:

- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Dijkstra's shortest-path algorithm

The lab provides a visual environment for exploring graph structures, node visits, and algorithm behavior.

### 5. Maze Lab

Maze Lab demonstrates how search algorithms explore a grid to find a path between a starting point and a destination.

Features include:

- Maze generation.
- Start and destination cells.
- Grid-based pathfinding.
- BFS visualization.
- DFS visualization.
- Animated exploration of visited cells and paths.

Additional pathfinding algorithms can be incorporated as the project evolves.

### 6. Java Code Lab

The Code Lab is designed to help students connect Java source code with program execution.

Its interface includes:

- Java code editor.
- Java code templates.
- Code execution controls.
- Standard input area.
- Console output.
- Execution trace controls.
- Trace visualization.
- Variable and program-state inspection.
- Reset functionality.
- 
The Code Lab interface provides controls for Java code editing,
execution, console output, execution tracing, and program-state
inspection.

The backend uses Node.js and a Docker-based Java execution runner.
Java tracing uses the Java Debug Interface (JDI) for supported
programs.

**Current deployment status:** The Code Lab interface is deployed,
but live Java execution and tracing are not available on the public
website until the backend and execution environment are deployed
and configured.

Pre-recorded trace demonstrations may be available where supported.
They should not be confused with live execution of user-submitted
Java code.

### 7. Practice Arena

Practice Arena provides a dedicated environment for solving programming problems.

The current problem set includes:

- Reverse Array
- Find Largest Element
- Linear Search
- Binary Search
- Move Zeros to End

Features include:

- Problem selection.
- Starter code.
- Editable solution code.
- Sample test cases.
- Hidden test cases.
- Solution submission and evaluation.
- Code reset functionality.
- Independent drafts for different problems.
- Transfer of code from Practice Arena to Code Lab.

**Current deployment status:** The Practice Arena interface is
available on the deployed frontend. Automated submission evaluation
requires the backend, database configuration where applicable,
and a working code execution service.

Live judging is not currently configured on the public deployment.

### 8. Authentication and Progress Persistence

The backend supports application functionality for:

- Student registration and login.
- Session management.
- Submission persistence.
- Problem progress persistence.
- Lab-state persistence.

**Current deployment status:** Production database connectivity
has not yet been configured. Database-dependent authentication,
submission persistence, and learning-progress persistence may
therefore be unavailable on the public website.

### 9. Execution Status and Error Handling

Practice Arena checks backend availability and displays a status indicator.

The status can distinguish between conditions such as:

- Checking availability.
- Judge Online.
- Backend Offline.
- Judge Unavailable.
- Backend Timeout.
- Offline Mode.

This helps students understand whether the execution service is available instead of assuming that code evaluation is always active.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling, layouts, and responsive design |
| Vanilla JavaScript | Frontend interactions and visualization logic |
| Java | Student programs and Java execution tracing |
| Node.js | Backend HTTP API and execution orchestration |
| MySQL 8 | Persistent structured application data |
| Docker | Isolated Java execution environment |
| Java Debug Interface (JDI) | Java execution tracing |
| Git | Version control |
| GitHub | Source code hosting |
| VS Code | Development environment |

The frontend uses HTML, CSS, and vanilla JavaScript. The application does not require a React migration.

---

## System Architecture

ALGOLAB follows a layered architecture.

### 1. Presentation Layer

The presentation layer contains the user-facing web interface.

Responsibilities:

- Display learning modules.
- Collect user input.
- Render algorithm and data structure states.
- Provide editor and playback controls.
- Display execution output and evaluation results.

**Technologies:** HTML, CSS, and vanilla JavaScript.

### 2. Application and API Layer

The backend provides application services and coordinates communication between the frontend, database, and execution runner.

Responsibilities:

- Handle API requests.
- Manage authentication and sessions.
- Process programming submissions.
- Persist user data and learning progress.
- Coordinate code execution.
- Return execution results and status information.

**Technology:** Node.js.

### 3. Execution Layer

The execution layer handles supported Java program compilation, execution, and tracing.

Responsibilities:

- Receive supported execution requests.
- Compile and run Java programs.
- Apply Docker-based execution isolation.
- Collect tracing information through JDI.
- Return output, errors, and trace data.

**Technologies:** Java, Node.js, Docker, and JDI.

### 4. Data Layer

The data layer stores structured application information.

The documented database entities include:

- `users`
- `sessions`
- `submissions`
- `problem_progress`
- `lab_states`

**Technology:** MySQL.

### Architecture Flow

```text
+---------------------------------------+
|              Student                  |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
|           Frontend Interface          |
|       HTML + CSS + JavaScript         |
|                                       |
| Visualizers | Code Lab | Practice     |
+-------------------+-------------------+
                    |
                    v
+---------------------------------------+
|          Node.js Backend API          |
|                                       |
| Authentication | Submissions | State  |
+-----------+-------------------+-------+
            |                   |
            v                   v
+---------------------+  +---------------------+
| Java Execution      |  | MySQL Database      |
| Runner              |  |                     |
|                     |  | Users and Sessions  |
| Docker + Java + JDI |  | Progress and States |
+---------------------+  +---------------------+
            |
            v
+---------------------------------------+
| Results, Output and Execution Trace    |
+---------------------------------------+
```

---

## Project Structure

The following is the logical structure of the main application components. Some files and folders may vary depending on the current development version.

```text
ALGOLAB-frontend_3/
│
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/
│   ├── index.html
│   ├── algorithms.html
│   ├── visualizer.html
│   ├── codelab.html
│   ├── practice.html
│   ├── maze.html
│   ├── graph.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── main.js
│       ├── visualizer.js
│       ├── codelab.js
│       ├── practice.js
│       └── maze.js
│
├── backend/
│   └── runner/
│       ├── package.json
│       ├── .env.example
│       ├── env.js
│       └── tests/
│
└── docs/
    ├── FINAL_PROJECT_REPORT.md
    ├── TECHNICAL_DOCUMENTATION.md
    ├── DATABASE_DOCUMENTATION.md
    ├── API_DOCUMENTATION.md
    ├── TESTING_REPORT.md
    └── SETUP_GUIDE.md
```

The structure above summarizes the principal components; it is not an exhaustive inventory of every source file.

---

## Installation and Setup

The following instructions describe a local Windows development setup.

### Prerequisites

Install or configure the following tools:

- Git
- Node.js and npm
- Java Development Kit (JDK)
- Docker Desktop with a working Docker engine
- MySQL Server 8
- Visual Studio Code or another code editor

Verify that the required commands are available:

```powershell
git --version
node --version
npm --version
java -version
javac -version
docker --version
docker info
```

The Docker engine must be running for live sandboxed Java execution.

### Step 1: Clone the Repository

```powershell
git clone https://github.com/Preetpal10/ALGOLab.git
cd ALGOLab
```

If you already have the project locally, open the existing project directory instead of cloning it again.

### Step 2: Configure the Backend

Navigate to the backend runner directory:

```powershell
cd backend/runner
```

Create your local environment configuration from the example file:

```powershell
Copy-Item .env.example .env
```

Open `.env` and enter the correct local configuration values.

Depending on the existing configuration, these may include:

- MySQL host and port.
- Application database name.
- Application database username.
- Application database password.
- Session secret.
- Backend port.
- Java and Docker runner settings.

Use the variable names already defined in `backend/runner/.env.example`. Do not invent variable names or share real credentials.

**Security note:** Keep `.env` files private. Never commit database passwords, session secrets, or other credentials to GitHub.

### Step 3: Install Backend Dependencies

From `backend/runner`, run:

```powershell
npm install
```

### Step 4: Configure MySQL

Ensure that MySQL Server is running.

Create and configure the application database and its application user according to your project's database setup instructions.

Use the SQL schema, migration scripts, and configuration documented in the project. Avoid modifying unrelated databases or existing user records.

If the project provides database initialization or migration commands, follow the documented commands before starting the backend.

### Step 5: Start Docker Desktop

Start Docker Desktop and confirm that the Docker engine is available:

```powershell
docker info
```

If Docker is unavailable, the application may still open, but live sandboxed Java execution and judging may not work.

---

## Running the Application

Start the backend and frontend in separate terminals.

### Terminal 1: Start the Backend

```powershell
cd backend/runner
npm start
'''

The backend is configured to use port `3001` in the documented local setup.

Check the health endpoint:

```text
http://127.0.0.1:3001/api/health
```

A successful health response indicates that the backend is reachable. Live judging also depends on the execution runner and Docker being available.

### Terminal 2: Start the Frontend

```powershell
npx serve -l 8000 frontend
```

Open the application in your browser:

**Main application:**

http://localhost:8000

**Code Lab:**

http://localhost:8000/codelab.html

**Practice Arena:**

http://localhost:8000/practice.html

**Graph Lab:**

http://localhost:8000/graph.html

**Maze Lab:**

http://localhost:8000/maze.html

If your project is located in a different directory, update the commands accordingly.

---

## Testing

ALGOLAB includes automated tests for important frontend logic, backend services, algorithm implementations, execution tracing, and integration behavior.

The documented test coverage includes areas such as:

- Authentication and session handling.
- Submission persistence.
- Lab-state persistence.
- Code draft persistence.
- Practice Arena reset behavior.
- Practice-to-Code Lab code transfer.
- Sorting and searching algorithms.
- Stack and queue operations.
- Linked list operations.
- Binary Search Tree operations.
- Graph traversal and shortest paths.
- Execution tracing and playback.
- Backend API behavior.
- Frontend integration.
- Docker runner behavior.

### Run the Automated Tests

Navigate to the backend runner directory:

```powershell
cd backend/runner
```

Run the test commands defined in the project's `package.json`.

For example, if the corresponding script exists:

```powershell
npm run test:integration
```

To inspect the available test scripts:

```powershell
npm run
```

The project audit report for Phase 18B records **422 tests passed, 0 failed, and 0 skipped across 24 test suites**.

These figures represent the documented results of that audit. Run the tests again against the current checkout to establish the result for your own environment.

For the detailed test inventory, methodology, and reported results, see `docs/TESTING_REPORT.md`.

---

## Database Overview

The backend uses MySQL for persistent structured data.

The documented database entities include:

| Table | Purpose |
|---|---|
| `users` | Student account information |
| `sessions` | Application session records |
| `submissions` | Programming submission records |
| `problem_progress` | Problem-solving progress |
| `lab_states` | Persisted state for supported learning labs |

The exact schema, keys, constraints, and relationships are documented in:

`docs/DATABASE_DOCUMENTATION.md`

Database initialization and local configuration should follow the project's schema and setup instructions.

---

## Security Considerations

Security is important because the platform supports user accounts and student-submitted code.

The application design includes the following considerations:

- Keep credentials in environment files rather than frontend JavaScript.
- Exclude secret-bearing `.env` files from version control.
- Use an application-specific database account with appropriate permissions.
- Store passwords using a password-hashing mechanism.
- Manage authenticated sessions through the backend.
- Execute supported Java programs in a Docker-based isolated environment.
- Apply resource limits to code execution.
- Avoid granting the execution container unnecessary privileges.
- Keep the database and execution services separate from the public frontend.

Docker-based execution is intended to reduce the risks of running student code. It should not be treated as a guarantee of complete security.

Before exposing the execution service to the public internet, review its authentication, rate limits, resource restrictions, network isolation, logging, and operational monitoring.

---

## Current Limitations

## Current Limitations

The availability of ALGOLAB features depends on the deployment
environment and the services configured for the application.

1. **Java-focused execution:** Code Lab and Practice Arena currently
   focus on Java programs.

2. **Backend deployment:** The frontend is deployed on Netlify, but
   the production backend has not yet been deployed.

3. **Code Lab:** The interface is available, but live Java execution
   and tracing require a deployed and accessible backend with the
   required Docker execution environment.

4. **Practice Arena:** The interface is available, but automated
   submission judging requires the backend and execution service.

5. **Database:** Production database connectivity has not yet been
   configured. Authentication and persistent progress features
   that depend on the backend may therefore be unavailable.

6. **Docker dependency:** Live sandboxed Java execution requires a
   working Docker environment supported by the backend host.

7. **Algorithm coverage:** The platform does not yet implement every
   possible algorithm or data structure.

8. **Execution tracing:** Trace visualization and state inspection
   depend on the supported Java execution and tracing implementation.

These limitations describe the reported deployment state. Reassess
them after deploying the backend and database.

---

## Future Scope

Potential future improvements include:

- Support for additional programming languages.
- More algorithms and data structures.
- Additional graph and pathfinding algorithms.
- More practice problems and structured difficulty levels.
- Improved explanations for complex execution steps.
- Enhanced learning progress dashboards.
- Additional performance and complexity comparisons.
- Expanded test coverage and accessibility improvements.
- Improved deployment and operational monitoring.
- Additional learning resources and guided exercises.

These items describe possible future development and should not be interpreted as completed features.

---

## Academic Information

**Project Title:** ALGOLAB — Interactive Data Structures and Algorithm Visualization & Learning Platform

**Degree:** Bachelor of Technology (B.Tech)

**Branch:** Computer Science and Engineering

**University:** Rayat Bahra University

**Student Name:** Preetpal Singh




---

## Contributing

Contributions that improve the platform's educational value, correctness, usability, or reliability are welcome.

A suggested contribution workflow is:

1. Review the existing implementation.
2. Identify a focused improvement or bug.
3. Create a separate Git branch.
4. Implement and test the change.
5. Verify that existing features remain functional.
6. Submit the changes for review.

Avoid committing secrets, local environment files, generated credentials, or private development prompts.

---

## License

No license has been specified in this README.

Before distributing or reusing the project, choose and add an appropriate license file if required. Until a license is added, do not assume that the repository grants permission for unrestricted reuse.

---

## Acknowledgment

ALGOLAB is an academic software project developed to support the learning of Data Structures and Algorithms through interactive visualization, code execution, and programming practice.

The project demonstrates the application of frontend development, backend programming, database design, algorithm implementation, execution tracing, and software testing to an educational problem.

**ALGOLAB — Understand the Logic. Visualize the Execution. Master the Algorithm.**
