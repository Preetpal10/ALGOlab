// =============================================================================
// ALGOLAB — Queue Data Structure Tests (Phase 10.2)
//
// Automated test suite for Queue Visualizer engine, educational explanation
// rules, Docker-based genuine Java execution, and regression protection.
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { QueueEngine } from '../../../frontend/js/queue.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const QUEUE_DEMO_FIXTURE = path.resolve(FIXTURES_DIR, 'QueueDemo.java');

// ---------------------------------------------------------------------------
// 1. Queue Engine Logic & State Transitions (FIFO)
// ---------------------------------------------------------------------------

describe('Queue Data Structure Engine & Logic (Phase 10.2)', () => {

  test('1. Queue initial state: starts empty with size 0, front null, rear null', () => {
    const queue = new QueueEngine();
    assert.equal(queue.elements.length, 0);
    assert.equal(queue.history.length, 1);

    const initialStep = queue.getCurrentStep();
    assert.equal(initialStep.operation, 'INITIAL');
    assert.equal(initialStep.front, -1);
    assert.equal(initialStep.rear, -1);
    assert.equal(initialStep.isUnderflow, false);
    assert.deepEqual(initialStep.resultingElements, []);
  });

  test('2. Enqueue one element: size becomes 1, front and rear point to index 0', () => {
    const queue = new QueueEngine();
    const step = queue.enqueue(10);

    assert.equal(queue.elements.length, 1);
    assert.equal(queue.elements[0], 10);
    assert.equal(step.operation, 'ENQUEUE');
    assert.equal(step.operand, 10);
    assert.equal(step.front, 0);
    assert.equal(step.rear, 0);
    assert.deepEqual(step.resultingElements, [10]);
    assert.equal(step.isUnderflow, false);
  });

  test('3. Enqueue multiple elements: maintains insertion order at rear', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    const step3 = queue.enqueue(30);

    assert.equal(queue.elements.length, 3);
    assert.deepEqual(queue.elements, [10, 20, 30]);
    assert.equal(step3.front, 0);
    assert.equal(step3.rear, 2);
    assert.equal(step3.resultingElements[0], 10); // Front element
    assert.equal(step3.resultingElements[2], 30); // Rear element
  });

  test('4. FIFO ordering: dequeue removes the first element that was enqueued', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    queue.enqueue(30);

    const stepPop = queue.dequeue();
    assert.equal(stepPop.operation, 'DEQUEUE');
    assert.equal(stepPop.operand, 10); // 10 was first in, so 10 must be first out
    assert.deepEqual(queue.elements, [20, 30]);
    assert.equal(stepPop.front, 0);
    assert.equal(stepPop.rear, 1);
    assert.equal(stepPop.isUnderflow, false);

    const stepPop2 = queue.dequeue();
    assert.equal(stepPop2.operand, 20);
    assert.deepEqual(queue.elements, [30]);
    assert.equal(stepPop2.front, 0);
    assert.equal(stepPop2.rear, 0);
  });

  test('5. Peek operation: inspects front element without modifying the queue', () => {
    const queue = new QueueEngine();
    queue.enqueue(42);
    queue.enqueue(99);

    const initialLen = queue.elements.length;
    const peekStep = queue.peek();

    assert.equal(peekStep.operation, 'PEEK');
    assert.equal(peekStep.operand, 42); // Front element
    assert.equal(queue.elements.length, initialLen);
    assert.deepEqual(queue.elements, [42, 99]);
    assert.equal(peekStep.isUnderflow, false);
  });

  test('6. Empty-queue detection: isEmpty returns true when empty and false when populated', () => {
    const queue = new QueueEngine();
    assert.equal(queue.isEmpty(), true);

    queue.enqueue(100);
    assert.equal(queue.isEmpty(), false);

    queue.dequeue();
    assert.equal(queue.isEmpty(), true);
  });

  test('7. Size calculation: accurately reflects element count across operations', () => {
    const queue = new QueueEngine();
    assert.equal(queue.size(), 0);

    queue.enqueue(1);
    queue.enqueue(2);
    assert.equal(queue.size(), 2);

    queue.peek();
    assert.equal(queue.size(), 2);

    queue.dequeue();
    assert.equal(queue.size(), 1);

    queue.dequeue();
    assert.equal(queue.size(), 0);
  });

  test('8. Dequeue underflow: dequeueing empty queue triggers underflow gracefully', () => {
    const queue = new QueueEngine();
    const underflowStep = queue.dequeue();

    assert.ok(underflowStep.operation.includes('UNDERFLOW'));
    assert.equal(underflowStep.isUnderflow, true);
    assert.equal(underflowStep.operand, null);
    assert.equal(queue.elements.length, 0);
    assert.ok(underflowStep.message.toLowerCase().includes('empty'));
  });

  test('9. Peek underflow: peeking empty queue triggers underflow gracefully', () => {
    const queue = new QueueEngine();
    const underflowStep = queue.peek();

    assert.ok(underflowStep.operation.includes('UNDERFLOW'));
    assert.equal(underflowStep.isUnderflow, true);
    assert.equal(underflowStep.operand, null);
    assert.equal(queue.elements.length, 0);
  });

  test('10. Front and Rear behavior for a single-element queue', () => {
    const queue = new QueueEngine();
    queue.enqueue(77);

    const step = queue.getCurrentStep();
    assert.equal(step.front, 0);
    assert.equal(step.rear, 0);
    assert.equal(step.resultingElements.length, 1);
  });

  test('11. Front and Rear behavior across alternating enqueues and dequeues', () => {
    const queue = new QueueEngine();
    // [10]
    queue.enqueue(10);
    // [10, 20]
    queue.enqueue(20);
    // [20]
    queue.dequeue();
    // [20, 30]
    queue.enqueue(30);
    // [20, 30, 40]
    queue.enqueue(40);
    // [30, 40]
    queue.dequeue();

    assert.deepEqual(queue.elements, [30, 40]);
    assert.equal(queue.elements[0], 30); // front
    assert.equal(queue.elements[1], 40); // rear
    const curStep = queue.getCurrentStep();
    assert.equal(curStep.front, 0);
    assert.equal(curStep.rear, 1);
  });

  test('12. Clear resets the logical queue to empty', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    assert.equal(queue.size(), 2);

    const clearStep = queue.clear();
    assert.equal(clearStep.operation, 'RESET');
    assert.equal(queue.size(), 0);
    assert.equal(clearStep.front, -1);
    assert.equal(clearStep.rear, -1);
  });

  test('13. resetSequence starts a clean history without old operations', () => {
    const queue = new QueueEngine();
    queue.enqueue(1);
    queue.enqueue(2);
    queue.dequeue();
    assert.ok(queue.history.length > 3);

    // Reset sequence with fresh scenario
    queue.resetSequence([50, 60]);
    assert.equal(queue.history.length, 1);
    assert.deepEqual(queue.elements, [50, 60]);
    assert.equal(queue.getCurrentStep().front, 0);
    assert.equal(queue.getCurrentStep().rear, 1);
  });

  test('14. Input validation rejects invalid values gracefully', () => {
    const queue = new QueueEngine();
    assert.throws(() => queue.enqueue('abc'), /numeric/i);
    assert.throws(() => queue.enqueue(NaN), /numeric/i);
    assert.throws(() => queue.enqueue(undefined), /numeric/i);
  });

  test('15. Negative numbers and zero values are supported', () => {
    const queue = new QueueEngine();
    queue.enqueue(0);
    queue.enqueue(-15);
    queue.enqueue(100);

    assert.deepEqual(queue.elements, [0, -15, 100]);
    assert.equal(queue.dequeue().operand, 0);
    assert.equal(queue.dequeue().operand, -15);
    assert.equal(queue.dequeue().operand, 100);
  });
});

