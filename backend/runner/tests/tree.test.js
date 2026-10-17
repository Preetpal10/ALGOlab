// =============================================================================
// ALGOLAB — Binary Tree & BST Visualizer Tests (Phase 11.1)
//
// Automated test suite for BST engine, deletion cases (leaf, 1-child, 2-child),
// traversals (inorder, preorder, postorder, level-order), playback & history
// branching, educational explanation rules, Docker genuine Java execution,
// and platform regressions.
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TreeEngine } from '../../../frontend/js/tree.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';
import { LinkedListEngine } from '../../../frontend/js/linkedlist.js';
import { StackEngine } from '../../../frontend/js/stack.js';
import { QueueEngine } from '../../../frontend/js/queue.js';
import {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateLinearSearchSteps,
  generateBinarySearchSteps,
} from '../../../frontend/js/visualizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const BST_DEMO_FIXTURE = path.resolve(FIXTURES_DIR, 'BSTDemo.java');

// ---------------------------------------------------------------------------
// 1. Binary Search Tree Engine Logic & State Transitions
// ---------------------------------------------------------------------------

describe('Binary Search Tree Engine & Operations (Phase 11.1)', () => {

  test('1. Empty tree initialization: size 0, height 0, root null', () => {
    const tree = new TreeEngine();
    assert.equal(tree.size(), 0);
    assert.equal(tree.isEmpty(), true);
    assert.equal(tree.rootId, null);
    assert.equal(tree.history.length, 1);

    const initialStep = tree.getCurrentStep();
    assert.equal(initialStep.operation, 'INITIAL');
    assert.equal(initialStep.rootId, null);
    assert.equal(initialStep.nodeCount, 0);
    assert.equal(initialStep.height, 0);
  });

  test('2. Insert root node: tree becomes non-empty, height 1', () => {
    const tree = new TreeEngine();
    const step = tree.insert(50);

    assert.equal(tree.size(), 1);
    assert.equal(tree.isEmpty(), false);
    assert.equal(step.operation, 'INSERT_ROOT');
    assert.equal(step.operand, 50);
    assert.notEqual(step.rootId, null);
    assert.equal(step.height, 1);
    assert.equal(tree.nodes.get(tree.rootId).val, 50);
  });

  test('3. Insert left child (val < root.val): properly linked to root.left', () => {
    const tree = new TreeEngine([50]);
    const step = tree.insert(30);

    assert.equal(tree.size(), 2);
    assert.equal(step.operation, 'INSERT_SUCCESS');
    assert.equal(step.operand, 30);
    const rootNode = tree.nodes.get(tree.rootId);
    assert.notEqual(rootNode.leftId, null);
    assert.equal(tree.nodes.get(rootNode.leftId).val, 30);
    assert.equal(rootNode.rightId, null);
  });

  test('4. Insert right child (val > root.val): properly linked to root.right', () => {
    const tree = new TreeEngine([50]);
    const step = tree.insert(70);

    assert.equal(tree.size(), 2);
    assert.equal(step.operation, 'INSERT_SUCCESS');
    assert.equal(step.operand, 70);
    const rootNode = tree.nodes.get(tree.rootId);
    assert.notEqual(rootNode.rightId, null);
    assert.equal(tree.nodes.get(rootNode.rightId).val, 70);
    assert.equal(rootNode.leftId, null);
  });

  test('5. Multi-level BST insertion: preserves BST invariant and computes height', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);

    assert.equal(tree.size(), 7);
    const step = tree.getCurrentStep();
    assert.equal(step.nodeCount, 7);
    assert.equal(step.height, 3);

    const rootNode = tree.nodes.get(tree.rootId);
    assert.equal(rootNode.val, 50);

    const leftNode = tree.nodes.get(rootNode.leftId);
    assert.equal(leftNode.val, 30);
    assert.equal(tree.nodes.get(leftNode.leftId).val, 20);
    assert.equal(tree.nodes.get(leftNode.rightId).val, 40);

    const rightNode = tree.nodes.get(rootNode.rightId);
    assert.equal(rightNode.val, 70);
    assert.equal(tree.nodes.get(rightNode.leftId).val, 60);
    assert.equal(tree.nodes.get(rightNode.rightId).val, 80);
  });

  test('6. Duplicate insertion: does not add duplicate node', () => {
    const tree = new TreeEngine([50, 30, 70]);
    assert.equal(tree.size(), 3);

    tree.insert(30);
    assert.equal(tree.size(), 3);
    const step = tree.getCurrentStep();
    assert.ok(step.message.includes('Duplicates not inserted'));
  });

  test('7. Search existing node: finds target and marks foundNodeId', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    const step = tree.search(40);

    assert.equal(step.operation, 'SEARCH_FOUND');
    assert.equal(step.searchResult.found, true);
    assert.equal(step.searchResult.val, 40);
    assert.notEqual(step.foundNodeId, null);
    assert.equal(tree.nodes.get(step.foundNodeId).val, 40);
  });

  test('8. Search non-existing node: returns not found with searchResult.found = false', () => {
    const tree = new TreeEngine([50, 30, 70]);
    const step = tree.search(99);

    assert.equal(step.operation, 'SEARCH_NOT_FOUND');
    assert.equal(step.searchResult.found, false);
    assert.equal(step.searchResult.val, 99);
  });

  test('9. Delete Case 1 (Leaf node): unlinks leaf from parent without side effects', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40]);
    assert.equal(tree.size(), 5);

    const step = tree.delete(20);
    assert.equal(step.operation, 'DELETE_SUCCESS');
    assert.equal(tree.size(), 4);

    const node30 = tree.nodes.get(tree.nodes.get(tree.rootId).leftId);
    assert.equal(node30.leftId, null);
    assert.notEqual(node30.rightId, null);
  });

  test('10. Delete Case 2 (Single-child node): promotes child to replace deleted node', () => {
    const tree = new TreeEngine([50, 30, 70, 40]);
    // 30 has only one child: 40 (on the right)
    assert.equal(tree.size(), 4);

    const step = tree.delete(30);
    assert.equal(step.operation, 'DELETE_SUCCESS');
    assert.equal(tree.size(), 3);

    const rootNode = tree.nodes.get(tree.rootId);
    const promotedNode = tree.nodes.get(rootNode.leftId);
    assert.equal(promotedNode.val, 40);
  });

  test('11. Delete Case 3 (Two children): replaces with inorder successor and preserves BST', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    // Root 50 has two children: 30 and 70.
    // Inorder successor is min in right subtree = 60.
    assert.equal(tree.size(), 7);

    const step = tree.delete(50);
    assert.equal(step.operation, 'DELETE_SUCCESS');
    assert.equal(tree.size(), 6);

    const newRoot = tree.nodes.get(tree.rootId);
    assert.equal(newRoot.val, 60, 'Root value must be replaced by inorder successor 60');

    // Right subtree must no longer contain node 60
    const rightChild = tree.nodes.get(newRoot.rightId);
    assert.equal(rightChild.val, 70);
    assert.equal(rightChild.leftId, null, 'Successor node 60 must be removed from right subtree');
    assert.equal(tree.nodes.get(rightChild.rightId).val, 80);
  });

  test('12. Inorder traversal: visits nodes in strictly sorted ascending order', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    tree.inorder();

    const finalStep = tree.getCurrentStep();
    assert.equal(finalStep.operation, 'TRAVERSE_INORDER');
    assert.deepEqual(finalStep.traversalOutput, [20, 30, 40, 50, 60, 70, 80]);
  });

  test('13. Preorder traversal: visits in Root -> Left -> Right order', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    tree.preorder();

    const finalStep = tree.getCurrentStep();
    assert.equal(finalStep.operation, 'TRAVERSE_PREORDER');
    assert.deepEqual(finalStep.traversalOutput, [50, 30, 20, 40, 70, 60, 80]);
  });

  test('14. Postorder traversal: visits in Left -> Right -> Root order', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    tree.postorder();

    const finalStep = tree.getCurrentStep();
    assert.equal(finalStep.operation, 'TRAVERSE_POSTORDER');
    assert.deepEqual(finalStep.traversalOutput, [20, 40, 30, 60, 80, 70, 50]);
  });

  test('15. Level-Order traversal: visits breadth-first level-by-level', () => {
    const tree = new TreeEngine([50, 30, 70, 20, 40, 60, 80]);
    tree.levelorder();

    const finalStep = tree.getCurrentStep();
    assert.equal(finalStep.operation, 'TRAVERSE_LEVELORDER');
    assert.deepEqual(finalStep.traversalOutput, [50, 30, 70, 20, 40, 60, 80]);
  });

  test('16. Clear tree: resets tree to empty state', () => {
    const tree = new TreeEngine([50, 30, 70]);
    assert.equal(tree.size(), 3);

    const step = tree.clear();
    assert.equal(tree.size(), 0);
    assert.equal(tree.isEmpty(), true);
    assert.equal(tree.rootId, null);
    assert.equal(step.operation, 'CLEAR');
  });
});

