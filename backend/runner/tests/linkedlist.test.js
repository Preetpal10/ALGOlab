// =============================================================================
// ALGOLAB — Linked List Data Structure Tests (Phase 10.3)
//
// Automated test suite for Singly Linked List Visualizer engine, educational
// explanation rules, Docker-based genuine Java execution, and regressions.
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { LinkedListEngine } from '../../../frontend/js/linkedlist.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';
import {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateLinearSearchSteps,
  generateBinarySearchSteps,
} from '../../../frontend/js/visualizer.js';
import { StackEngine } from '../../../frontend/js/stack.js';
import { QueueEngine } from '../../../frontend/js/queue.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const LINKED_LIST_DEMO_FIXTURE = path.resolve(FIXTURES_DIR, 'LinkedListDemo.java');

// ---------------------------------------------------------------------------
// 1. Linked List Engine Logic & State Transitions
// ---------------------------------------------------------------------------

describe('Singly Linked List Engine & Operations (Phase 10.3)', () => {

  test('1. Empty list initialization: size 0, head null, values empty', () => {
    const ll = new LinkedListEngine();
    assert.equal(ll.size(), 0);
    assert.equal(ll.isEmpty(), true);
    assert.equal(ll.headId, null);
    assert.equal(ll.history.length, 1);

    const initialStep = ll.getCurrentStep();
    assert.equal(initialStep.operation, 'INITIAL');
    assert.equal(initialStep.headId, null);
    assert.deepEqual(initialStep.values, []);
    assert.equal(initialStep.length, 0);
  });

  test('2. Insert at head: updates head pointer and links new node', () => {
    const ll = new LinkedListEngine();
    const step = ll.insertHead(10);

    assert.equal(ll.size(), 1);
    assert.equal(ll.isEmpty(), false);
    assert.equal(step.operation, 'INSERT_HEAD');
    assert.equal(step.operand, 10);
    assert.deepEqual(step.values, [10]);
    assert.notEqual(step.headId, null);
  });

  test('3. Multiple inserts at head: maintains reverse insertion order at head', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    ll.insertHead(20);
    const step = ll.insertHead(30);

    assert.equal(ll.size(), 3);
    assert.deepEqual(step.values, [30, 20, 10]);
    assert.equal(step.nodes[0].val, 30);
    assert.equal(step.nodes[1].val, 20);
    assert.equal(step.nodes[2].val, 10);
    assert.equal(step.nodes[2].nextId, null);
  });

  test('4. Insert at tail: appends node to end of list', () => {
    const ll = new LinkedListEngine();
    ll.insertTail(10);
    ll.insertTail(20);
    const step = ll.insertTail(30);

    assert.equal(ll.size(), 3);
    assert.deepEqual(step.values, [10, 20, 30]);
    assert.equal(step.nodes[0].val, 10);
    assert.equal(step.nodes[2].val, 30);
    assert.equal(step.nodes[2].nextId, null);
  });

  test('5. Insert at position 0: behaves identical to insertHead', () => {
    const ll = new LinkedListEngine([20, 30]);
    const step = ll.insertAt(10, 0);

    assert.equal(step.operation, 'INSERT_HEAD');
    assert.deepEqual(step.values, [10, 20, 30]);
  });

  test('6. Insert at position length: behaves identical to insertTail', () => {
    const ll = new LinkedListEngine([10, 20]);
    const step = ll.insertAt(30, 2);

    assert.equal(step.operation, 'INSERT_TAIL');
    assert.deepEqual(step.values, [10, 20, 30]);
  });

  test('7. Insert at middle position: correctly splices node into chain', () => {
    const ll = new LinkedListEngine([10, 30]);
    const step = ll.insertAt(20, 1);

    assert.equal(step.operation, 'INSERT_AT');
    assert.deepEqual(step.values, [10, 20, 30]);
    assert.equal(step.nodes[0].val, 10);
    assert.equal(step.nodes[1].val, 20);
    assert.equal(step.nodes[2].val, 30);
    assert.equal(step.nodes[0].nextId, step.nodes[1].id);
    assert.equal(step.nodes[1].nextId, step.nodes[2].id);
  });

  test('8. Insert at invalid position: rejects out-of-bounds index gracefully', () => {
    const ll = new LinkedListEngine([10, 20]);
    const errorStep = ll.insertAt(99, 5);

    assert.equal(errorStep.operation, 'INSERT_ERROR');
    assert.equal(errorStep.isError, true);
    assert.equal(ll.size(), 2);
    assert.deepEqual(ll.getCurrentStep().values, [10, 20]);
  });

  test('9. Delete head: unlinks first node and advances head pointer', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.deleteValue(10);

    assert.equal(step.operation, 'DELETE_VALUE');
    assert.deepEqual(step.values, [20, 30]);
    assert.equal(ll.size(), 2);
  });

  test('10. Delete middle node by value: correctly unlinks target node', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.deleteValue(20);

    assert.equal(step.operation, 'DELETE_VALUE');
    assert.deepEqual(step.values, [10, 30]);
    assert.equal(step.nodes[0].nextId, step.nodes[1].id);
  });

  test('11. Delete tail node by value: correctly updates new tail next to null', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.deleteValue(30);

    assert.equal(step.operation, 'DELETE_VALUE');
    assert.deepEqual(step.values, [10, 20]);
    assert.equal(step.nodes[1].nextId, null);
  });

  test('12. Delete from empty list: triggers underflow step without crashing', () => {
    const ll = new LinkedListEngine();
    const step = ll.deleteValue(10);

    assert.equal(step.operation, 'DELETE_UNDERFLOW');
    assert.equal(step.isUnderflow, true);
    assert.equal(ll.size(), 0);
  });

  test('13. Delete missing value: reports not found without mutating list', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.deleteValue(99);

    assert.equal(step.operation, 'DELETE_NOT_FOUND');
    assert.equal(step.isError, true);
    assert.deepEqual(step.values, [10, 20, 30]);
  });

  test('14. Delete at position: deletes head at pos 0 and middle at pos 1', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step1 = ll.deleteAt(1); // removes 20
    assert.deepEqual(step1.values, [10, 30]);

    const step2 = ll.deleteAt(0); // removes 10
    assert.deepEqual(step2.values, [30]);
  });

  test('15. Delete at invalid position: rejects index out of bounds', () => {
    const ll = new LinkedListEngine([10, 20]);
    const errorStep = ll.deleteAt(5);

    assert.equal(errorStep.operation, 'DELETE_ERROR');
    assert.equal(errorStep.isError, true);
    assert.equal(ll.size(), 2);
  });

  test('16. Search existing value: reports found=true with correct index and node ID', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.search(20);

    assert.equal(step.operation, 'SEARCH_FOUND');
    assert.ok(step.searchResult);
    assert.equal(step.searchResult.found, true);
    assert.equal(step.searchResult.index, 1);
    assert.equal(step.searchResult.value, 20);
  });

  test('17. Search missing value: reports found=false and index -1', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.search(99);

    assert.equal(step.operation, 'SEARCH_NOT_FOUND');
    assert.ok(step.searchResult);
    assert.equal(step.searchResult.found, false);
    assert.equal(step.searchResult.index, -1);
  });

  test('18. Traversal: visits nodes from head to tail', () => {
    const ll = new LinkedListEngine([10, 20, 30]);
    const step = ll.traverse();

    assert.equal(step.operation, 'TRAVERSE');
    assert.deepEqual(step.values, [10, 20, 30]);
    assert.equal(step.length, 3);
  });

  test('19. Reverse: correctly reverses list with 0, 1, and multiple nodes', () => {
    // 0 nodes
    const ll0 = new LinkedListEngine();
    assert.deepEqual(ll0.reverse().values, []);

    // 1 node
    const ll1 = new LinkedListEngine([10]);
    assert.deepEqual(ll1.reverse().values, [10]);

    // 3 nodes: [10, 20, 30] -> [30, 20, 10]
    const ll3 = new LinkedListEngine([10, 20, 30]);
    const step = ll3.reverse();
    assert.equal(step.operation, 'REVERSE');
    assert.deepEqual(step.values, [30, 20, 10]);
    assert.equal(step.nodes[0].val, 30);
    assert.equal(step.nodes[2].val, 10);
    assert.equal(step.nodes[2].nextId, null);
  });

  test('20. Clear: empties list and sets head to null', () => {
    const ll = new LinkedListEngine([10, 20]);
    const step = ll.clear();

    assert.equal(step.operation, 'RESET');
    assert.equal(ll.size(), 0);
    assert.equal(ll.headId, null);
    assert.deepEqual(step.values, []);
  });

  test('21. resetSequence: starts a clean sequence without old operations', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    ll.insertTail(20);
    ll.deleteValue(10);
    assert.ok(ll.history.length > 3);

    ll.resetSequence([50, 60]);
    assert.equal(ll.history.length, 1);
    assert.deepEqual(ll.getCurrentStep().values, [50, 60]);
  });

  test('22. Snapshot immutability: past steps retain their original node states', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    const step1Nodes = [...ll.history[1].nodes];

    ll.insertTail(20);
    ll.insertTail(30);

    assert.equal(step1Nodes.length, 1);
    assert.equal(step1Nodes[0].val, 10);
    assert.equal(step1Nodes[0].nextId, null);
  });

  test('23. History branching: rewinding and executing new operation truncates forward states', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    ll.insertTail(20);
    ll.insertTail(30);
    // History: [INIT, INSERT 10, INSERT 20, INSERT 30]

    // Rewind to step 1
    ll.goToStep(1);
    assert.deepEqual(ll.getCurrentStep().values, [10]);

    // Insert 99 -> should prune future steps [20, 30]
    ll.insertHead(99);
    assert.equal(ll.history.length, 3);
    assert.deepEqual(ll.getCurrentStep().values, [99, 10]);
  });
});

