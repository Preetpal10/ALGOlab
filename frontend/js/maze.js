// =====================================================
// ALGOLAB - maze.js
//
// This file is organized into 6 clearly separated parts,
// exactly like visualizer.js keeps algorithm logic apart
// from UI code:
//
//   PART 1: MAZE GENERATION        (pure logic, no DOM)
//   PART 2: BFS ALGORITHM          (pure logic, no DOM)
//   PART 3: DFS ALGORITHM          (pure logic, no DOM)
//   PART 4: STEP EXECUTION TRACE   (runs the chosen algorithm)
//   PART 5: UI RENDERING           (all DOM/drawing code)
//   PART 6: CONTROLS & EVENTS      (button wiring, playback)
//
// Data flow (as required):
//   Maze -> Grid (2D array) -> Algorithm -> Steps -> UI Animation
// =====================================================

export const MAZE_STORAGE_KEY = 'algolab_maze_state';

/**
 * Persists maze state (mazeData, size, algo) to web storage.
 */
export function saveMazeState(storage, state) {
  try {
    if (!storage || !state) return false;
    storage.setItem(MAZE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save maze state:', err);
    return false;
  }
}

/**
 * Loads saved maze state from web storage.
 */
export function loadMazeState(storage) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(MAZE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/* =====================================================
   PART 1: MAZE GENERATION
   Algorithm used: Recursive Backtracker (a DFS that carves
   passages using a stack). This always produces a maze that
   is a "perfect maze" - meaning there is exactly ONE path
   between any two open cells, so Start and End are always
   connected.
   ===================================================== */

/**
 * Generates a maze as a 2D grid.
 *   0 = walkable (open) cell
 *   1 = wall
 *
 * The grid size is forced to be an odd number. This is a
 * standard trick for grid mazes: cells that sit on EVEN
 * coordinates (0,2,4,...) are "rooms", and the cell directly
 * between two rooms is the wall/passage that connects them.
 *
 * @param {number} size - width and height of the maze (will be made odd)
 * @returns {{grid: number[][], size: number, start: {row:number,col:number}, end: {row:number,col:number}}}
 */
function generateMaze(size) {
  if (size % 2 === 0) size += 1; // must be odd so Start/End land on room cells

  // Step 1: start with a grid that is entirely walls
  const grid = [];
  for (let r = 0; r < size; r++) {
    grid.push(new Array(size).fill(1));
  }

  // Step 2: carve passages using an explicit stack (this IS a DFS traversal
  // over the grid of "rooms", which is why it's called DFS + Backtracking)
  const start = { row: 0, col: 0 };
  const end = { row: size - 1, col: size - 1 };

  grid[start.row][start.col] = 0; // open the starting room
  const stack = [start];

  // Moves jump 2 cells at a time because 1 cell in between is the wall
  // that we knock down when we move to a new room.
  const roomMoves = [
    { dr: -2, dc: 0 },
    { dr: 2, dc: 0 },
    { dr: 0, dc: -2 },
    { dr: 0, dc: 2 }
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1]; // look at top of stack, don't remove yet

    // Find neighboring rooms (2 cells away) that are still unvisited (still walls)
    const unvisitedNeighbors = [];
    for (const move of roomMoves) {
      const nr = current.row + move.dr;
      const nc = current.col + move.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 1) {
        unvisitedNeighbors.push({ row: nr, col: nc, dr: move.dr, dc: move.dc });
      }
    }

    if (unvisitedNeighbors.length > 0) {
      // Pick a random unvisited neighboring room
      const pick = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];

      // Knock down the wall between current room and the chosen neighbor
      const wallRow = current.row + pick.dr / 2;
      const wallCol = current.col + pick.dc / 2;
      grid[wallRow][wallCol] = 0;

      // Open the neighbor room and move into it
      grid[pick.row][pick.col] = 0;
      stack.push({ row: pick.row, col: pick.col });
    } else {
      // Dead end reached - backtrack (this is the "backtracking" part of DFS)
      stack.pop();
    }
  }

  // Safety: make sure Start and End are always open
  grid[start.row][start.col] = 0;
  grid[end.row][end.col] = 0;

  return { grid, size, start, end };
}

