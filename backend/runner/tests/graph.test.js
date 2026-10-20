// =============================================================================
// ALGOLAB — Interactive Graph Lab Tests (Phase 13)
//
// Automated test suite for GraphEngine:
// - Graph mutations (Add/Remove Node, Add/Remove Edge with incident cleanup)
// - Directed and undirected modes
// - Weighted and unweighted modes
// - Adjacency Matrix & Adjacency List representations
// - Deterministic BFS traversal & queue state
// - Deterministic DFS traversal & backtracking call stack
// - Dijkstra's algorithm (shortest distances, predecessors, path reconstruction)
// - Rejection of negative edge weights by Dijkstra
// - Self-loops and cyclic graphs
// - Disconnected components & unreachable node reporting
// - Invalid node and edge handling
// - Playback determinism (history immutability, step prev/next/reset)
// - Sequence token stale timer protection
// - Regression safety checks across existing engines
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import { GraphEngine } from '../../../frontend/js/graph.js';
import { TreeEngine } from '../../../frontend/js/tree.js';
import { LinkedListEngine } from '../../../frontend/js/linkedlist.js';
import { StackEngine } from '../../../frontend/js/stack.js';
import { QueueEngine } from '../../../frontend/js/queue.js';

// -----------------------------------------------------------------------------
// 1. Graph Model & Mutation Tests
// -----------------------------------------------------------------------------