// ---------------------------------------------------------------------------
// 2. Queue Playback & Timeline Management
// ---------------------------------------------------------------------------

describe('Queue Playback and Timeline Management (Phase 10.2)', () => {

  test('16. Initial state and first valid playback frame agree', () => {
    const queue = new QueueEngine();
    // When initialized empty, firstValidStepIndex should be 0 if no operations, or 1 once ops exist
    assert.equal(queue.getFirstValidStepIndex(), 0);

    queue.enqueue(10);
    queue.enqueue(20);
    // Now that operations exist, first operational frame is index 1
    assert.equal(queue.getFirstValidStepIndex(), 1);
    const firstOp = queue.history[1];
    assert.equal(firstOp.operation, 'ENQUEUE');
    assert.equal(firstOp.operand, 10);
  });

  test('17. If initialized with elements, firstValidStepIndex is 0', () => {
    const queue = new QueueEngine([10, 20]);
    assert.equal(queue.getFirstValidStepIndex(), 0);
  });

  test('18. Step navigation is bounded correctly (goToStep, prevStep, nextStep)', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    queue.enqueue(30);

    // History: [INITIAL, ENQUEUE 10, ENQUEUE 20, ENQUEUE 30]
    assert.equal(queue.history.length, 4);
    assert.equal(queue.currentHistoryIndex, 3);

    // Stepping next beyond history returns null
    assert.equal(queue.nextStep(), null);

    // Stepping backwards
    const step2 = queue.prevStep();
    assert.equal(step2.operand, 20);
    assert.deepEqual(queue.elements, [10, 20]);

    const step1 = queue.prevStep();
    assert.equal(step1.operand, 10);
    assert.deepEqual(queue.elements, [10]);

    const step0 = queue.prevStep();
    assert.equal(step0.operation, 'INITIAL');
    assert.deepEqual(queue.elements, []);

    // Stepping prev before start returns null
    assert.equal(queue.prevStep(), null);
  });

  test('19. Forward history is cleanly truncated when a new operation occurs after rewinding', () => {
    const queue = new QueueEngine();
    queue.enqueue(10);
    queue.enqueue(20);
    queue.enqueue(30);
    // History: [INIT, ENQ 10, ENQ 20, ENQ 30]

    // Rewind back to step 1 (after ENQ 10)
    queue.goToStep(1);
    assert.deepEqual(queue.elements, [10]);

    // Enqueue 99 - should prune future steps [ENQ 20, ENQ 30]
    queue.enqueue(99);
    assert.equal(queue.history.length, 3);
    assert.equal(queue.history[2].operand, 99);
    assert.deepEqual(queue.elements, [10, 99]);
  });
});