/**
 * Returns the walkable neighbors (up/down/left/right) of a cell.
 * Shared by both BFS and DFS since they explore the same graph.
 *
 * @param {{row:number,col:number}} cell
 * @param {number[][]} grid
 * @param {number} size
 * @returns {Array<{row:number,col:number}>}
 */
function getWalkableNeighbors(cell, grid, size) {
  const directions = [
    { dr: -1, dc: 0 }, // up
    { dr: 1, dc: 0 },  // down
    { dr: 0, dc: -1 }, // left
    { dr: 0, dc: 1 }   // right
  ];

  const neighbors = [];
  for (const dir of directions) {
    const nr = cell.row + dir.dr;
    const nc = cell.col + dir.dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 0) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

/** Turns a cell into a unique string key, used for lookup maps below. */
function cellKey(cell) {
  return cell.row + "," + cell.col;
}


/* =====================================================
   PART 2: BFS ALGORITHM (Breadth First Search)
   Uses a QUEUE. Explores the maze level-by-level, which is
   why BFS guarantees the SHORTEST path in an unweighted grid.
   ===================================================== */

/**
 * Runs real BFS over the maze graph and records every step.
 * Step types:
 *   "discover" - a cell was added to the queue (frontier)
 *   "process"  - a cell was taken out of the queue and examined
 *   "path"     - a cell that is part of the final shortest path
 *
 * @returns {{steps: Array<Object>, found: boolean, pathLength: number}}
 */
function generateBFSSteps(grid, size, start, end) {
  const steps = [];
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));
  const parentMap = {}; // child key -> parent cell, used to rebuild the path

  const queue = [start];
  visited[start.row][start.col] = true;
  steps.push({ type: "discover", row: start.row, col: start.col });

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift(); // FIFO: take from the FRONT (this is what makes it BFS)
    steps.push({ type: "process", row: current.row, col: current.col });

    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }

    const neighbors = getWalkableNeighbors(current, grid, size);
    for (const neighbor of neighbors) {
      if (!visited[neighbor.row][neighbor.col]) {
        visited[neighbor.row][neighbor.col] = true;
        parentMap[cellKey(neighbor)] = current;
        queue.push(neighbor); // add to the BACK of the queue
        steps.push({ type: "discover", row: neighbor.row, col: neighbor.col });
      }
    }
  }

  const path = found ? reconstructPath(parentMap, start, end) : [];
  path.forEach(function (cell) {
    steps.push({ type: "path", row: cell.row, col: cell.col });
  });

  return { steps, found, pathLength: path.length };
}


/* =====================================================
   PART 3: DFS ALGORITHM (Depth First Search)
   Uses a STACK (implemented with a plain array, not recursion,
   so it also works safely on large mazes). Explores one path
   as deep as possible before backtracking. Does NOT guarantee
   the shortest path.
   ===================================================== */

/**
 * Runs real DFS over the maze graph and records every step.
 * Uses the same step types as BFS ("discover", "process", "path")
 * so the UI code can render both algorithms identically.
 *
 * @returns {{steps: Array<Object>, found: boolean, pathLength: number}}
 */
function generateDFSSteps(grid, size, start, end) {
  const steps = [];
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));
  const parentMap = {};

  const stack = [start];
  visited[start.row][start.col] = true;
  steps.push({ type: "discover", row: start.row, col: start.col });

  let found = false;

  while (stack.length > 0) {
    const current = stack.pop(); // LIFO: take from the TOP (this is what makes it DFS)
    steps.push({ type: "process", row: current.row, col: current.col });

    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }

    const neighbors = getWalkableNeighbors(current, grid, size);
    for (const neighbor of neighbors) {
      if (!visited[neighbor.row][neighbor.col]) {
        visited[neighbor.row][neighbor.col] = true;
        parentMap[cellKey(neighbor)] = current;
        stack.push(neighbor); // push on TOP of the stack
        steps.push({ type: "discover", row: neighbor.row, col: neighbor.col });
      }
    }
  }

  const path = found ? reconstructPath(parentMap, start, end) : [];
  path.forEach(function (cell) {
    steps.push({ type: "path", row: cell.row, col: cell.col });
  });

  return { steps, found, pathLength: path.length };
}

/**
 * Walks backward from End to Start using the parent map built
 * during BFS/DFS, then reverses it so the path reads Start -> End.
 */
