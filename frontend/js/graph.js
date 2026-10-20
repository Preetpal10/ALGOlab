// =============================================================================
// ALGOLAB - graph.js
// Phase 13: Interactive Graph Lab
//
// Graph Data Structure & Algorithm Visualization Engine.
// Supports:
// - Directed & Undirected graphs
// - Weighted & Unweighted edges
// - Adjacency Matrix & Adjacency List representations
// - Graph mutations (Add/Remove Node, Add/Remove Edge with incident cleanup)
// - Validation (endpoints, self-loops, duplicate edges, negative weights)
// - Algorithms: Breadth-First Search (BFS), Depth-First Search (DFS),
//   and Dijkstra's Shortest Path Algorithm
// - Deterministic step generator with immutable state snapshots
// - Interactive SVG Canvas with draggable nodes & marker arrowheads
// - Playback engine (Play, Pause, Prev, Next, Reset, Speed control)
// - Stale timer protection via sequenceToken
// - Plain-language educational explanation cards & Live Distance Table
export const GRAPH_STORAGE_KEY = 'algolab_graph_state';

/**
 * Persists graph state (nodes, edges, directed, weighted, preset) to web storage.
 */
export function saveGraphState(storage, state) {
  try {
    if (!storage || !state) return false;
    storage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('Failed to save graph state:', err);
    return false;
  }
}

/**
 * Loads saved graph state from web storage.
 */