// ---------------------------------------------------------------------------
// 2. Playback & Timeline Navigation
// ---------------------------------------------------------------------------

describe('Linked List Playback & Timeline Navigation (Phase 10.3)', () => {

  test('24. getFirstValidStepIndex returns index 1 when initialized empty', () => {
    const ll = new LinkedListEngine();
    assert.equal(ll.getFirstValidStepIndex(), 0);

    ll.insertHead(10);
    assert.equal(ll.getFirstValidStepIndex(), 1);
  });

  test('25. getFirstValidStepIndex returns index 0 when initialized with elements', () => {
    const ll = new LinkedListEngine([10, 20]);
    assert.equal(ll.getFirstValidStepIndex(), 0);
  });

  test('26. Step navigation is bounded correctly (goToStep, prevStep, nextStep)', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    ll.insertTail(20);

    assert.equal(ll.currentHistoryIndex, 2);
    assert.equal(ll.nextStep(), null);

    const prev1 = ll.prevStep();
    assert.deepEqual(prev1.values, [10]);

    const prev0 = ll.prevStep();
    assert.deepEqual(prev0.values, []);

    assert.equal(ll.prevStep(), null);
  });
});

// ---------------------------------------------------------------------------
// 3. Educational Explanation Rules
// ---------------------------------------------------------------------------