function reconstructPath(parentMap, start, end) {
  const path = [];
  let current = end;

  while (current && !(current.row === start.row && current.col === start.col)) {
    path.push(current);
    current = parentMap[cellKey(current)];
  }
  path.push(start);
  path.reverse();
  return path;
}


/* =====================================================
   PART 4: STEP EXECUTION TRACE
   A single entry point that runs whichever algorithm the
   user picked, on the current maze, and returns the trace.
   The UI (Part 5/6) never calls BFS/DFS directly - it only
   ever talks to this function.
   ===================================================== */

function runMazeAlgorithm(algorithmName, grid, size, start, end) {
  if (algorithmName === "dfs") {
    return generateDFSSteps(grid, size, start, end);
  }
  // Default to BFS
  return generateBFSSteps(grid, size, start, end);
}


/* =====================================================
   PART 5: UI RENDERING
   Everything below deals with drawing the maze grid and
   updating it as steps are replayed. No algorithm logic here.
   ===================================================== */

// ---- Module-level state for the Maze Lab page ----
let mazeData = null;        // { grid, size, start, end }
let cellElements = [];      // 2D array mirroring the grid, holding <div> references
let mazeSteps = [];         // steps produced by runMazeAlgorithm()
let mazeStepIndex = 0;      // which step we're currently showing
let mazeIsRunning = false;
let mazeIntervalId = null;
let lastProcessedCell = null; // used to downgrade "current" -> "visited"
let mazeResultInfo = { found: false, pathLength: 0 };

function isStartOrEnd(row, col) {
  return (
    (row === mazeData.start.row && col === mazeData.start.col) ||
    (row === mazeData.end.row && col === mazeData.end.col)
  );
}