// ---------------------------------------------------------------------------
// 3. Queue Educational Explanation Rules
// ---------------------------------------------------------------------------

describe('Queue Educational Explanation Rules (Phase 10.2)', () => {

  test('20. Queue pointer initialization (int front = 0; int rear = -1;): explains FIFO pointers', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { front: { value: 0 }, rear: { value: -1 } } },
      sourceCode: 'int front = 0; int rear = -1;\n'
    });
    assert.equal(explanation.category, 'Queue Initialization');
    assert.ok(explanation.what.includes('front'));
    assert.ok(explanation.why.includes('FIFO'));
  });

  test('21. Queue rear increment (rear++;): explains preparing rear index for insertion', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { rear: { value: 0 } } },
      sourceCode: 'rear++;\n'
    });
    assert.equal(explanation.category, 'Queue Rear Pointer Increment');
    assert.ok(explanation.what.includes('rear pointer'));
  });

  test('22. Queue enqueue assignment (queue[rear] = val;): explains element insertion at rear', () => {
    const explanation = generateStepExplanation({
      step: {
        line: 1,
        variables: { rear: { value: 0 }, val: { value: 10 } },
        arrays: { queue: { type: 'int[]', length: 5, values: [10, 0, 0, 0, 0] } }
      },
      sourceCode: 'queue[rear] = 10;\n'
    });
    assert.equal(explanation.category, 'Queue Enqueue (Element Placement)');
    assert.ok(explanation.what.includes('rear of the queue'));
  });

  test('23. Queue peek read (int peeked = queue[front];): explains inspecting front element', () => {
    const explanation = generateStepExplanation({
      step: {
        line: 1,
        variables: { front: { value: 0 } },
        arrays: { queue: { type: 'int[]', length: 5, values: [10, 20, 0, 0, 0] } }
      },
      sourceCode: 'int peeked = queue[front];\n'
    });
    assert.equal(explanation.category, 'Queue Peek (Inspect Front)');
    assert.ok(explanation.why.includes('without removing'));
  });

  test('24. Queue dequeue read (int dequeued = queue[front];): explains FIFO element removal', () => {
    const explanation = generateStepExplanation({
      step: {
        line: 1,
        variables: { front: { value: 0 } },
        arrays: { queue: { type: 'int[]', length: 5, values: [10, 20, 0, 0, 0] } }
      },
      sourceCode: 'int dequeued1 = queue[front];\n'
    });
    assert.equal(explanation.category, 'Queue Dequeue (Retrieve Front)');
    assert.ok(explanation.what.includes('front element'));
  });

  test('25. Empty queue check (if (size == 0)): explains underflow protection', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { size: { value: 0 } } },
      sourceCode: 'if (size == 0) {\n'
    });
    assert.equal(explanation.category, 'Empty Queue Check (Underflow Protection)');
    assert.ok(explanation.what.includes('TRUE'));
  });

  test('26. Queue draining loop (while (size > 0)): explains FIFO drain until empty', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { size: { value: 3 } } },
      sourceCode: 'while (size > 0) {\n'
    });
    assert.equal(explanation.category, 'Queue Draining Loop');
    assert.ok(explanation.what.includes('size > 0'));
  });
});