describe('Linked List Educational Explanation Rules (Phase 10.3)', () => {

  test('27. Node instantiation: explains dynamic node memory creation', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'Node n1 = new Node(20);\n'
    });
    assert.equal(explanation.category, 'Linked List Node Creation');
    assert.ok(explanation.what.includes('20'));
  });

  test('28. Connect node to head: explains pointing next to head', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'n1.next = head;\n'
    });
    assert.equal(explanation.category, 'Connect Node to Head');
    assert.ok(explanation.what.includes('head'));
  });

  test('29. Update head pointer: explains moving head to new node', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'head = n1;\n'
    });
    assert.equal(explanation.category, 'Update Head Pointer');
    assert.ok(explanation.what.includes('head'));
  });

  test('30. Traversal loop header: explains sequential scan until null', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { curr: { value: null } } },
      sourceCode: 'while (curr != null) {\n'
    });
    assert.equal(explanation.category, 'Linked List Traversal Loop');
    assert.ok(explanation.why.includes('null'));
  });

  test('31. Advance traversal pointer: explains advancing curr = curr.next', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'curr = curr.next;\n'
    });
    assert.equal(explanation.category, 'Advance Traversal Pointer');
    assert.ok(explanation.what.includes('curr.next'));
  });

  test('32. Unlink node deletion: explains curr.next = curr.next.next', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'curr.next = curr.next.next;\n'
    });
    assert.equal(explanation.category, 'Unlink Node (Deletion)');
    assert.ok(explanation.what.includes('curr.next.next'));
  });

  test('33. Reverse pointer link: explains curr.next = prev', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: {} },
      sourceCode: 'curr.next = prev;\n'
    });
    assert.equal(explanation.category, 'Reverse Pointer Link');
    assert.ok(explanation.what.includes('prev'));
  });
});