export function loadGraphState(storage) {
  try {
    if (!storage) return null;
    const raw = storage.getItem(GRAPH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * GraphEngine provides headless graph state management and deterministic
 * algorithm step generation. Usable both in browser and Node.js environments.
 */
class GraphEngine {
  constructor(options = {}) {
    this.isDirected = Boolean(options.isDirected);
    this.isWeighted = Boolean(options.isWeighted);

    // Nodes: Map<id, { id: string, label: string, x: number, y: number }>
    this.nodes = new Map();

    // Edges: Array<{ id: string, from: string, to: string, weight: number }>
    this.edges = [];

    // History of algorithm steps (immutable snapshots)
    this.history = [];
    this.currentHistoryIndex = -1;

    // Sequence token to prevent stale timer race conditions
    this.sequenceToken = 0;

    // Counter for auto-generating unique node IDs
    this._nodeIdCounter = 0;

    // Record initial empty state
    this._recordInitialStep('Graph initialized. Canvas is ready.');
  }

  // ---------------------------------------------------------------------------
  // Mutation API
  // ---------------------------------------------------------------------------

  /**
   * Adds a node with a given label.
   * Auto-assigns position if x, y are omitted.
   * @param {string} label - Human-readable node label (e.g. 'A', 'B')
   * @param {number} [x]
   * @param {number} [y]
   * @returns {{ success: boolean, node?: object, error?: string }}
   */
  addNode(label, x = null, y = null) {
    const cleanLabel = String(label || '').trim();
    if (!cleanLabel) {
      return { success: false, error: 'Node label cannot be empty.' };
    }

    // Check for duplicate label
    for (const node of this.nodes.values()) {
      if (node.label.toUpperCase() === cleanLabel.toUpperCase()) {
        return { success: false, error: `Node with label "${cleanLabel}" already exists.` };
      }
    }

    const id = `node_${++this._nodeIdCounter}`;
    
    // Default circular or staggered placement if coordinates omitted
    let posX = x;
    let posY = y;
    if (posX === null || posY === null) {
      const count = this.nodes.size;
      const angle = (count * 2 * Math.PI) / Math.max(count + 1, 6);
      posX = Math.round(380 + 170 * Math.cos(angle));
      posY = Math.round(230 + 130 * Math.sin(angle));
    }

    const node = { id, label: cleanLabel, x: posX, y: posY };
    this.nodes.set(id, node);

    this._recordInitialStep(`Added node ${cleanLabel}.`);
    return { success: true, node };
  }

  /**
   * Removes a node and all of its incident edges (both outgoing and incoming).
   * @param {string} nodeIdOrLabel
   * @returns {{ success: boolean, removedEdgesCount: number, error?: string }}
   */
  removeNode(nodeIdOrLabel) {
    const node = this._resolveNode(nodeIdOrLabel);
    if (!node) {
      return { success: false, removedEdgesCount: 0, error: `Node "${nodeIdOrLabel}" not found.` };
    }

    const nodeId = node.id;
    const initialEdgeCount = this.edges.length;

    // Remove all incident edges
    this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    const removedEdgesCount = initialEdgeCount - this.edges.length;

    this.nodes.delete(nodeId);

    this._recordInitialStep(`Removed node ${node.label} and ${removedEdgesCount} incident edge(s).`);
    return { success: true, removedEdgesCount };
  }

  /**
   * Adds an edge between fromNode and toNode.
   * @param {string} fromIdOrLabel
   * @param {string} toIdOrLabel
   * @param {number} [weight=1]
   * @returns {{ success: boolean, edge?: object, error?: string }}
   */
  addEdge(fromIdOrLabel, toIdOrLabel, weight = 1) {
    const fromNode = this._resolveNode(fromIdOrLabel);
    const toNode = this._resolveNode(toIdOrLabel);

    if (!fromNode) {
      return { success: false, error: `Source node "${fromIdOrLabel}" does not exist.` };
    }
    if (!toNode) {
      return { success: false, error: `Target node "${toIdOrLabel}" does not exist.` };
    }

    const numWeight = Number(weight);
    if (isNaN(numWeight)) {
      return { success: false, error: 'Edge weight must be a valid number.' };
    }

    // Check duplicate edge
    const existing = this._findEdge(fromNode.id, toNode.id);
    if (existing) {
      return { success: false, error: `Edge between ${fromNode.label} and ${toNode.label} already exists.` };
    }

    const edgeId = `edge_${fromNode.id}_${toNode.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newEdge = {
      id: edgeId,
      from: fromNode.id,
      to: toNode.id,
      weight: numWeight
    };

    this.edges.push(newEdge);

    const weightText = this.isWeighted ? ` (weight: ${numWeight})` : '';
    const arrow = this.isDirected ? '->' : '<->';
    this._recordInitialStep(`Added edge ${fromNode.label} ${arrow} ${toNode.label}${weightText}.`);

    return { success: true, edge: newEdge };
  }

  /**
   * Removes an edge between two nodes.
   * @param {string} fromIdOrLabel
   * @param {string} toIdOrLabel
   * @returns {{ success: boolean, error?: string }}
   */
  removeEdge(fromIdOrLabel, toIdOrLabel) {
    const fromNode = this._resolveNode(fromIdOrLabel);
    const toNode = this._resolveNode(toIdOrLabel);

    if (!fromNode || !toNode) {
      return { success: false, error: 'One or both endpoint nodes do not exist.' };
    }

    const edge = this._findEdge(fromNode.id, toNode.id);
    if (!edge) {
      return { success: false, error: `No edge found between ${fromNode.label} and ${toNode.label}.` };
    }

    this.edges = this.edges.filter(e => e.id !== edge.id);

    const arrow = this.isDirected ? '->' : '<->';
    this._recordInitialStep(`Removed edge ${fromNode.label} ${arrow} ${toNode.label}.`);
    return { success: true };
  }

  /**
   * Toggles or sets directed mode.
   * @param {boolean} directed
   */
  setDirected(directed) {
    this.isDirected = Boolean(directed);
    this._recordInitialStep(`Switched graph mode to ${this.isDirected ? 'Directed' : 'Undirected'}.`);
  }

  /**
   * Toggles or sets weighted mode.
   * @param {boolean} weighted
   */
  setWeighted(weighted) {
    this.isWeighted = Boolean(weighted);
    this._recordInitialStep(`Switched graph mode to ${this.isWeighted ? 'Weighted' : 'Unweighted'}.`);
  }

  /**
   * Clears all nodes and edges from the graph.
   */
  clear() {
    this.sequenceToken++;
    this.nodes.clear();
    this.edges = [];
    this.history = [];
    this.currentHistoryIndex = -1;
    this._recordInitialStep('Graph cleared. All nodes and edges removed.');
  }

  /**
   * Updates coordinates of a node (e.g. during drag).
   * @param {string} nodeId
   * @param {number} x
   * @param {number} y
   */
  updateNodePosition(nodeId, x, y) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.x = Math.max(30, Math.min(730, Math.round(x)));
      node.y = Math.max(30, Math.min(430, Math.round(y)));
      // Update coordinates in current step snapshot if available
      const current = this.getCurrentStep();
      if (current && current.nodes) {
        const snapNode = current.nodes.find(n => n.id === nodeId);
        if (snapNode) {
          snapNode.x = node.x;
          snapNode.y = node.y;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers & Resolvers
  // ---------------------------------------------------------------------------

  _resolveNode(idOrLabel) {
    if (!idOrLabel) return null;
    if (this.nodes.has(idOrLabel)) return this.nodes.get(idOrLabel);
    const upper = String(idOrLabel).trim().toUpperCase();
    for (const node of this.nodes.values()) {
      if (node.label.toUpperCase() === upper) return node;
    }
    return null;
  }

  _findEdge(fromId, toId) {
    for (const e of this.edges) {
      if (this.isDirected) {
        if (e.from === fromId && e.to === toId) return e;
      } else {
        if ((e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)) {
          return e;
        }
      }
    }
    return null;
  }

  /**
   * Returns deterministic list of neighbors for a given node.
   * Neighbors are sorted alphabetically by their label.
   * @param {string} nodeId
   * @returns {Array<{ node: object, edge: object, weight: number }>}
   */
  getNeighbors(nodeId) {
    const neighbors = [];
    for (const edge of this.edges) {
      if (edge.from === nodeId) {
        const targetNode = this.nodes.get(edge.to);
        if (targetNode) {
          neighbors.push({ node: targetNode, edge, weight: edge.weight });
        }
      } else if (!this.isDirected && edge.to === nodeId) {
        const targetNode = this.nodes.get(edge.from);
        if (targetNode) {
          neighbors.push({ node: targetNode, edge, weight: edge.weight });
        }
      }
    }

    // Sort neighbors alphabetically by node label for determinism
    neighbors.sort((a, b) => a.node.label.localeCompare(b.node.label));
    return neighbors;
  }

  /**
   * Returns all nodes sorted alphabetically by label.
   * @returns {Array<object>}
   */
  getSortedNodes() {
    return Array.from(this.nodes.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  // ---------------------------------------------------------------------------
  // Representations: Adjacency Matrix & Adjacency List
  // ---------------------------------------------------------------------------

  /**
   * Generates Adjacency Matrix representation.
   * In unweighted mode: 1 if edge exists, 0 otherwise.
   * In weighted mode: edge weight if edge exists, 0 on diagonal (u === v), '—' or null if no edge.
   * @returns {{ nodes: string[], matrix: any[][], isWeighted: boolean, isDirected: boolean }}
   */
  getAdjacencyMatrix() {
    const sorted = this.getSortedNodes();
    const labels = sorted.map(n => n.label);
    const n = sorted.length;
    const matrix = [];

    for (let i = 0; i < n; i++) {
      const row = [];
      const u = sorted[i];
      for (let j = 0; j < n; j++) {
        const v = sorted[j];
        if (i === j) {
          // Check self-loop
          const selfEdge = this._findEdge(u.id, v.id);
          if (selfEdge) {
            row.push(this.isWeighted ? selfEdge.weight : 1);
          } else {
            row.push(0);
          }
        } else {
          const edge = this._findEdge(u.id, v.id);
          if (edge) {
            row.push(this.isWeighted ? edge.weight : 1);
          } else {
            row.push(this.isWeighted ? null : 0);
          }
        }
      }
      matrix.push(row);
    }

    return {
      nodes: labels,
      matrix,
      isWeighted: this.isWeighted,
      isDirected: this.isDirected
    };
  }

  /**
   * Generates Adjacency List representation.
   * Map: label -> Array<{ target: string, weight: number }>
   * @returns {Record<string, Array<{ target: string, weight: number }>>}
   */
  getAdjacencyList() {
    const sorted = this.getSortedNodes();
    const adjList = {};

    for (const u of sorted) {
      const neighbors = this.getNeighbors(u.id);
      adjList[u.label] = neighbors.map(nbr => ({
        target: nbr.node.label,
        weight: nbr.weight
      }));
    }

    return adjList;
  }

  // ---------------------------------------------------------------------------
  // Deterministic Algorithm Step Generators
  // ---------------------------------------------------------------------------

  /**
   * Helper to create an immutable snapshot of current graph state.
   * @private
   */
  _snapshot() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => ({ ...n })),
      edges: this.edges.map(e => ({ ...e })),
      isDirected: this.isDirected,
      isWeighted: this.isWeighted
    };
  }

  /**
   * Helper to record initial / resting graph state.
   * @private
   */
  _recordInitialStep(message) {
    const snap = this._snapshot();
    const sorted = this.getSortedNodes().map(n => n.label);
    this.history = [{
      operation: 'INITIAL',
      message,
      nodes: snap.nodes,
      edges: snap.edges,
      activeNodeId: null,
      activeEdgeId: null,
      visitedNodeIds: [],
      traversalOrder: [],
      queue: [],
      stack: [],
      distances: {},
      predecessors: {},
      settledNodeIds: [],
      isError: false,
      explanation: {
        what: message,
        why: 'Graph maintains nodes, edges, adjacency matrix, and adjacency list.',
        stateSummary: `V = ${snap.nodes.length}, E = ${snap.edges.length} | Mode: ${this.isDirected ? 'Directed' : 'Undirected'}, ${this.isWeighted ? 'Weighted' : 'Unweighted'}`
      }
    }];
    this.currentHistoryIndex = 0;
  }

  /**
   * 1. Breadth-First Search (BFS)
   * Explores graph level by level using a FIFO queue.
   * Guarantees shortest path in unweighted graphs.
   * @param {string} startIdOrLabel
   * @returns {Array<object>} generated history steps
   */
  bfs(startIdOrLabel) {
    this.sequenceToken++;
    const startNode = this._resolveNode(startIdOrLabel);
    if (!startNode) {
      throw new Error(`Start node "${startIdOrLabel}" does not exist.`);
    }

    const steps = [];
    const snap = this._snapshot();
    const visited = new Set();
    const queue = [];
    const traversalOrder = [];

    // Helper to record a BFS step
    const addBfsStep = (op, activeNodeId, activeEdgeId, message, what, why) => {
      steps.push({
        operation: op,
        message,
        nodes: snap.nodes,
        edges: snap.edges,
        activeNodeId,
        activeEdgeId,
        visitedNodeIds: Array.from(visited),
        traversalOrder: [...traversalOrder],
        queue: [...queue],
        stack: [],
        distances: {},
        predecessors: {},
        settledNodeIds: [],
        isError: false,
        explanation: {
          what,
          why,
          stateSummary: `Queue: [${queue.map(id => this.nodes.get(id)?.label).join(', ')}] | Visited: {${Array.from(visited).map(id => this.nodes.get(id)?.label).join(', ')}} | Order: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}`
        }
      });
    };

    // Step 1: Initialize BFS
    visited.add(startNode.id);
    queue.push(startNode.id);
    traversalOrder.push(startNode.id);

    addBfsStep(
      'BFS_START',
      startNode.id,
      null,
      `BFS initialized at source node ${startNode.label}. Enqueued ${startNode.label}.`,
      `Started Breadth-First Search at root node ${startNode.label}. Mark ${startNode.label} as visited and place into FIFO queue.`,
      'BFS uses a First-In, First-Out (FIFO) queue to explore nodes layer by layer in order of their graph distance from source.'
    );

    // BFS Loop
    while (queue.length > 0) {
      const currentId = queue.shift();
      const currentNode = this.nodes.get(currentId);

      addBfsStep(
        'BFS_DEQUEUE',
        currentId,
        null,
        `Dequeued node ${currentNode.label} from front of queue. Exploring its neighbors.`,
        `Dequeued ${currentNode.label}. Now examining all outgoing adjacent neighbors in deterministic alphabetical order.`,
        'Nodes at distance d are fully processed before any nodes at distance d+1 are dequeued.'
      );

      const neighbors = this.getNeighbors(currentId);
      for (const nbr of neighbors) {
        const nbrId = nbr.node.id;
        const edgeId = nbr.edge.id;

        if (!visited.has(nbrId)) {
          visited.add(nbrId);
          queue.push(nbrId);
          traversalOrder.push(nbrId);

          addBfsStep(
            'BFS_DISCOVER',
            nbrId,
            edgeId,
            `Discovered unvisited neighbor ${nbr.node.label} via edge (${currentNode.label} -> ${nbr.node.label}). Enqueued ${nbr.node.label}.`,
            `Found unvisited neighbor ${nbr.node.label}. Marked visited, appended to traversal order, and pushed to back of queue.`,
            'Marking nodes visited upon discovery prevents redundant enqueuing and infinite loops in cyclic graphs.'
          );
        } else {
          // Already visited neighbor
          addBfsStep(
            'BFS_ALREADY_VISITED',
            currentId,
            edgeId,
            `Neighbor ${nbr.node.label} is already visited. Skipping duplicate traversal.`,
            `Inspected edge to ${nbr.node.label}, which is already in the visited set. No action needed.`,
            'Visited check ensures each node is processed exactly once, keeping time complexity at O(V + E).'
          );
        }
      }
    }

    // Check for unreachable nodes (disconnected graph)
    const unreachable = [];
    for (const node of this.getSortedNodes()) {
      if (!visited.has(node.id)) {
        unreachable.push(node.label);
      }
    }

    const completeMsg = unreachable.length > 0
      ? `BFS completed. Traversal order: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}. Note: Disconnected nodes [${unreachable.join(', ')}] were unreachable from ${startNode.label}.`
      : `BFS completed! Traversed all ${traversalOrder.length} reachable nodes: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}.`;

    addBfsStep(
      'BFS_COMPLETE',
      null,
      null,
      completeMsg,
      `BFS finished. Final traversal stream: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}.`,
      'In unweighted graphs, BFS traversal order represents the minimal hop distance from the start node.'
    );

    this.history = steps;
    this.currentHistoryIndex = 0;
    return steps;
  }

  /**
   * 2. Depth-First Search (DFS)
   * Explores as deep as possible along each branch before backtracking.
   * Explicitly documents that DFS does NOT produce shortest paths.
   * @param {string} startIdOrLabel
   * @returns {Array<object>} generated history steps
   */
  dfs(startIdOrLabel) {
    this.sequenceToken++;
    const startNode = this._resolveNode(startIdOrLabel);
    if (!startNode) {
      throw new Error(`Start node "${startIdOrLabel}" does not exist.`);
    }

    const steps = [];
    const snap = this._snapshot();
    const visited = new Set();
    const stack = []; // LIFO call stack
    const traversalOrder = [];

    const addDfsStep = (op, activeNodeId, activeEdgeId, message, what, why) => {
      steps.push({
        operation: op,
        message,
        nodes: snap.nodes,
        edges: snap.edges,
        activeNodeId,
        activeEdgeId,
        visitedNodeIds: Array.from(visited),
        traversalOrder: [...traversalOrder],
        queue: [],
        stack: [...stack],
        distances: {},
        predecessors: {},
        settledNodeIds: [],
        isError: false,
        explanation: {
          what,
          why: `${why} (Note: DFS does NOT guarantee shortest path).`,
          stateSummary: `Call Stack: [${stack.map(id => this.nodes.get(id)?.label).join(' -> ')}] | Visited: {${Array.from(visited).map(id => this.nodes.get(id)?.label).join(', ')}} | Order: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}`
        }
      });
    };

    // Recursive DFS simulation with explicit backtracking steps
    const dfsVisit = (currentId, parentEdgeId = null) => {
      const currentNode = this.nodes.get(currentId);
      visited.add(currentId);
      stack.push(currentId);
      traversalOrder.push(currentId);

      addDfsStep(
        'DFS_VISIT',
        currentId,
        parentEdgeId,
        `DFS visited node ${currentNode.label}. Pushed to call stack.`,
        `Visited node ${currentNode.label}. Added to traversal order and pushed onto stack.`,
        'DFS explores aggressively along depth before exploring sibling branches.'
      );

      const neighbors = this.getNeighbors(currentId);
      for (const nbr of neighbors) {
        const nbrId = nbr.node.id;
        const edgeId = nbr.edge.id;

        if (!visited.has(nbrId)) {
          addDfsStep(
            'DFS_EXPLORE_EDGE',
            currentId,
            edgeId,
            `Advancing from ${currentNode.label} to unvisited neighbor ${nbr.node.label}.`,
            `Tree edge discovered (${currentNode.label} -> ${nbr.node.label}). Recursing deeper into ${nbr.node.label}.`,
            'DFS prioritizes depth: each unvisited neighbor triggers an immediate recursive call.'
          );

          dfsVisit(nbrId, edgeId);

          // Returned from recursion -> back at current node
          addDfsStep(
            'DFS_RESUME',
            currentId,
            null,
            `Returned to node ${currentNode.label} after exploring subtree of ${nbr.node.label}.`,
            `Control returned to ${currentNode.label}. Checking remaining adjacent edges.`,
            'Once a child subtree is fully explored, DFS resumes where it left off in the caller.'
          );
        } else {
          // Already visited neighbor (back/cross edge)
          addDfsStep(
            'DFS_ALREADY_VISITED',
            currentId,
            edgeId,
            `Edge (${currentNode.label} -> ${nbr.node.label}) leads to already visited node. Skipping branch.`,
            `Inspected neighbor ${nbr.node.label}; already visited. Skipping to prevent cycles.`,
            'Cycle detection in DFS relies on tracking visited nodes along the current trajectory.'
          );
        }
      }

      // Backtracking
      stack.pop();
      addDfsStep(
        'DFS_BACKTRACK',
        currentId,
        null,
        `All neighbors of ${currentNode.label} explored. Backtracking (popped from stack).`,
        `Exhausted all branches for ${currentNode.label}. Popped ${currentNode.label} from call stack and backtracked.`,
        'Backtracking occurs when a node has no remaining unvisited neighbors, unwinding the recursion stack.'
      );
    };

    // Start DFS
    dfsVisit(startNode.id);

    // Unreachable nodes
    const unreachable = [];
    for (const node of this.getSortedNodes()) {
      if (!visited.has(node.id)) {
        unreachable.push(node.label);
      }
    }

    const completeMsg = unreachable.length > 0
      ? `DFS completed. Traversal order: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}. Note: Disconnected nodes [${unreachable.join(', ')}] were unreachable from ${startNode.label}.`
      : `DFS completed! Traversed all ${traversalOrder.length} reachable nodes: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}.`;

    addDfsStep(
      'DFS_COMPLETE',
      null,
      null,
      completeMsg,
      `DFS finished. Final traversal stream: ${traversalOrder.map(id => this.nodes.get(id)?.label).join(' -> ')}.`,
      'DFS has O(V + E) complexity. Remember: DFS does NOT produce shortest paths; use BFS or Dijkstra for shortest paths.'
    );

    this.history = steps;
    this.currentHistoryIndex = 0;
    return steps;
  }

  /**
   * 3. Dijkstra's Shortest Path Algorithm
   * Computes shortest path from source to all reachable nodes (or specified target).
   * REJECTS negative edge weights with a strict invariant check.
   * @param {string} startIdOrLabel
   * @param {string} [targetIdOrLabel=null]
   * @returns {Array<object>} generated history steps
   */
  dijkstra(startIdOrLabel, targetIdOrLabel = null) {
    this.sequenceToken++;

    // INVARIANT CHECK: Nonnegative weights
    for (const edge of this.edges) {
      if (edge.weight < 0) {
        const u = this.nodes.get(edge.from)?.label || edge.from;
        const v = this.nodes.get(edge.to)?.label || edge.to;
        const err = `Dijkstra's algorithm rejected: Negative edge weight (${edge.weight}) detected on edge ${u} -> ${v}. Dijkstra requires all edge weights to be non-negative (w >= 0) because its greedy settlement assumption is violated by negative edges.`;
        
        // Record error step for UI
        this.history = [{
          operation: 'DIJKSTRA_ERROR',
          message: err,
          nodes: this._snapshot().nodes,
          edges: this._snapshot().edges,
          activeNodeId: null,
          activeEdgeId: edge.id,
          visitedNodeIds: [],
          traversalOrder: [],
          queue: [],
          stack: [],
          distances: {},
          predecessors: {},
          settledNodeIds: [],
          isError: true,
          explanation: {
            what: `Rejected algorithm run: Negative edge weight detected.`,
            why: `Dijkstra greedily locks in the shortest distance to a node once extracted from the priority queue. If negative edge weights exist, a longer path could become shorter later, breaking the greedy invariant. Use the Bellman-Ford algorithm instead for graphs with negative weights.`,
            stateSummary: `Error: Edge (${u} -> ${v}, w = ${edge.weight}) < 0`
          }
        }];
        this.currentHistoryIndex = 0;
        throw new Error(err);
      }
    }

    const startNode = this._resolveNode(startIdOrLabel);
    if (!startNode) {
      throw new Error(`Source node "${startIdOrLabel}" does not exist.`);
    }

    const targetNode = targetIdOrLabel ? this._resolveNode(targetIdOrLabel) : null;
    const steps = [];
    const snap = this._snapshot();

    // Data structures
    // Distances: Map<nodeId, number>
    const distances = new Map();
    // Predecessors: Map<nodeId, nodeId|null>
    const predecessors = new Map();
    // Settled nodes (shortest distance finalized)
    const settled = new Set();
    // Unsettled candidate set
    const unsettled = new Set();

    for (const node of this.nodes.values()) {
      distances.set(node.id, Infinity);
      predecessors.set(node.id, null);
      unsettled.add(node.id);
    }
    distances.set(startNode.id, 0);

    const formatDistances = () => {
      const obj = {};
      for (const [id, d] of distances.entries()) {
        const label = this.nodes.get(id)?.label || id;
        obj[label] = d === Infinity ? '∞' : d;
      }
      return obj;
    };

    const formatPredecessors = () => {
      const obj = {};
      for (const [id, predId] of predecessors.entries()) {
        const label = this.nodes.get(id)?.label || id;
        obj[label] = predId ? (this.nodes.get(predId)?.label || predId) : 'null';
      }
      return obj;
    };

    const addDijkstraStep = (op, activeNodeId, activeEdgeId, message, what, why) => {
      steps.push({
        operation: op,
        message,
        nodes: snap.nodes,
        edges: snap.edges,
        activeNodeId,
        activeEdgeId,
        visitedNodeIds: Array.from(settled),
        traversalOrder: Array.from(settled),
        queue: Array.from(unsettled),
        stack: [],
        distances: formatDistances(),
        predecessors: formatPredecessors(),
        settledNodeIds: Array.from(settled),
        isError: false,
        explanation: {
          what,
          why,
          stateSummary: `Settled: {${Array.from(settled).map(id => this.nodes.get(id)?.label).join(', ')}} | Current Distances: ${JSON.stringify(formatDistances())}`
        }
      });
    };

    // Step 1: Initial state
    addDijkstraStep(
      'DIJKSTRA_INIT',
      startNode.id,
      null,
      `Dijkstra initialized with source ${startNode.label}. dist[${startNode.label}] = 0, all other dist = ∞.`,
      `Initialized distance table: distance to source ${startNode.label} is 0. All other nodes set to tentative distance ∞.`,
      'Dijkstra operates by iteratively selecting the unsettled node with minimal tentative distance and relaxing its outgoing edges.'
    );

    // Main Dijkstra Loop
    while (unsettled.size > 0) {
      // Find unsettled node with minimal distance
      let minNodeId = null;
      let minDistance = Infinity;

      // Deterministic tie-breaking: minimal distance, then alphabetical label
      for (const nodeId of unsettled) {
        const d = distances.get(nodeId);
        if (d < minDistance) {
          minDistance = d;
          minNodeId = nodeId;
        } else if (d === minDistance && d < Infinity && minNodeId !== null) {
          const currLabel = this.nodes.get(nodeId)?.label || '';
          const minLabel = this.nodes.get(minNodeId)?.label || '';
          if (currLabel.localeCompare(minLabel) < 0) {
            minNodeId = nodeId;
          }
        }
      }

      // If smallest distance is infinity, remaining unsettled nodes are unreachable
      if (minNodeId === null || minDistance === Infinity) {
        addDijkstraStep(
          'DIJKSTRA_UNREACHABLE',
          null,
          null,
          `Remaining unsettled nodes [${Array.from(unsettled).map(id => this.nodes.get(id)?.label).join(', ')}] are unreachable from ${startNode.label}.`,
          `No further reachable nodes remain in unsettled set. Remaining nodes stay at distance ∞.`,
          'Disconnected graph components have infinite shortest-path distance.'
        );
        break;
      }

      // Settle minNodeId
      unsettled.delete(minNodeId);
      settled.add(minNodeId);
      const minNode = this.nodes.get(minNodeId);

      addDijkstraStep(
        'DIJKSTRA_SETTLE',
        minNodeId,
        null,
        `Settled node ${minNode.label} with optimal shortest distance ${minDistance}.`,
        `Extracted node ${minNode.label} with minimal tentative distance (${minDistance}). Distance is now finalized!`,
        'Because all edge weights are non-negative, no future path can reach this node with a smaller cost.'
      );

      // If target node reached and settled, we can reconstruct and finish early
      if (targetNode && minNodeId === targetNode.id) {
        break;
      }

      // Relax outgoing edges
      const neighbors = this.getNeighbors(minNodeId);
      for (const nbr of neighbors) {
        const nbrId = nbr.node.id;
        const edgeId = nbr.edge.id;
        const weight = nbr.weight;

        if (settled.has(nbrId)) {
          addDijkstraStep(
            'DIJKSTRA_ALREADY_SETTLED',
            minNodeId,
            edgeId,
            `Neighbor ${nbr.node.label} is already settled. Skipping relaxation.`,
            `Neighbor ${nbr.node.label} already has its optimal shortest path locked.`,
            'Settled nodes are never relaxed again, ensuring algorithm termination in O((V + E) log V).'
          );
          continue;
        }

        const currentDist = distances.get(nbrId);
        const altDist = minDistance + weight;

        if (altDist < currentDist) {
          distances.set(nbrId, altDist);
          predecessors.set(nbrId, minNodeId);

          addDijkstraStep(
            'DIJKSTRA_RELAX',
            nbrId,
            edgeId,
            `Relaxed edge (${minNode.label} -> ${nbr.node.label}, w=${weight}): updated dist[${nbr.node.label}] from ${currentDist === Infinity ? '∞' : currentDist} to ${altDist}. Predecessor = ${minNode.label}.`,
            `Found shorter path to ${nbr.node.label} through ${minNode.label}: ${minDistance} + ${weight} = ${altDist} < ${currentDist === Infinity ? '∞' : currentDist}. Updated distance & predecessor.`,
            'Edge relaxation is the core of shortest-path algorithms: improving upper bounds until optimal.'
          );
        } else {
          addDijkstraStep(
            'DIJKSTRA_NO_RELAX',
            minNodeId,
            edgeId,
            `Checked edge (${minNode.label} -> ${nbr.node.label}, w=${weight}): candidate cost ${minDistance} + ${weight} = ${altDist} is not shorter than existing dist[${nbr.node.label}] = ${currentDist}. No update.`,
            `Path through ${minNode.label} offers cost ${altDist}, which does not beat existing best estimate ${currentDist}.`,
            'When a tentative distance is already smaller, the edge relaxation is discarded.'
          );
        }
      }
    }

    // Path reconstruction if target requested
    let reconstructedPath = null;
    let finalSummary = '';

    if (targetNode) {
      if (distances.get(targetNode.id) === Infinity) {
        finalSummary = `Target ${targetNode.label} is UNREACHABLE from source ${startNode.label}. Shortest distance: ∞.`;
      } else {
        const path = [];
        let curr = targetNode.id;
        while (curr !== null) {
          path.unshift(this.nodes.get(curr)?.label || curr);
          curr = predecessors.get(curr);
        }
        reconstructedPath = path;
        finalSummary = `Shortest path from ${startNode.label} to ${targetNode.label}: [${path.join(' -> ')}] with total cost ${distances.get(targetNode.id)}.`;
      }
    } else {
      const settledSummaries = Array.from(this.getSortedNodes()).map(node => {
        const d = distances.get(node.id);
        return `${node.label}: ${d === Infinity ? '∞' : d}`;
      });
      finalSummary = `Dijkstra completed for source ${startNode.label}. Final distances: { ${settledSummaries.join(', ')} }.`;
    }

    addDijkstraStep(
      'DIJKSTRA_COMPLETE',
      targetNode ? (distances.get(targetNode.id) < Infinity ? targetNode.id : null) : null,
      null,
      finalSummary,
      `Dijkstra's algorithm execution finalized.`,
      `Shortest paths from source ${startNode.label} are guaranteed optimal for all reachable nodes.`,
    );

    this.history = steps;
    this.currentHistoryIndex = 0;
    return steps;
  }

  // ---------------------------------------------------------------------------
  // Playback Navigation & State Inspection
  // ---------------------------------------------------------------------------

  getCurrentStep() {
    if (this.currentHistoryIndex >= 0 && this.currentHistoryIndex < this.history.length) {
      return this.history[this.currentHistoryIndex];
    }
    return null;
  }

  goToStep(index) {
    if (index >= 0 && index < this.history.length) {
      this.currentHistoryIndex = index;
      return this.history[this.currentHistoryIndex];
    }
    return null;
  }

  nextStep() {
    if (this.currentHistoryIndex < this.history.length - 1) {
      this.currentHistoryIndex++;
      return this.history[this.currentHistoryIndex];
    }
    return null;
  }

  prevStep() {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      return this.history[this.currentHistoryIndex];
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Sample Graph Presets
  // ---------------------------------------------------------------------------

  loadPreset(presetName) {
    this.clear();
    const name = String(presetName || '').toLowerCase().trim();

    if (name === 'standard' || name === 'bfs-dfs') {
      // 6-node general graph: A, B, C, D, E, F
      this.isDirected = false;
      this.isWeighted = false;

      this.addNode('A', 220, 140);
      this.addNode('B', 400, 100);
      this.addNode('C', 560, 170);
      this.addNode('D', 240, 320);
      this.addNode('E', 420, 340);
      this.addNode('F', 580, 320);

      this.addEdge('A', 'B', 1);
      this.addEdge('A', 'D', 1);
      this.addEdge('B', 'C', 1);
      this.addEdge('B', 'E', 1);
      this.addEdge('C', 'F', 1);
      this.addEdge('D', 'E', 1);
      this.addEdge('E', 'F', 1);

      this._recordInitialStep('Loaded "Standard Graph" preset (6 nodes, 7 edges, undirected).');
    } else if (name === 'weighted' || name === 'dijkstra') {
      // Weighted highway network designed to highlight Dijkstra where direct edge is costlier
      this.isDirected = true;
      this.isWeighted = true;

      this.addNode('A', 160, 220);
      this.addNode('B', 320, 120);
      this.addNode('C', 320, 320);
      this.addNode('D', 480, 120);
      this.addNode('E', 480, 320);
      this.addNode('F', 620, 220);

      this.addEdge('A', 'B', 4);
      this.addEdge('A', 'C', 2);
      this.addEdge('C', 'B', 1); // A -> C -> B costs 2 + 1 = 3 (< 4)
      this.addEdge('B', 'D', 5);
      this.addEdge('C', 'E', 8);
      this.addEdge('D', 'E', 2);
      this.addEdge('D', 'F', 6);
      this.addEdge('E', 'F', 3);

      this._recordInitialStep('Loaded "Weighted Highway" preset (6 nodes, 8 weighted edges, directed).');
    } else if (name === 'disconnected') {
      // Two isolated components
      this.isDirected = false;
      this.isWeighted = false;

      // Component 1
      this.addNode('A', 200, 160);
      this.addNode('B', 320, 130);
      this.addNode('C', 250, 290);
      this.addEdge('A', 'B', 1);
      this.addEdge('B', 'C', 1);
      this.addEdge('C', 'A', 1);

      // Component 2 (Isolated)
      this.addNode('D', 520, 150);
      this.addNode('E', 630, 230);
      this.addNode('F', 510, 310);
      this.addEdge('D', 'E', 1);
      this.addEdge('E', 'F', 1);

      this._recordInitialStep('Loaded "Disconnected Components" preset (2 separate subgraphs).');
    } else if (name === 'cycle-loop') {
      // Graph with a cycle and a self-loop
      this.isDirected = true;
      this.isWeighted = false;

      this.addNode('A', 240, 160);
      this.addNode('B', 460, 160);
      this.addNode('C', 460, 320);
      this.addNode('D', 240, 320);

      this.addEdge('A', 'B', 1);
      this.addEdge('B', 'C', 1);
      this.addEdge('C', 'A', 1); // Cycle: A -> B -> C -> A
      this.addEdge('C', 'D', 1);
      this.addEdge('D', 'D', 1); // Self-loop on D

      this._recordInitialStep('Loaded "Cycle & Self-Loop" preset (directed cycle with self-loop on D).');
    } else {
      // Empty
      this.isDirected = false;
      this.isWeighted = false;
      this._recordInitialStep('Cleared canvas. Custom empty graph.');
    }
  }
}