// ---------------------------------------------------------------------------
// 2. History, Timeline Navigation & Playback State Transitions
// ---------------------------------------------------------------------------

describe('BST Timeline & Playback Navigation (Phase 11.1)', () => {

  test('17. goToStep restores complete historical snapshot immutably', () => {
    const tree = new TreeEngine();
    tree.insert(50);
    tree.insert(30);
    tree.insert(70);

    const totalSteps = tree.history.length;
    assert.ok(totalSteps >= 4);

    // Step back to when only 50 was inserted
    const step1 = tree.history.find(s => s.operation === 'INSERT_ROOT');
    const step1Idx = tree.history.indexOf(step1);
    tree.goToStep(step1Idx);

    assert.equal(tree.size(), 1);
    assert.equal(tree.nodes.get(tree.rootId).val, 50);

    // Step forward to final step
    tree.goToStep(totalSteps - 1);
    assert.equal(tree.size(), 3);
  });

  test('18. prevStep and nextStep navigate backwards and forwards', () => {
    const tree = new TreeEngine([50, 30]);
    const maxIdx = tree.history.length - 1;

    tree.goToStep(maxIdx);
    const prev = tree.prevStep();
    assert.equal(tree.currentHistoryIndex, maxIdx - 1);
    assert.ok(prev);

    const next = tree.nextStep();
    assert.equal(tree.currentHistoryIndex, maxIdx);
    assert.ok(next);
  });

  test('19. History branching: new operation truncates future timeline', () => {
    const tree = new TreeEngine();
    tree.insert(50);
    tree.insert(30);
    tree.insert(70);
    const originalLen = tree.history.length;

    // Go back to midway
    tree.goToStep(2);
    // Perform new insertion
    tree.insert(40);

    assert.ok(tree.history.length < originalLen + 3, 'Future steps after step 2 must have been truncated');
    assert.equal(tree.currentHistoryIndex, tree.history.length - 1);
  });
});