// ---------------------------------------------------------------------------
// 4. Docker Container Execution Integration (LinkedListDemo.java)
// ---------------------------------------------------------------------------

describe('Linked List Docker Execution Integration (Phase 10.3)', () => {

  test('34. LinkedListDemo.java runs in isolated Docker container and returns genuine JDI trace', async () => {
    assert.ok(fs.existsSync(LINKED_LIST_DEMO_FIXTURE), 'LinkedListDemo.java fixture must exist');
    const javaSource = fs.readFileSync(LINKED_LIST_DEMO_FIXTURE, 'utf-8');

    const result = await runInContainer({
      code: javaSource,
      mainClass: 'LinkedListDemo'
    });

    assert.equal(result.outcome, 'success', `Run failed: ${result.stderr}`);
    assert.ok(result.events && result.events.length > 0, 'Must produce genuine trace events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length >= 20, `Expected at least 20 step events, got ${stepEvents.length}`);

    // Check stdout captures authentic operations
    assert.ok(result.exitEvent, 'Exit event should be present');
    const stdout = result.exitEvent.stdout || '';
    assert.ok(stdout.includes('INSERT HEAD: 20'), 'Output must contain INSERT HEAD: 20');
    assert.ok(stdout.includes('INSERT HEAD: 10'), 'Output must contain INSERT HEAD: 10');
    assert.ok(stdout.includes('INSERT TAIL: 30'), 'Output must contain INSERT TAIL: 30');
    assert.ok(stdout.includes('SEARCH: 20 found=true at index 1'), 'Output must contain SEARCH match');
    assert.ok(stdout.includes('DELETED: 20'), 'Output must contain DELETED: 20');
    assert.ok(stdout.includes('REVERSED: 30 -> 10 -> NULL'), 'Output must contain REVERSED chain');
    assert.ok(stdout.includes('Linked list operations completed successfully.'), 'Output must confirm success');
  });

  test('35. Compilation errors are captured and reported honestly', async () => {
    const brokenCode = `public class BrokenList {
      public static void main(String[] args) {
        Node n = "invalid";
      }
    }`;

    const result = await runInContainer({
      code: brokenCode,
      mainClass: 'BrokenList'
    });

    assert.equal(result.outcome, 'compilation_error');
    assert.ok(result.errorEvent, 'Error event must be present');
    assert.equal(result.errorEvent.errorType, 'compilation_error');
    assert.ok(result.errorEvent.message);
  });
});

// ---------------------------------------------------------------------------
// 5. Full Regression Protection for Stack, Queue & Core Algorithms
// ---------------------------------------------------------------------------

describe('Regression Protection for Stack, Queue & Core Algorithms (Phase 10.3)', () => {

  test('36. Stack Visualizer remains fully functional', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    assert.equal(stack.peek().operand, 20);
    assert.equal(stack.pop().operand, 20);
    assert.equal(stack.pop().operand, 10);
    assert.equal(stack.pop().isUnderflow, true);
  });

  test('37. Queue Visualizer remains fully functional', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    assert.equal(queue.peek().operand, 10);
    assert.equal(queue.dequeue().operand, 10);
    assert.equal(queue.dequeue().operand, 20);
    assert.equal(queue.dequeue().isUnderflow, true);
  });

  test('38. Sorting and searching algorithms remain functional', () => {
    const arr = [64, 34, 25, 12, 22];

    const bubbleSteps = generateBubbleSortSteps(arr);
    assert.deepEqual(bubbleSteps[bubbleSteps.length - 1].array, [12, 22, 25, 34, 64]);

    const selectionSteps = generateSelectionSortSteps(arr);
    assert.deepEqual(selectionSteps[selectionSteps.length - 1].array, [12, 22, 25, 34, 64]);

    const insertionSteps = generateInsertionSortSteps(arr);
    assert.deepEqual(insertionSteps[insertionSteps.length - 1].array, [12, 22, 25, 34, 64]);

    const linearSteps = generateLinearSearchSteps(arr, 25);
    const linearMatch = linearSteps.find(s => s.foundIndex !== null);
    assert.equal(linearMatch.foundIndex, 2);

    const binarySteps = generateBinarySearchSteps([12, 22, 25, 34, 64], 25);
    const binaryMatch = binarySteps.find(s => s.foundIndex !== null);
    assert.equal(binaryMatch.foundIndex, 2);
  });
});