// -----------------------------------------------------------------------------
// DOM Controller & SVG Canvas Rendering (Browser Environment)
// -----------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('graph-canvas-container');
    if (!graphContainer) return; // Not on graph.html

    let graph = new GraphEngine({ isDirected: false, isWeighted: false });

    // DOM Elements - Navigation & Modes
    const directedToggle = document.getElementById('toggle-directed');
    const weightedToggle = document.getElementById('toggle-weighted');
    const presetSelect = document.getElementById('preset-select');

    // Restore saved state or load default preset
    const saved = loadGraphState(localStorage);
    if (saved && Array.isArray(saved.nodes) && saved.nodes.length > 0) {
      graph.clear();
      graph.isDirected = Boolean(saved.isDirected);
      graph.isWeighted = Boolean(saved.isWeighted);
      for (const n of saved.nodes) {
        graph.nodes.set(n.id, { id: n.id, label: n.label, x: n.x, y: n.y });
        const num = parseInt(String(n.id).replace('node_', ''), 10);
        if (!isNaN(num) && num > graph._nodeIdCounter) {
          graph._nodeIdCounter = num;
        }
      }
      if (Array.isArray(saved.edges)) {
        for (const e of saved.edges) {
          graph.edges.push({ id: e.id, from: e.from, to: e.to, weight: Number(e.weight || 1) });
        }
      }
      graph._recordInitialStep('Restored graph from saved state.');
    } else {
      graph.loadPreset('standard');
    }

    if (directedToggle) directedToggle.checked = graph.isDirected;
    if (weightedToggle) weightedToggle.checked = graph.isWeighted;
    if (presetSelect && saved && saved.preset) presetSelect.value = saved.preset;

    function persistGraph() {
      saveGraphState(localStorage, {
        nodes: Array.from(graph.nodes.values()),
        edges: graph.edges,
        isDirected: graph.isDirected,
        isWeighted: graph.isWeighted,
        preset: presetSelect ? presetSelect.value : 'custom'
      });
    }

    // DOM Elements - Mutation Controls
    const addNodeInput = document.getElementById('node-label-input');
    const addNodeBtn = document.getElementById('add-node-btn');
    const removeNodeSelect = document.getElementById('remove-node-select');
    const removeNodeBtn = document.getElementById('remove-node-btn');

    const edgeFromSelect = document.getElementById('edge-from-select');
    const edgeToSelect = document.getElementById('edge-to-select');
    const edgeWeightInput = document.getElementById('edge-weight-input');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const removeEdgeBtn = document.getElementById('remove-edge-btn');
    const clearGraphBtn = document.getElementById('clear-graph-btn');

    // DOM Elements - Algorithm Triggers
    const algoStartNodeSelect = document.getElementById('algo-start-node');
    const algoTargetNodeSelect = document.getElementById('algo-target-node');
    const bfsBtn = document.getElementById('run-bfs-btn');
    const dfsBtn = document.getElementById('run-dfs-btn');
    const dijkstraBtn = document.getElementById('run-dijkstra-btn');

    // Playback Controls
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetTimelineBtn = document.getElementById('reset-timeline-btn');
    const speedRange = document.getElementById('speed-range');
    const stepMessage = document.getElementById('step-message');

    // Representations & State Inspector
    const adjMatrixTableContainer = document.getElementById('adj-matrix-container');
    const adjListContainer = document.getElementById('adj-list-container');
    const distanceTableContainer = document.getElementById('distance-table-container');
    const traversalStream = document.getElementById('traversal-stream');

    const inspectorStep = document.getElementById('inspector-step');
    const inspectorNodes = document.getElementById('inspector-nodes');
    const inspectorEdges = document.getElementById('inspector-edges');
    const inspectorMode = document.getElementById('inspector-mode');
    const inspectorActiveNode = document.getElementById('inspector-active-node');
    const inspectorVisited = document.getElementById('inspector-visited');
    const inspectorStatus = document.getElementById('inspector-status');

    // Explanation Box
    const explanationOp = document.getElementById('explanation-op');
    const explanationWhat = document.getElementById('explanation-what');
    const explanationWhy = document.getElementById('explanation-why');
    const explanationSummary = document.getElementById('explanation-summary');

    // Playback state
    let playbackInterval = null;
    let isPlaying = false;
    let playbackSpeed = Number(speedRange?.value || 800);

    // Node dragging state
    let draggingNodeId = null;
    let dragOffset = { x: 0, y: 0 };

    function stopPlayback() {
      if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
      }
      isPlaying = false;
      if (playBtn) playBtn.disabled = false;
      if (pauseBtn) pauseBtn.disabled = true;
    }

    function play() {
      if (isPlaying) return;
      stopPlayback();
      isPlaying = true;
      if (playBtn) playBtn.disabled = true;
      if (pauseBtn) pauseBtn.disabled = false;

      const currentToken = ++graph.sequenceToken;

      playbackInterval = setInterval(() => {
        if (graph.sequenceToken !== currentToken) {
          stopPlayback();
          return;
        }

        if (graph.currentHistoryIndex >= graph.history.length - 1) {
          stopPlayback();
          return;
        }

        const next = graph.nextStep();
        if (next) {
          renderCurrentStep(next);
        } else {
          stopPlayback();
        }
      }, playbackSpeed);
    }

    if (speedRange) {
      speedRange.addEventListener('input', (e) => {
        playbackSpeed = 1600 - Number(e.target.value); // Invert so right = fast
        if (isPlaying) {
          stopPlayback();
          play();
        }
      });
    }

    // Populate dropdown selectors with current node labels
    function updateDropdowns() {
      const sorted = graph.getSortedNodes();
      const currentFrom = edgeFromSelect ? edgeFromSelect.value : '';
      const currentTo = edgeToSelect ? edgeToSelect.value : '';
      const currentRemove = removeNodeSelect ? removeNodeSelect.value : '';
      const currentStart = algoStartNodeSelect ? algoStartNodeSelect.value : '';
      const currentTarget = algoTargetNodeSelect ? algoTargetNodeSelect.value : '';

      const makeOptions = (nodes, allowNone = false) => {
        let html = allowNone ? '<option value="">None (All targets)</option>' : '';
        for (const n of nodes) {
          html += `<option value="${n.label}">${n.label}</option>`;
        }
        return html;
      };

      const optionsHtml = makeOptions(sorted);

      if (edgeFromSelect) {
        edgeFromSelect.innerHTML = optionsHtml;
        if (sorted.some(n => n.label === currentFrom)) edgeFromSelect.value = currentFrom;
      }
      if (edgeToSelect) {
        edgeToSelect.innerHTML = optionsHtml;
        if (sorted.some(n => n.label === currentTo)) edgeToSelect.value = currentTo;
        else if (sorted.length > 1) edgeToSelect.selectedIndex = 1;
      }
      if (removeNodeSelect) {
        removeNodeSelect.innerHTML = optionsHtml;
        if (sorted.some(n => n.label === currentRemove)) removeNodeSelect.value = currentRemove;
      }
      if (algoStartNodeSelect) {
        algoStartNodeSelect.innerHTML = optionsHtml;
        if (sorted.some(n => n.label === currentStart)) algoStartNodeSelect.value = currentStart;
      }
      if (algoTargetNodeSelect) {
        algoTargetNodeSelect.innerHTML = makeOptions(sorted, true);
        if (sorted.some(n => n.label === currentTarget)) algoTargetNodeSelect.value = currentTarget;
      }
    }

    // Render Representations: Adjacency Matrix & Adjacency List
    function renderRepresentations() {
      // 1. Matrix
      if (adjMatrixTableContainer) {
        const { nodes, matrix, isWeighted, isDirected } = graph.getAdjacencyMatrix();
        if (nodes.length === 0) {
          adjMatrixTableContainer.innerHTML = '<p style="color: #94a3b8; font-style: italic; font-size: 0.85rem; padding: 10px;">Graph is empty. Add nodes to populate matrix.</p>';
        } else {
          let html = '<table class="adj-matrix-table"><thead><tr><th></th>';
          for (const label of nodes) {
            html += `<th>${label}</th>`;
          }
          html += '</tr></thead><tbody>';

          for (let i = 0; i < nodes.length; i++) {
            html += `<tr><th>${nodes[i]}</th>`;
            for (let j = 0; j < nodes.length; j++) {
              const val = matrix[i][j];
              const displayVal = val === null ? '—' : val;
              const isHighlight = val !== 0 && val !== null;
              html += `<td class="${isHighlight ? 'matrix-edge-present' : ''}">${displayVal}</td>`;
            }
            html += '</tr>';
          }
          html += '</tbody></table>';
          adjMatrixTableContainer.innerHTML = html;
        }
      }

      // 2. List
      if (adjListContainer) {
        const list = graph.getAdjacencyList();
        const entries = Object.entries(list);
        if (entries.length === 0) {
          adjListContainer.innerHTML = '<p style="color: #94a3b8; font-style: italic; font-size: 0.85rem; padding: 10px;">Graph is empty. Add nodes to populate adjacency list.</p>';
        } else {
          let html = '<div class="adj-list-wrapper">';
          for (const [u, neighbors] of entries) {
            html += `<div class="adj-list-row"><span class="adj-list-src">${u}</span> <span class="adj-list-arrow">&rarr;</span> `;
            if (neighbors.length === 0) {
              html += '<span class="adj-list-empty">None</span>';
            } else {
              html += neighbors.map(nbr => {
                const wText = graph.isWeighted ? `<span class="adj-weight">:${nbr.weight}</span>` : '';
                return `<span class="adj-target-chip">${nbr.target}${wText}</span>`;
              }).join(' ');
            }
            html += '</div>';
          }
          html += '</div>';
          adjListContainer.innerHTML = html;
        }
      }
    }

    // Render SVG Graph Canvas
    function renderSvgCanvas(step) {
      if (!graphContainer) return;
      const nodes = step?.nodes || Array.from(graph.nodes.values());
      const edges = step?.edges || graph.edges;
      const activeNodeId = step?.activeNodeId;
      const activeEdgeId = step?.activeEdgeId;
      const visitedIds = new Set(step?.visitedNodeIds || []);
      const settledIds = new Set(step?.settledNodeIds || []);

      const nodeRadius = 22;
      const width = 760;
      const height = 460;

      let svgHtml = `
        <svg id="graph-svg" class="graph-svg" viewBox="0 0 ${width} ${height}" width="100%" height="460">
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"></path>
            </marker>
            <marker id="arrowhead-active" viewBox="0 0 10 10" refX="21" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706"></path>
            </marker>
          </defs>
      `;

      // Render Edges
      for (const edge of edges) {
        const u = nodes.find(n => n.id === edge.from);
        const v = nodes.find(n => n.id === edge.to);
        if (!u || !v) continue;

        const isActive = edge.id === activeEdgeId;
        const marker = graph.isDirected ? (isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)') : '';

        if (edge.from === edge.to) {
          // Self-loop: Bezier loop above node
          const loopPath = `M ${u.x - 12} ${u.y - 18} C ${u.x - 38} ${u.y - 65}, ${u.x + 38} ${u.y - 65}, ${u.x + 12} ${u.y - 18}`;
          svgHtml += `
            <g class="graph-edge-group ${isActive ? 'edge-active' : ''}">
              <path d="${loopPath}" class="graph-edge-line self-loop-edge" marker-end="${marker}" />
              ${graph.isWeighted ? `<text x="${u.x}" y="${u.y - 52}" class="graph-edge-weight">${edge.weight}</text>` : ''}
            </g>
          `;
        } else {
          // Straight edge between u and v
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Shorten line to node boundary so arrowheads align perfectly
          const startX = u.x + (dx * nodeRadius) / dist;
          const startY = u.y + (dy * nodeRadius) / dist;
          const endX = v.x - (dx * (graph.isDirected ? 6 : 0)) / dist;
          const endY = v.y - (dy * (graph.isDirected ? 6 : 0)) / dist;

          const midX = (u.x + v.x) / 2;
          const midY = (u.y + v.y) / 2;

          svgHtml += `
            <g class="graph-edge-group ${isActive ? 'edge-active' : ''}">
              <line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" class="graph-edge-line" marker-end="${marker}" />
              ${graph.isWeighted ? `
                <g class="weight-badge-group">
                  <rect x="${midX - 12}" y="${midY - 10}" width="24" height="18" rx="4" class="graph-weight-bg" />
                  <text x="${midX}" y="${midY + 3}" class="graph-edge-weight">${edge.weight}</text>
                </g>
              ` : ''}
            </g>
          `;
        }
      }

      // Render Nodes
      for (const node of nodes) {
        let nodeStateClass = '';
        if (node.id === activeNodeId) {
          nodeStateClass = 'node-active';
        } else if (settledIds.has(node.id)) {
          nodeStateClass = 'node-settled';
        } else if (visitedIds.has(node.id)) {
          nodeStateClass = 'node-visited';
        }

        svgHtml += `
          <g class="graph-node-group ${nodeStateClass}" data-id="${node.id}" transform="translate(${node.x}, ${node.y})" style="cursor: grab;">
            <circle r="${nodeRadius}" class="graph-node-circle" />
            <text class="graph-node-text">${node.label}</text>
          </g>
        `;
      }

      svgHtml += '</svg>';
      graphContainer.innerHTML = svgHtml;

      // Attach Drag & Drop Listeners
      const svg = document.getElementById('graph-svg');
      if (svg) {
        svg.querySelectorAll('.graph-node-group').forEach(group => {
          group.addEventListener('mousedown', (e) => {
            draggingNodeId = group.getAttribute('data-id');
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
            const currNode = graph.nodes.get(draggingNodeId);
            if (currNode) {
              dragOffset.x = svgP.x - currNode.x;
              dragOffset.y = svgP.y - currNode.y;
            }
            e.stopPropagation();
          });
        });

        svg.addEventListener('mousemove', (e) => {
          if (!draggingNodeId) return;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
          graph.updateNodePosition(draggingNodeId, svgP.x - dragOffset.x, svgP.y - dragOffset.y);
          renderSvgCanvas(graph.getCurrentStep());
        });

        const stopDrag = () => {
          if (draggingNodeId) {
            persistGraph();
          }
          draggingNodeId = null;
        };
        svg.addEventListener('mouseup', stopDrag);
        svg.addEventListener('mouseleave', stopDrag);
      }
    }

    // Render Traversal Stream Chips
    function renderTraversalStream(order) {
      if (!traversalStream) return;
      if (!order || order.length === 0) {
        traversalStream.innerHTML = '<span style="color: #94a3b8; font-style: italic;">No traversal running. Click BFS, DFS, or Dijkstra to start.</span>';
        return;
      }

      const chips = order.map((nodeId, idx) => {
        const node = graph.nodes.get(nodeId);
        const label = node ? node.label : nodeId;
        return `<span class="traversal-chip ${idx === order.length - 1 ? 'chip-active' : ''}">${label}</span>`;
      });
      traversalStream.innerHTML = chips.join('<span style="color: #cbd5e1; font-size: 0.8rem; margin: 0 4px;">&rarr;</span>');
    }

    // Render Live Distance Table for Dijkstra
    function renderDistanceTable(distances, predecessors, settledIds) {
      if (!distanceTableContainer) return;
      const sorted = graph.getSortedNodes();
      if (!distances || Object.keys(distances).length === 0 || sorted.length === 0) {
        distanceTableContainer.innerHTML = '<p style="color: #94a3b8; font-style: italic; font-size: 0.85rem; padding: 10px;">Distance table activates when Dijkstra runs.</p>';
        return;
      }

      const settledSet = new Set(settledIds || []);
      let html = `
        <table class="distance-table">
          <thead>
            <tr>
              <th>Node</th>
              <th>Distance</th>
              <th>Predecessor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      for (const node of sorted) {
        const d = distances[node.label] !== undefined ? distances[node.label] : '∞';
        const pred = predecessors ? (predecessors[node.label] || '—') : '—';
        const isSettled = settledSet.has(node.id);
        const badge = isSettled
          ? '<span class="status-badge badge-settled">Settled</span>'
          : '<span class="status-badge badge-unsettled">Tentative</span>';

        html += `
          <tr class="${isSettled ? 'row-settled' : ''}">
            <td><strong>${node.label}</strong></td>
            <td><code>${d}</code></td>
            <td><code>${pred}</code></td>
            <td>${badge}</td>
          </tr>
        `;
      }

      html += '</tbody></table>';
      distanceTableContainer.innerHTML = html;
    }

    // Main Render Function for current step
    function renderCurrentStep(step) {
      if (!step) return;

      // 1. SVG Canvas
      renderSvgCanvas(step);

      // 2. Explanations & Step Message
      if (stepMessage) stepMessage.textContent = step.message;
      if (explanationOp) explanationOp.textContent = step.operation;
      if (explanationWhat) explanationWhat.textContent = step.explanation?.what || step.message;
      if (explanationWhy) explanationWhy.textContent = step.explanation?.why || '';
      if (explanationSummary) explanationSummary.textContent = step.explanation?.stateSummary || '';

      // 3. Traversal Stream & Distance Table
      renderTraversalStream(step.traversalOrder);
      renderDistanceTable(step.distances, step.predecessors, step.settledNodeIds);

      // 4. State Inspector
      if (inspectorStep) {
        inspectorStep.textContent = `${graph.currentHistoryIndex + 1} / ${Math.max(1, graph.history.length)}`;
      }
      if (inspectorNodes) inspectorNodes.textContent = graph.nodes.size;
      if (inspectorEdges) inspectorEdges.textContent = graph.edges.length;
      if (inspectorMode) {
        inspectorMode.textContent = `${graph.isDirected ? 'Directed' : 'Undirected'}, ${graph.isWeighted ? 'Weighted' : 'Unweighted'}`;
      }
      if (inspectorActiveNode) {
        const act = step.activeNodeId ? graph.nodes.get(step.activeNodeId) : null;
        inspectorActiveNode.textContent = act ? act.label : 'None';
      }
      if (inspectorVisited) {
        inspectorVisited.textContent = `${step.visitedNodeIds?.length || 0} / ${graph.nodes.size}`;
      }
      if (inspectorStatus) {
        if (step.isError) {
          inspectorStatus.innerHTML = '<span class="status-badge badge-empty">Error</span>';
        } else if (step.operation.endsWith('_COMPLETE')) {
          inspectorStatus.innerHTML = '<span class="status-badge badge-settled">Completed</span>';
        } else if (step.operation === 'INITIAL') {
          inspectorStatus.innerHTML = '<span class="status-badge badge-ready">Ready</span>';
        } else {
          inspectorStatus.innerHTML = '<span class="status-badge badge-active">Running</span>';
        }
      }

      // 5. Playback buttons enabled/disabled states
      if (prevBtn) prevBtn.disabled = graph.currentHistoryIndex <= 0;
      if (nextBtn) nextBtn.disabled = graph.currentHistoryIndex >= graph.history.length - 1;

      // 6. Refresh matrix/list
      renderRepresentations();
      updateDropdowns();
    }

    // -------------------------------------------------------------------------
    // Event Listeners: Mutations
    // -------------------------------------------------------------------------

    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => {
        stopPlayback();
        const label = addNodeInput?.value?.trim() || '';
        const res = graph.addNode(label);
        if (!res.success) {
          alert(res.error);
          return;
        }
        if (addNodeInput) {
          // Suggest next letter
          const nextChar = String.fromCharCode(label.charCodeAt(0) + 1);
          addNodeInput.value = (/^[A-Y]$/i.test(label)) ? nextChar.toUpperCase() : '';
        }
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    if (removeNodeBtn) {
      removeNodeBtn.addEventListener('click', () => {
        stopPlayback();
        const target = removeNodeSelect?.value;
        if (!target) return;
        const res = graph.removeNode(target);
        if (!res.success) {
          alert(res.error);
          return;
        }
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    if (addEdgeBtn) {
      addEdgeBtn.addEventListener('click', () => {
        stopPlayback();
        const u = edgeFromSelect?.value;
        const v = edgeToSelect?.value;
        const w = Number(edgeWeightInput?.value || 1);
        if (!u || !v) {
          alert('Please select both source and destination nodes.');
          return;
        }
        const res = graph.addEdge(u, v, w);
        if (!res.success) {
          alert(res.error);
          return;
        }
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    if (removeEdgeBtn) {
      removeEdgeBtn.addEventListener('click', () => {
        stopPlayback();
        const u = edgeFromSelect?.value;
        const v = edgeToSelect?.value;
        if (!u || !v) return;
        const res = graph.removeEdge(u, v);
        if (!res.success) {
          alert(res.error);
          return;
        }
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    if (clearGraphBtn) {
      clearGraphBtn.addEventListener('click', () => {
        stopPlayback();
        graph.clear();
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    // Toggle Mode Listeners
    if (directedToggle) {
      directedToggle.addEventListener('change', (e) => {
        stopPlayback();
        graph.setDirected(e.target.checked);
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    if (weightedToggle) {
      weightedToggle.addEventListener('change', (e) => {
        stopPlayback();
        graph.setWeighted(e.target.checked);
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    // Preset Listener
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        stopPlayback();
        const preset = e.target.value;
        graph.loadPreset(preset);
        if (directedToggle) directedToggle.checked = graph.isDirected;
        if (weightedToggle) weightedToggle.checked = graph.isWeighted;
        persistGraph();
        renderCurrentStep(graph.getCurrentStep());
      });
    }

    // -------------------------------------------------------------------------
    // Event Listeners: Algorithm Triggers
    // -------------------------------------------------------------------------

    if (bfsBtn) {
      bfsBtn.addEventListener('click', () => {
        stopPlayback();
        const start = algoStartNodeSelect?.value;
        if (!start) {
          alert('Graph has no nodes to run BFS.');
          return;
        }
        try {
          graph.bfs(start);
          renderCurrentStep(graph.getCurrentStep());
          play();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (dfsBtn) {
      dfsBtn.addEventListener('click', () => {
        stopPlayback();
        const start = algoStartNodeSelect?.value;
        if (!start) {
          alert('Graph has no nodes to run DFS.');
          return;
        }
        try {
          graph.dfs(start);
          renderCurrentStep(graph.getCurrentStep());
          play();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (dijkstraBtn) {
      dijkstraBtn.addEventListener('click', () => {
        stopPlayback();
        const start = algoStartNodeSelect?.value;
        const target = algoTargetNodeSelect?.value || null;
        if (!start) {
          alert('Graph has no nodes to run Dijkstra.');
          return;
        }
        try {
          graph.dijkstra(start, target);
          renderCurrentStep(graph.getCurrentStep());
          play();
        } catch (err) {
          renderCurrentStep(graph.getCurrentStep());
          alert(err.message);
        }
      });
    }

    // -------------------------------------------------------------------------
    // Event Listeners: Playback Controls
    // -------------------------------------------------------------------------

    if (playBtn) playBtn.addEventListener('click', play);
    if (pauseBtn) pauseBtn.addEventListener('click', stopPlayback);

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopPlayback();
        const step = graph.prevStep();
        if (step) renderCurrentStep(step);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopPlayback();
        const step = graph.nextStep();
        if (step) renderCurrentStep(step);
      });
    }

    if (resetTimelineBtn) {
      resetTimelineBtn.addEventListener('click', () => {
        stopPlayback();
        const step = graph.goToStep(0);
        if (step) renderCurrentStep(step);
      });
    }

    // Initial render
    renderCurrentStep(graph.getCurrentStep());
  });
}

export { GraphEngine };