// ---------------------------------------------------------------------------
// 3. Educational Step Explanation Engine for BST
// ---------------------------------------------------------------------------

describe('Educational Step Explanation Engine for BST (Phase 11.1)', () => {

  test('20. BST Node Creation: explains return new Node(val)', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'return new Node(val);\n'
    });
    assert.equal(explanation.category, 'BST Node Creation');
    assert.ok(explanation.what.includes('leaf node'));
  });

  test('21. BST Left Subtree Update: explains root.left = insert(root.left, val)', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'root.left = insert(root.left, val);\n'
    });
    assert.equal(explanation.category, 'BST Left Subtree Update');
    assert.ok(explanation.what.includes('root.left'));
  });

  test('22. BST Right Subtree Update: explains root.right = insert(root.right, val)', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'root.right = insert(root.right, val);\n'
    });
    assert.equal(explanation.category, 'BST Right Subtree Update');
    assert.ok(explanation.what.includes('root.right'));
  });

  test('23. BST Successor Replacement: explains root.val = successor.val', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'root.val = successor.val;\n'
    });
    assert.equal(explanation.category, 'BST Successor Replacement');
    assert.ok(explanation.what.includes('Inorder Successor'));
  });

  test('24. Inorder Traversal recursive call: explains inorder(root.left)', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'inorder(root.left);\n'
    });
    assert.equal(explanation.category, 'Inorder Traversal (left)');
    assert.ok(explanation.why.includes('Left'));
  });

  test('25. BST Null Check: explains if (root == null)', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'if (root == null) {\n'
    });
    assert.equal(explanation.category, 'BST Null Check (Base Case)');
    assert.ok(explanation.why.includes('Base case'));
  });
});