/** Builds the maze grid in the DOM based on mazeData. */
function renderMazeGrid(container, mazeData) {
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${mazeData.size}, 1fr)`;
  container.style.maxWidth = "520px";

  cellElements = [];

  for (let r = 0; r < mazeData.size; r++) {
    const rowElements = [];
    for (let c = 0; c < mazeData.size; c++) {
      const cellDiv = document.createElement("div");
      cellDiv.className = "maze-cell";

      if (mazeData.grid[r][c] === 1) {
        cellDiv.classList.add("wall");
      }
      if (r === mazeData.start.row && c === mazeData.start.col) {
        cellDiv.classList.add("start");
      }
      if (r === mazeData.end.row && c === mazeData.end.col) {
        cellDiv.classList.add("end");
      }

      container.appendChild(cellDiv);
      rowElements.push(cellDiv);
    }
    cellElements.push(rowElements);
  }
}

/** Removes any exploration coloring (frontier/visited/current/path) from all cells. */
function clearExplorationStyles() {
  for (let r = 0; r < mazeData.size; r++) {
    for (let c = 0; c < mazeData.size; c++) {
      cellElements[r][c].classList.remove("frontier", "visited", "current", "path");
    }
  }
}

/** Applies a single algorithm step to the grid visuals. */
function applyMazeStep(step) {
  const cellDiv = cellElements[step.row][step.col];
  const keepBaseColor = isStartOrEnd(step.row, step.col);

  if (step.type === "discover") {
    if (!keepBaseColor) cellDiv.classList.add("frontier");
  } else if (step.type === "process") {
    // The previously "current" cell becomes permanently "visited"
    if (lastProcessedCell) {
      const prevDiv = cellElements[lastProcessedCell.row][lastProcessedCell.col];
      if (!isStartOrEnd(lastProcessedCell.row, lastProcessedCell.col)) {
        prevDiv.classList.remove("current");
        prevDiv.classList.add("visited");
      }
    }
    if (!keepBaseColor) {
      cellDiv.classList.remove("frontier");
      cellDiv.classList.add("current");
    }
    lastProcessedCell = { row: step.row, col: step.col };
  } else if (step.type === "path") {
    if (!keepBaseColor) {
      cellDiv.classList.remove("frontier", "visited", "current");
      cellDiv.classList.add("path");
    }
  }
}

/** Updates the Execution Info side panel. */
function updateExecutionInfoPanel(elements, algorithmName, stepIndex) {
  // Count distinct "process" steps up to this point = cells actually visited
  let visitedCount = 0;
  for (let i = 0; i <= stepIndex; i++) {
    if (mazeSteps[i] && mazeSteps[i].type === "process") visitedCount++;
  }

  elements.infoAlgorithm.textContent = algorithmName.toUpperCase();
  elements.infoVisited.textContent = visitedCount;
  elements.infoSteps.textContent = stepIndex;

  const isFinished = stepIndex >= mazeSteps.length - 1;
  if (isFinished) {
    elements.infoPathLength.textContent = mazeResultInfo.found ? mazeResultInfo.pathLength : 0;
    elements.infoStatus.textContent = mazeResultInfo.found ? "Path Found" : "No Path";
  } else {
    elements.infoPathLength.textContent = 0;
    elements.infoStatus.textContent = "Searching";
  }
}

/** Updates the explanation text panel based on which algorithm is selected. */
function updateAlgorithmExplanation(elements, algorithmName) {
  if (algorithmName === "dfs") {
    elements.explanation.textContent =
      "Depth First Search explores one path deeply before backtracking. " +
      "It can find a path but does not guarantee the shortest path in an unweighted maze.";
    elements.dataStructure.textContent = "Stack (array used as a stack)";
  } else {
    elements.explanation.textContent =
      "Breadth First Search explores nodes level-by-level and uses a queue. " +
      "In an unweighted grid, BFS can find a shortest path.";
    elements.dataStructure.textContent = "Queue";
  }
  // Both BFS and DFS have the same theoretical complexity on a grid graph
  elements.complexityTime.textContent = "O(V + E)";
  elements.complexitySpace.textContent = "O(V)";
}


/* =====================================================
   PART 6: CONTROLS AND EVENT LISTENERS
   Wires up all the buttons/selects on maze.html and drives
   playback using the steps produced in Part 4.
   ===================================================== */

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener("DOMContentLoaded", function () {
  const gridContainer = document.getElementById("maze-grid");
  if (!gridContainer) {
    return; // Not on the Maze Lab page, do nothing
  }

  // ---- Gather DOM elements ----
  const algoSelect = document.getElementById("algo-select");
  const sizeSelect = document.getElementById("size-select");
  const generateBtn = document.getElementById("generate-maze-btn");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resetBtn = document.getElementById("maze-reset-btn");
  const speedRange = document.getElementById("maze-speed-range");
  const stepMessageEl = document.getElementById("maze-step-message");

  const infoElements = {
    infoAlgorithm: document.getElementById("info-algorithm"),
    infoVisited: document.getElementById("info-visited"),
    infoPathLength: document.getElementById("info-path-length"),
    infoSteps: document.getElementById("info-steps"),
    infoStatus: document.getElementById("info-status"),
    explanation: document.getElementById("algo-explanation"),
    dataStructure: document.getElementById("algo-data-structure"),
    complexityTime: document.getElementById("complexity-time"),
    complexitySpace: document.getElementById("complexity-space")
  };

  // ---- Generate a brand new maze ----
  function handleGenerateMaze() {
    stopMazePlayback();

    const size = parseInt(sizeSelect.value, 10);
    mazeData = generateMaze(size);
    renderMazeGrid(gridContainer, mazeData);

    mazeSteps = [];
    mazeStepIndex = 0;
    lastProcessedCell = null;
    mazeResultInfo = { found: false, pathLength: 0 };

    stepMessageEl.textContent = "Maze generated. Choose an algorithm and click Start.";
    infoElements.infoStatus.textContent = "Ready";
    infoElements.infoVisited.textContent = "0";
    infoElements.infoPathLength.textContent = "0";
    infoElements.infoSteps.textContent = "0";

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    persistMaze();
  }

  function persistMaze() {
    if (mazeData) {
      saveMazeState(localStorage, {
        mazeData,
        size: sizeSelect.value,
        algo: algoSelect.value
      });
    }
  }

  // ---- Start solving with the currently selected algorithm ----
  function handleStart() {
    if (!mazeData) return;

    // If we're resuming a paused run, just continue the interval
    if (mazeSteps.length > 0 && mazeStepIndex < mazeSteps.length - 1 && !mazeIsRunning) {
      startMazePlayback();
      return;
    }

    // Otherwise compute a fresh set of steps for the selected algorithm
    clearExplorationStyles();
    const algorithmName = algoSelect.value;
    const result = runMazeAlgorithm(algorithmName, mazeData.grid, mazeData.size, mazeData.start, mazeData.end);

    mazeSteps = result.steps;
    mazeResultInfo = { found: result.found, pathLength: result.pathLength };
    mazeStepIndex = 0;
    lastProcessedCell = null;

    infoElements.infoStatus.textContent = "Searching";
    stepMessageEl.textContent = `Running ${algorithmName.toUpperCase()}...`;

    startMazePlayback();
  }

  // ---- Advance through mazeSteps on a timer ----
  function startMazePlayback() {
    if (mazeIsRunning || mazeSteps.length === 0) return;
    mazeIsRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    // Same "slider right = faster" convention used in the Bubble Sort visualizer
    const rawValue = parseInt(speedRange.value, 10);
    const delay = (10 + 200) - rawValue;

    mazeIntervalId = setInterval(function () {
      if (mazeStepIndex >= mazeSteps.length) {
        finishMazePlayback();
        return;
      }
      applyMazeStep(mazeSteps[mazeStepIndex]);
      updateExecutionInfoPanel(infoElements, algoSelect.value, mazeStepIndex);
      mazeStepIndex++;

      if (mazeStepIndex >= mazeSteps.length) {
        finishMazePlayback();
      }
    }, delay);
  }

  function finishMazePlayback() {
    stopMazePlayback();
    stepMessageEl.textContent = mazeResultInfo.found
      ? `Path found! Length: ${mazeResultInfo.pathLength} cells.`
      : "No path could be found.";
    startBtn.disabled = true; // nothing more to run until Reset or Generate
  }

  function stopMazePlayback() {
    mazeIsRunning = false;
    if (mazeIntervalId !== null) {
      clearInterval(mazeIntervalId);
      mazeIntervalId = null;
    }
    if (pauseBtn) pauseBtn.disabled = true;
    if (startBtn && mazeData && mazeSteps.length > 0 && mazeStepIndex < mazeSteps.length - 1) {
      startBtn.disabled = false; // allow resuming
    }
  }

  // ---- Reset the visualization (keeps the same maze) ----
  function handleReset() {
    stopMazePlayback();
    if (!mazeData) return;

    clearExplorationStyles();
    mazeSteps = [];
    mazeStepIndex = 0;
    lastProcessedCell = null;
    mazeResultInfo = { found: false, pathLength: 0 };

    stepMessageEl.textContent = "Reset. Click Start to run the algorithm again.";
    infoElements.infoStatus.textContent = "Ready";
    infoElements.infoVisited.textContent = "0";
    infoElements.infoPathLength.textContent = "0";
    infoElements.infoSteps.textContent = "0";

    startBtn.disabled = false;
    pauseBtn.disabled = true;
  }

  // ---- Wire up event listeners ----
  generateBtn.addEventListener("click", handleGenerateMaze);
  startBtn.addEventListener("click", handleStart);
  pauseBtn.addEventListener("click", stopMazePlayback);
  resetBtn.addEventListener("click", handleReset);

  algoSelect.addEventListener("change", function () {
    updateAlgorithmExplanation(infoElements, algoSelect.value);
    persistMaze();
  });

  speedRange.addEventListener("input", function () {
    if (mazeIsRunning) {
      stopMazePlayback();
      startMazePlayback();
    }
  });

  // ---- Initial page state ----
  updateAlgorithmExplanation(infoElements, algoSelect.value);

  // Restore saved maze if available
  const savedMaze = loadMazeState(localStorage);
  if (savedMaze && savedMaze.mazeData) {
    mazeData = savedMaze.mazeData;
    if (savedMaze.size && sizeSelect) sizeSelect.value = savedMaze.size;
    if (savedMaze.algo && algoSelect) {
      algoSelect.value = savedMaze.algo;
      updateAlgorithmExplanation(infoElements, algoSelect.value);
    }
    renderMazeGrid(gridContainer, mazeData);
    stepMessageEl.textContent = "Saved maze restored. Choose an algorithm and click Start.";
    infoElements.infoStatus.textContent = "Ready";
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
  } else {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
  }
});
}

export { generateMaze, runMazeAlgorithm };