// ---------------------------------------------------------------------------
// 4. Docker Container Execution Integration (QueueDemo.java)
// ---------------------------------------------------------------------------

describe('Queue Docker Execution Integration (Phase 10.2)', () => {

  test('27. Queue Java code runs in isolated Docker container and returns genuine JDI trace', async () => {
    assert.ok(fs.existsSync(QUEUE_DEMO_FIXTURE), 'QueueDemo.java fixture must exist');
    const javaSource = fs.readFileSync(QUEUE_DEMO_FIXTURE, 'utf-8');

    const result = await runInContainer({
      code: javaSource,
      mainClass: 'QueueDemo'
    });

    assert.equal(result.outcome, 'success', `Run failed: ${result.stderr}`);
    assert.ok(result.events && result.events.length > 0, 'Must produce genuine trace events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length >= 15, `Expected at least 15 step events, got ${stepEvents.length}`);

    // Check variable captures: front, rear, size
    const stepsWithFront = stepEvents.filter(e => e.variables && e.variables.front !== undefined);
    assert.ok(stepsWithFront.length > 0, 'Should capture local variable front');

    const stepsWithRear = stepEvents.filter(e => e.variables && e.variables.rear !== undefined);
    assert.ok(stepsWithRear.length > 0, 'Should capture local variable rear');

    const stepsWithSize = stepEvents.filter(e => e.variables && e.variables.size !== undefined);
    assert.ok(stepsWithSize.length > 0, 'Should capture local variable size');

    // Check array captures: queue
    const stepsWithQueue = stepEvents.filter(e => e.arrays && e.arrays.queue !== undefined);
    assert.ok(stepsWithQueue.length > 0, 'Should capture array queue');

    // Check program stdout
    assert.ok(result.exitEvent, 'Exit event should be present');
    const stdout = result.exitEvent.stdout || '';
    assert.ok(stdout.includes('Underflow: Queue is empty'), 'Output must contain underflow notice');
    assert.ok(stdout.includes('ENQUEUE: 10'), 'Output must contain ENQUEUE 10');
    assert.ok(stdout.includes('ENQUEUE: 20'), 'Output must contain ENQUEUE 20');
    assert.ok(stdout.includes('ENQUEUE: 30'), 'Output must contain ENQUEUE 30');
    assert.ok(stdout.includes('PEEK: 10'), 'Output must contain PEEK 10');
    assert.ok(stdout.includes('DEQUEUE: 10'), 'Output must contain DEQUEUE 10');
    assert.ok(stdout.includes('ENQUEUE: 42'), 'Output must contain ENQUEUE 42');
    assert.ok(stdout.includes('Queue operations completed successfully'), 'Output must show completion');
  });

  test('28. Compilation errors are captured and reported honestly', async () => {
    const brokenCode = `public class BrokenQueue {
      public static void main(String[] args) {
        int x = "incompatible types";
      }
    }`;

    const result = await runInContainer({
      code: brokenCode,
      mainClass: 'BrokenQueue'
    });

    assert.equal(result.outcome, 'compilation_error');
    assert.ok(result.errorEvent, 'Error event must be present');
    assert.equal(result.errorEvent.errorType, 'compilation_error');
    assert.ok(result.errorEvent.message);
  });
});

// ---------------------------------------------------------------------------
// 5. Full Regression Protection for Prior Algorithms & Stack
// ---------------------------------------------------------------------------

describe('Regression Protection for Core Array Algorithms & Stack (Phase 10.2)', () => {

  test('29. Stack Visualizer remains fully functional', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    assert.equal(stack.peek().operand, 20);
    assert.equal(stack.pop().operand, 20);
    assert.equal(stack.pop().operand, 10);
    assert.equal(stack.pop().isUnderflow, true);
  });

  test('30. Sorting and searching algorithms remain functional', () => {
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