// ---------------------------------------------------------------------------
// 4. Docker Container Execution Integration (BSTDemo.java)
// ---------------------------------------------------------------------------

describe('BST Docker Execution Integration (Phase 11.1)', () => {

  test('26. BSTDemo.java runs in isolated Docker container and returns genuine JDI trace', async () => {
    assert.ok(fs.existsSync(BST_DEMO_FIXTURE), 'BSTDemo.java fixture must exist');
    const javaSource = fs.readFileSync(BST_DEMO_FIXTURE, 'utf-8');

    const result = await runInContainer({
      code: javaSource,
      mainClass: 'BSTDemo',
      limits: {
        timeoutMs: 30_000
      }
    });

    assert.equal(result.outcome, 'success', `Run failed: ${result.stderr}`);
    assert.ok(result.events && result.events.length > 0, 'Must produce genuine trace events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length >= 25, `Expected at least 25 step events, got ${stepEvents.length}`);

    // Check stdout captures authentic operations
    assert.ok(result.exitEvent, 'Exit event should be present');
    const stdout = result.exitEvent.stdout || '';
    assert.ok(stdout.includes('INSERT: 50'), 'Output must contain INSERT: 50');
    assert.ok(stdout.includes('INORDER: 20 30 40 50 60 70 80'), 'Output must contain correct Inorder sequence');
    assert.ok(stdout.includes('PREORDER: 50 30 20 40 70 60 80'), 'Output must contain correct Preorder sequence');
    assert.ok(stdout.includes('POSTORDER: 20 40 30 60 80 70 50'), 'Output must contain correct Postorder sequence');
    assert.ok(stdout.includes('SEARCH 40: true'), 'Output must confirm search for 40 is true');
    assert.ok(stdout.includes('SEARCH 99: false'), 'Output must confirm search for 99 is false');
    assert.ok(stdout.includes('DELETED LEAF: 20'), 'Output must contain DELETED LEAF: 20');
    assert.ok(stdout.includes('DELETED ONE-CHILD: 30'), 'Output must contain DELETED ONE-CHILD: 30');
    assert.ok(stdout.includes('DELETED TWO-CHILD: 50 (Root)'), 'Output must contain DELETED TWO-CHILD: 50 (Root)');
    assert.ok(stdout.includes('FINAL INORDER: 25 60 70 80'), 'Output must contain correct final inorder sequence');
    assert.ok(stdout.includes('BST operations completed successfully.'), 'Program must complete with success signal');
  });
});

// ---------------------------------------------------------------------------
// 5. Platform Regression Suite
// ---------------------------------------------------------------------------

describe('Platform Regression Suite', () => {

  test('27. Linked List engine remains fully operational', () => {
    const ll = new LinkedListEngine([10, 20]);
    ll.insertHead(5);
    ll.insertTail(30);
    assert.equal(ll.size(), 4);
    assert.deepEqual(ll.getCurrentStep().values, [5, 10, 20, 30]);
  });

  test('28. Stack engine remains fully operational', () => {
    const stack = new StackEngine(5);
    stack.push(10);
    stack.push(20);
    assert.equal(stack.peek().operand, 20);
    assert.equal(stack.pop().operand, 20);
    assert.equal(stack.elements.length, 1);
  });

  test('29. Queue engine remains fully operational', () => {
    const queue = new QueueEngine(5);
    queue.enqueue(10);
    queue.enqueue(20);
    assert.equal(queue.peek().operand, 10);
    assert.equal(queue.dequeue().operand, 10);
    assert.equal(queue.size(), 1);
  });

  test('30. Sorting & Searching step generators remain fully operational', () => {
    const arr = [5, 2, 8, 1];
    const bubble = generateBubbleSortSteps(arr);
    assert.ok(bubble.length > 0);

    const selection = generateSelectionSortSteps(arr);
    assert.ok(selection.length > 0);

    const insertion = generateInsertionSortSteps(arr);
    assert.ok(insertion.length > 0);

    const linear = generateLinearSearchSteps(arr, 8);
    assert.ok(linear.length > 0);

    const sortedArr = [1, 2, 5, 8];
    const binary = generateBinarySearchSteps(sortedArr, 5);
    assert.ok(binary.length > 0);
  });
});