describe('1. Graph Model & Topology Mutations', () => {

  test('Empty graph initializes with zero nodes and zero edges', () => {
    const graph = new GraphEngine();
    assert.equal(graph.nodes.size, 0);
    assert.equal(graph.edges.length, 0);
    assert.equal(graph.isDirected, false);
    assert.equal(graph.isWeighted, false);
    assert.equal(graph.history.length, 1);
    assert.equal(graph.getCurrentStep().operation, 'INITIAL');
  });

  test('Add nodes successfully with unique IDs and labels', () => {
    const graph = new GraphEngine();
    const resA = graph.addNode('A');
    const resB = graph.addNode('B', 100, 200);

    assert.equal(resA.success, true);
    assert.equal(resB.success, true);
    assert.equal(graph.nodes.size, 2);
    assert.equal(resA.node.label, 'A');
    assert.equal(resB.node.x, 100);
    assert.equal(resB.node.y, 200);
  });

  test('Rejects duplicate node labels (case-insensitive)', () => {
    const graph = new GraphEngine();
    graph.addNode('Alpha');
    const dup = graph.addNode('alpha');

    assert.equal(dup.success, false);
    assert.match(dup.error, /already exists/i);
    assert.equal(graph.nodes.size, 1);
  });

  test('Rejects empty or whitespace node labels', () => {
    const graph = new GraphEngine();
    const empty = graph.addNode('   ');
    assert.equal(empty.success, false);
    assert.match(empty.error, /cannot be empty/i);
  });

  test('Add and remove edges in undirected graph', () => {
    const graph = new GraphEngine({ isDirected: false });
    graph.addNode('A');
    graph.addNode('B');

    const edgeRes = graph.addEdge('A', 'B', 5);
    assert.equal(edgeRes.success, true);
    assert.equal(graph.edges.length, 1);

    // In undirected, edge A-B is found regardless of order
    const remRes = graph.removeEdge('B', 'A');
    assert.equal(remRes.success, true);
    assert.equal(graph.edges.length, 0);
  });

  test('Rejects duplicate edges in undirected and directed modes', () => {
    const undirected = new GraphEngine({ isDirected: false });
    undirected.addNode('A');
    undirected.addNode('B');
    undirected.addEdge('A', 'B');
    const dupU = undirected.addEdge('B', 'A');
    assert.equal(dupU.success, false);
    assert.match(dupU.error, /already exists/i);

    const directed = new GraphEngine({ isDirected: true });
    directed.addNode('X');
    directed.addNode('Y');
    directed.addEdge('X', 'Y');
    // X -> Y duplicate
    const dupD = directed.addEdge('X', 'Y');
    assert.equal(dupD.success, false);
    // Y -> X is valid in directed graph!
    const reverseD = directed.addEdge('Y', 'X');
    assert.equal(reverseD.success, true);
    assert.equal(directed.edges.length, 2);
  });

  test('Supports self-loops (u -> u)', () => {
    const graph = new GraphEngine({ isDirected: true });
    graph.addNode('A');
    const loopRes = graph.addEdge('A', 'A', 3);

    assert.equal(loopRes.success, true);
    assert.equal(graph.edges.length, 1);
    assert.equal(graph.edges[0].from, graph.edges[0].to);
  });

  test('CRITICAL: Removing a node automatically removes all incident edges (incoming & outgoing)', () => {
    const graph = new GraphEngine({ isDirected: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');

    // Incident edges to B:
    graph.addEdge('A', 'B'); // Incoming
    graph.addEdge('B', 'C'); // Outgoing
    graph.addEdge('A', 'C'); // Unrelated edge

    assert.equal(graph.edges.length, 3);

    const rem = graph.removeNode('B');
    assert.equal(rem.success, true);
    assert.equal(rem.removedEdgesCount, 2);
    assert.equal(graph.nodes.size, 2);
    assert.equal(graph.edges.length, 1);
    assert.equal(graph.edges[0].from, graph._resolveNode('A').id);
    assert.equal(graph.edges[0].to, graph._resolveNode('C').id);
  });

  test('Rejects edge addition with non-existent endpoints', () => {
    const graph = new GraphEngine();
    graph.addNode('A');
    const res = graph.addEdge('A', 'Ghost');
    assert.equal(res.success, false);
    assert.match(res.error, /does not exist/i);
  });

  test('Toggling directed and weighted modes updates internal state', () => {
    const graph = new GraphEngine();
    assert.equal(graph.isDirected, false);
    assert.equal(graph.isWeighted, false);

    graph.setDirected(true);
    assert.equal(graph.isDirected, true);

    graph.setWeighted(true);
    assert.equal(graph.isWeighted, true);
  });
});

// -----------------------------------------------------------------------------
// 2. Graph Representations: Adjacency Matrix & Adjacency List
// -----------------------------------------------------------------------------

describe('2. Graph Representations (Matrix & List)', () => {

  test('Adjacency Matrix for unweighted undirected graph', () => {
    const graph = new GraphEngine({ isDirected: false, isWeighted: false });
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    const { nodes, matrix } = graph.getAdjacencyMatrix();
    assert.deepEqual(nodes, ['A', 'B', 'C']);

    // Matrix should be symmetric:
    // A: [0, 1, 0]
    // B: [1, 0, 1]
    // C: [0, 1, 0]
    assert.deepEqual(matrix[0], [0, 1, 0]);
    assert.deepEqual(matrix[1], [1, 0, 1]);
    assert.deepEqual(matrix[2], [0, 1, 0]);
  });

  test('Adjacency Matrix for weighted directed graph with self-loop', () => {
    const graph = new GraphEngine({ isDirected: true, isWeighted: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B', 7);
    graph.addEdge('B', 'B', 3); // self-loop on B

    const { nodes, matrix } = graph.getAdjacencyMatrix();
    assert.deepEqual(nodes, ['A', 'B']);

    // A: [0, 7]
    // B: [null, 3] (null denotes no edge from B to A in weighted mode)
    assert.deepEqual(matrix[0], [0, 7]);
    assert.deepEqual(matrix[1], [null, 3]);
  });

  test('Adjacency List maps each node to deterministic sorted neighbor list', () => {
    const graph = new GraphEngine({ isDirected: true, isWeighted: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');
    graph.addEdge('A', 'C', 10);
    graph.addEdge('A', 'B', 5);

    const adjList = graph.getAdjacencyList();
    // Neighbors of A should be sorted alphabetically: B, then C
    assert.deepEqual(adjList['A'], [
      { target: 'B', weight: 5 },
      { target: 'C', weight: 10 }
    ]);
    assert.deepEqual(adjList['B'], []);
    assert.deepEqual(adjList['C'], []);
  });
});

// -----------------------------------------------------------------------------
// 3. Breadth-First Search (BFS) Engine Tests
// -----------------------------------------------------------------------------

describe('3. Breadth-First Search (BFS)', () => {

  test('BFS traversal order on a known graph', () => {
    const graph = new GraphEngine({ isDirected: false });
    // Triangle + branch: A connected to B, C; B connected to D
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');
    graph.addNode('D');
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    graph.addEdge('B', 'D');

    const steps = graph.bfs('A');
    assert.ok(steps.length > 0);

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.operation, 'BFS_COMPLETE');

    // Expected order from A: A -> B -> C -> D (since B precedes C alphabetically)
    const labels = finalStep.traversalOrder.map(id => graph.nodes.get(id).label);
    assert.deepEqual(labels, ['A', 'B', 'C', 'D']);
  });

  test('BFS correctly reports unreachable nodes in disconnected graph', () => {
    const graph = new GraphEngine({ isDirected: false });
    graph.loadPreset('disconnected'); // Comp 1: A,B,C; Comp 2: D,E,F

    const steps = graph.bfs('A');
    const finalStep = steps[steps.length - 1];

    const visitedLabels = finalStep.traversalOrder.map(id => graph.nodes.get(id).label);
    assert.deepEqual(visitedLabels, ['A', 'B', 'C']);
    assert.match(finalStep.message, /Disconnected nodes \[D, E, F\] were unreachable/i);
  });

  test('BFS throws error on non-existent start node', () => {
    const graph = new GraphEngine();
    graph.addNode('A');
    assert.throws(() => graph.bfs('Z'), /does not exist/i);
  });
});

// -----------------------------------------------------------------------------
// 4. Depth-First Search (DFS) Engine Tests
// -----------------------------------------------------------------------------

describe('4. Depth-First Search (DFS)', () => {

  test('DFS visits deep branches and executes backtracking steps', () => {
    const graph = new GraphEngine({ isDirected: false });
    // Line: A - B - C
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');

    const steps = graph.dfs('A');
    assert.ok(steps.length > 0);

    // Verify backtrack steps exist
    const backtrackSteps = steps.filter(s => s.operation === 'DFS_BACKTRACK');
    assert.ok(backtrackSteps.length >= 3, 'Must backtrack from C, B, and A');

    const finalStep = steps[steps.length - 1];
    assert.equal(finalStep.operation, 'DFS_COMPLETE');
    const labels = finalStep.traversalOrder.map(id => graph.nodes.get(id).label);
    assert.deepEqual(labels, ['A', 'B', 'C']);
  });

  test('DFS educational explanations explicitly state non-shortest-path property', () => {
    const graph = new GraphEngine();
    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B');

    const steps = graph.dfs('A');
    const finalStep = steps[steps.length - 1];
    assert.match(finalStep.explanation.why, /does NOT produce shortest paths|does NOT guarantee shortest path/i);
  });

  test('DFS handles cycles gracefully without infinite loop', () => {
    const graph = new GraphEngine({ isDirected: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');
    graph.addEdge('A', 'B');
    graph.addEdge('B', 'C');
    graph.addEdge('C', 'A'); // Cycle!

    const steps = graph.dfs('A');
    const cycleCheckSteps = steps.filter(s => s.operation === 'DFS_ALREADY_VISITED');
    assert.ok(cycleCheckSteps.length >= 1, 'Should encounter already visited back-edge');

    const finalStep = steps[steps.length - 1];
    const labels = finalStep.traversalOrder.map(id => graph.nodes.get(id).label);
    assert.deepEqual(labels, ['A', 'B', 'C']);
  });
});

// -----------------------------------------------------------------------------
// 5. Dijkstra's Algorithm Tests
// -----------------------------------------------------------------------------

describe('5. Dijkstra Shortest Path Algorithm', () => {

  test('Dijkstra correctly computes shortest path when multi-hop is cheaper than direct edge', () => {
    const graph = new GraphEngine({ isDirected: true, isWeighted: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addNode('C');

    // Direct A -> B costs 10
    // Multi-hop A -> C (2) -> B (3) costs 5 (< 10)
    graph.addEdge('A', 'B', 10);
    graph.addEdge('A', 'C', 2);
    graph.addEdge('C', 'B', 3);

    const steps = graph.dijkstra('A', 'B');
    const finalStep = steps[steps.length - 1];

    assert.equal(finalStep.operation, 'DIJKSTRA_COMPLETE');
    assert.equal(finalStep.distances['B'], 5);
    assert.equal(finalStep.distances['C'], 2);
    assert.equal(finalStep.predecessors['B'], 'C');
    assert.match(finalStep.message, /\[A -> C -> B\] with total cost 5/i);
  });

  test('INVARIANT: Dijkstra strictly rejects negative edge weights', () => {
    const graph = new GraphEngine({ isDirected: true, isWeighted: true });
    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B', -3); // Negative weight!

    assert.throws(() => {
      graph.dijkstra('A');
    }, /Negative edge weight \(-3\) detected/i);

    // Ensure error step was recorded for UI
    assert.equal(graph.history[0].isError, true);
    assert.equal(graph.history[0].operation, 'DIJKSTRA_ERROR');
  });

  test('Dijkstra handles disconnected target reporting unreachable (cost ∞)', () => {
    const graph = new GraphEngine({ isDirected: false, isWeighted: true });
    graph.loadPreset('disconnected'); // Comp 1: A,B,C; Comp 2: D,E,F

    const steps = graph.dijkstra('A', 'D');
    const finalStep = steps[steps.length - 1];

    assert.equal(finalStep.distances['D'], '∞');
    assert.match(finalStep.message, /Target D is UNREACHABLE from source A/i);
  });

  test('Dijkstra on 6-node weighted preset yields optimal distances', () => {
    const graph = new GraphEngine();
    graph.loadPreset('weighted');

    // Source A to all targets
    const steps = graph.dijkstra('A');
    const finalStep = steps[steps.length - 1];

    // Distances: A: 0, C: 2, B: 3 (via C), D: 8 (3+5), E: 10 (2+8 or 8+2), F: 13 (E->F: 10+3=13, D->F: 8+6=14)
    assert.equal(finalStep.distances['A'], 0);
    assert.equal(finalStep.distances['C'], 2);
    assert.equal(finalStep.distances['B'], 3);
    assert.equal(finalStep.distances['D'], 8);
    assert.equal(finalStep.distances['E'], 10);
    assert.equal(finalStep.distances['F'], 13);
  });
});

// -----------------------------------------------------------------------------
// 6. Playback Determinism & Stale Timer Protection
// -----------------------------------------------------------------------------

describe('6. Playback Determinism & History Navigation', () => {

  test('Step navigation nextStep() and prevStep() restore exact snapshot', () => {
    const graph = new GraphEngine({ isDirected: false });
    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B');

    const steps = graph.bfs('A');
    const totalSteps = steps.length;
    assert.ok(totalSteps >= 3);

    // Initial step index is 0
    assert.equal(graph.currentHistoryIndex, 0);

    // Advance to end
    for (let i = 0; i < totalSteps - 1; i++) {
      graph.nextStep();
    }
    assert.equal(graph.currentHistoryIndex, totalSteps - 1);

    // Step backward
    const stepBefore = graph.prevStep();
    assert.equal(graph.currentHistoryIndex, totalSteps - 2);
    assert.equal(stepBefore, graph.history[totalSteps - 2]);

    // Go to step 0
    const stepZero = graph.goToStep(0);
    assert.equal(graph.currentHistoryIndex, 0);
    assert.equal(stepZero.operation, 'BFS_START');
  });

  test('Sequence token increments on algorithm run and clear', () => {
    const graph = new GraphEngine();
    const token0 = graph.sequenceToken;

    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B');

    graph.bfs('A');
    const token1 = graph.sequenceToken;
    assert.ok(token1 > token0);

    graph.dfs('A');
    const token2 = graph.sequenceToken;
    assert.ok(token2 > token1);

    graph.clear();
    const token3 = graph.sequenceToken;
    assert.ok(token3 > token2);
  });
});

// -----------------------------------------------------------------------------
// 7. Regression Safety: Existing Labs
// -----------------------------------------------------------------------------

describe('7. Platform Regression Checks', () => {

  test('TreeEngine operates regression-free', () => {
    const tree = new TreeEngine([50, 30, 70]);
    assert.equal(tree.size(), 3);
    assert.equal(tree.search(30).foundNodeId !== null, true);
  });

  test('LinkedListEngine operates regression-free', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    const step = ll.insertTail(20);
    assert.equal(ll.size(), 2);
    assert.deepEqual(step.values, [10, 20]);
  });

  test('StackEngine and QueueEngine operate regression-free', () => {
    const stack = new StackEngine();
    stack.push(42);
    const peekStep = stack.peek();
    assert.equal(peekStep.operand, 42);
    assert.equal(stack.elements.length, 1);

    const queue = new QueueEngine();
    queue.enqueue(99);
    const qPeekStep = queue.peek();
    assert.equal(qPeekStep.operand, 99);
    assert.equal(queue.elements.length, 1);
  });
});
