import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  VISUALIZER_STORAGE_KEY,
  saveVisualizerState,
  loadVisualizerState
} from '../../../frontend/js/visualizer.js';

import {
  STACK_STORAGE_KEY,
  saveStackState,
  loadStackState
} from '../../../frontend/js/stack.js';

import {
  QUEUE_STORAGE_KEY,
  saveQueueState,
  loadQueueState
} from '../../../frontend/js/queue.js';

import {
  LINKEDLIST_STORAGE_KEY,
  saveLinkedListState,
  loadLinkedListState
} from '../../../frontend/js/linkedlist.js';

import {
  TREE_STORAGE_KEY,
  saveTreeState,
  loadTreeState
} from '../../../frontend/js/tree.js';

import {
  GRAPH_STORAGE_KEY,
  saveGraphState,
  loadGraphState
} from '../../../frontend/js/graph.js';

import {
  MAZE_STORAGE_KEY,
  saveMazeState,
  loadMazeState
} from '../../../frontend/js/maze.js';

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

describe('Phase 15 — Laboratory Web Storage Persistence Tests', () => {

  test('Visualizer Lab: saves, loads, and handles empty/null storage', () => {
    const storage = createMockStorage();
    const state = { array: [15, 42, 8, 99], algorithm: 'bubble', target: 42, size: 4, speed: 120 };

    assert.equal(saveVisualizerState(storage, state), true);
    const loaded = loadVisualizerState(storage);
    assert.deepEqual(loaded, state);
    assert.equal(saveVisualizerState(null, state), false);
    assert.equal(loadVisualizerState(null), null);
  });

  test('Stack Lab: saves and loads element sequence', () => {
    const storage = createMockStorage();
    const elements = [10, 20, 30, 40];

    assert.equal(saveStackState(storage, elements), true);
    assert.deepEqual(loadStackState(storage), elements);
    assert.equal(typeof storage.getItem(STACK_STORAGE_KEY), 'string');
  });

  test('Queue Lab: saves and loads queue elements', () => {
    const storage = createMockStorage();
    const elements = ['first', 'second', 'third'];

    assert.equal(saveQueueState(storage, elements), true);
    assert.deepEqual(loadQueueState(storage), elements);
    assert.equal(typeof storage.getItem(QUEUE_STORAGE_KEY), 'string');
  });

  test('Linked List Lab: saves and loads node values', () => {
    const storage = createMockStorage();
    const elements = [5, 15, 25, 35];

    assert.equal(saveLinkedListState(storage, elements), true);
    assert.deepEqual(loadLinkedListState(storage), elements);
    assert.equal(typeof storage.getItem(LINKEDLIST_STORAGE_KEY), 'string');
  });

  test('Tree Lab: saves and loads tree node values', () => {
    const storage = createMockStorage();
    const values = [50, 25, 75, 10, 30];

    assert.equal(saveTreeState(storage, values), true);
    assert.deepEqual(loadTreeState(storage), values);
    assert.equal(typeof storage.getItem(TREE_STORAGE_KEY), 'string');
  });

  test('Graph Lab: saves and loads nodes, edges, and mode toggles', () => {
    const storage = createMockStorage();
    const graphState = {
      nodes: [{ id: 'node_1', label: 'A', x: 100, y: 150 }, { id: 'node_2', label: 'B', x: 250, y: 300 }],
      edges: [{ id: 'edge_1_2', from: 'node_1', to: 'node_2', weight: 7 }],
      isDirected: true,
      isWeighted: true,
      preset: 'custom'
    };

    assert.equal(saveGraphState(storage, graphState), true);
    const loaded = loadGraphState(storage);
    assert.deepEqual(loaded, graphState);
    assert.equal(typeof storage.getItem(GRAPH_STORAGE_KEY), 'string');
  });

  test('Maze Lab: saves and loads grid data and algorithm settings', () => {
    const storage = createMockStorage();
    const mazeState = {
      mazeData: {
        grid: [[0, 1], [0, 0]],
        size: 3,
        start: { row: 0, col: 0 },
        end: { row: 2, col: 2 }
      },
      size: '15',
      algo: 'bfs'
    };

    assert.equal(saveMazeState(storage, mazeState), true);
    const loaded = loadMazeState(storage);
    assert.deepEqual(loaded, mazeState);
    assert.equal(typeof storage.getItem(MAZE_STORAGE_KEY), 'string');
  });

  test('Handles corrupted JSON in storage without throwing', () => {
    const storage = createMockStorage();
    storage.setItem(GRAPH_STORAGE_KEY, 'INVALID_JSON{{{');
    storage.setItem(MAZE_STORAGE_KEY, 'BAD_DATA[');

    assert.equal(loadGraphState(storage), null);
    assert.equal(loadMazeState(storage), null);
  });
});
