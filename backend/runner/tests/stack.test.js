// =============================================================================
// ALGOLAB — Stack Data Structure Tests (Phase 10.1)
//
// Automated test suite for Stack Visualizer engine, educational explanation
// rules, Docker-based genuine Java execution, and regression protection.
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { StackEngine } from '../../../frontend/js/stack.js';
import { generateStepExplanation } from '../../../frontend/js/explanation-engine.js';
import { runInContainer } from '../docker-runner.js';
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
const STACK_DEMO_FIXTURE = path.resolve(FIXTURES_DIR, 'StackDemo.java');

// ---------------------------------------------------------------------------
// 1. Stack Engine Logic & State Transitions
// ---------------------------------------------------------------------------

describe('Stack Data Structure Engine & Logic (Phase 10.1)', () => {

  test('1. Stack initial state: starts empty with size 0 and top -1', () => {
    const stack = new StackEngine();
    assert.equal(stack.elements.length, 0);
    assert.equal(stack.history.length, 1);

    const initialStep = stack.getCurrentStep();
    assert.equal(initialStep.operation, 'INITIAL');
    assert.equal(initialStep.currentTop, -1);
    assert.equal(initialStep.isUnderflow, false);
    assert.deepEqual(initialStep.resultingElements, []);
  });

  test('2. Push operation: pushes element, updates top pointer, and increments size', () => {
    const stack = new StackEngine();
    const step = stack.push(42);

    assert.equal(stack.elements.length, 1);
    assert.equal(stack.elements[0], 42);
    assert.equal(step.operation, 'PUSH');
    assert.equal(step.operand, 42);
    assert.equal(step.prevTop, -1);
    assert.equal(step.currentTop, 0);
    assert.deepEqual(step.resultingElements, [42]);
    assert.equal(step.isUnderflow, false);
  });

  test('3. Multiple pushes: elements stack vertically in LIFO order', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    const step3 = stack.push(30);

    assert.equal(stack.elements.length, 3);
    assert.deepEqual(stack.elements, [10, 20, 30]);
    assert.equal(step3.currentTop, 2);
    assert.equal(step3.operand, 30);
  });

  test('4. Peek operation: inspects top element without mutating stack size or contents', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);

    const step = stack.peek();
    assert.equal(step.operation, 'PEEK');
    assert.equal(step.operand, 20);
    assert.equal(step.currentTop, 1);
    assert.equal(step.isUnderflow, false);

    // Verify stack was NOT modified
    assert.equal(stack.elements.length, 2);
    assert.deepEqual(stack.elements, [10, 20]);
  });

  test('5. Pop operation: removes top element in strict LIFO order', () => {
    const stack = new StackEngine();
    stack.push(100);
    stack.push(200);

    const pop1 = stack.pop();
    assert.equal(pop1.operation, 'POP');
    assert.equal(pop1.operand, 200);
    assert.equal(pop1.currentTop, 0);
    assert.deepEqual(stack.elements, [100]);

    const pop2 = stack.pop();
    assert.equal(pop2.operation, 'POP');
    assert.equal(pop2.operand, 100);
    assert.equal(pop2.currentTop, -1);
    assert.deepEqual(stack.elements, []);
  });

  test('6. Pop Underflow: popping empty stack triggers underflow without crash', () => {
    const stack = new StackEngine();
    const underflowStep = stack.pop();

    assert.equal(underflowStep.operation, 'POP_UNDERFLOW');
    assert.equal(underflowStep.isUnderflow, true);
    assert.equal(underflowStep.currentTop, -1);
    assert.ok(underflowStep.message.toLowerCase().includes('underflow'));
    assert.equal(stack.elements.length, 0);
  });

  test('7. Peek Underflow: peeking empty stack triggers underflow without crash', () => {
    const stack = new StackEngine();
    const underflowStep = stack.peek();

    assert.equal(underflowStep.operation, 'PEEK_UNDERFLOW');
    assert.equal(underflowStep.isUnderflow, true);
    assert.equal(underflowStep.currentTop, -1);
    assert.ok(underflowStep.message.toLowerCase().includes('underflow'));
  });

  test('8. Reset / Clear: completely empties stack and records reset step', () => {
    const stack = new StackEngine();
    stack.push(1);
    stack.push(2);
    stack.push(3);

    const resetStep = stack.clear();
    assert.equal(resetStep.operation, 'RESET');
    assert.equal(stack.elements.length, 0);
    assert.equal(resetStep.currentTop, -1);
    assert.deepEqual(resetStep.resultingElements, []);
  });

  test('9. Duplicate values: preserves all occurrences and pops in exact LIFO order', () => {
    const stack = new StackEngine();
    stack.push(15);
    stack.push(15);
    stack.push(15);

    assert.equal(stack.elements.length, 3);
    assert.deepEqual(stack.elements, [15, 15, 15]);

    const popped = stack.pop();
    assert.equal(popped.operand, 15);
    assert.equal(stack.elements.length, 2);
  });

  test('10. Negative numbers and zero values: handled correctly without corruption', () => {
    const stack = new StackEngine();
    stack.push(-5);
    stack.push(0);
    stack.push(-42);

    assert.deepEqual(stack.elements, [-5, 0, -42]);
    const peeked = stack.peek();
    assert.equal(peeked.operand, -42);

    const popped = stack.pop();
    assert.equal(popped.operand, -42);
    assert.deepEqual(stack.elements, [-5, 0]);
  });

  test('11. Input validation: non-numeric inputs are rejected with descriptive error', () => {
    const stack = new StackEngine();
    assert.throws(() => stack.push(NaN), /Push requires a valid numeric value/);
    assert.throws(() => stack.push(undefined), /Push requires a valid numeric value/);
    assert.throws(() => stack.push('invalid'), /Push requires a valid numeric value/);
  });

  test('12. History timeline immutability and step navigation', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    assert.equal(stack.history.length, 4); // initial + 3 pushes

    // Step backward
    const prev = stack.prevStep();
    assert.equal(prev.operand, 20);
    assert.deepEqual(stack.elements, [10, 20]);

    // Step backward again
    const prev2 = stack.prevStep();
    assert.equal(prev2.operand, 10);
    assert.deepEqual(stack.elements, [10]);

    // Step forward
    const next = stack.nextStep();
    assert.equal(next.operand, 20);
    assert.deepEqual(stack.elements, [10, 20]);
  });
});

// ---------------------------------------------------------------------------
// 2. Educational Step Explanation Rules
// ---------------------------------------------------------------------------

describe('Stack Educational Explanation Rules (Phase 10.1)', () => {

  test('13. Stack pointer initialization (int top = -1;): explains empty stack sentinel', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: -1 } } },
      sourceCode: 'int top = -1;\n'
    });
    assert.equal(explanation.category, 'Stack Initialization (Top Pointer)');
    assert.ok(explanation.what.includes('top = -1'));
  });

  test('14. Stack pointer increment (top++;): explains advancing top pointer', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: 0 } } },
      sourceCode: 'top++;\n'
    });
    assert.equal(explanation.category, 'Stack Pointer Increment');
    assert.ok(explanation.what.includes('Advancing top pointer'));
  });

  test('15. Stack pointer decrement (top--;): explains retreating top pointer', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: 1 } } },
      sourceCode: 'top--;\n'
    });
    assert.equal(explanation.category, 'Stack Pointer Decrement');
    assert.ok(explanation.what.includes('Decrementing top pointer'));
  });

  test('16. Stack push assignment (stack[top] = val;): explains element assignment', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: 0 } } },
      sourceCode: 'stack[top] = 10;\n'
    });
    assert.equal(explanation.category, 'Stack Push (Element Assignment)');
    assert.ok(explanation.what.includes('stack at top index'));
  });

  test('17. Stack peek read (int peeked = stack[top];): explains non-mutating query', () => {
    const explanation = generateStepExplanation({
      step: {
        line: 1,
        variables: { top: { value: 1 } },
        arrays: { stack: { type: 'int[]', length: 5, values: [10, 20, 0, 0, 0] } }
      },
      sourceCode: 'int peeked = stack[top];\n'
    });
    assert.equal(explanation.category, 'Stack Peek (Inspect Top)');
    assert.ok(explanation.why.includes('without altering'));
  });

  test('18. Stack pop read (int popped1 = stack[top];): explains LIFO element retrieval', () => {
    const explanation = generateStepExplanation({
      step: {
        line: 1,
        variables: { top: { value: 1 } },
        arrays: { stack: { type: 'int[]', length: 5, values: [10, 20, 0, 0, 0] } }
      },
      sourceCode: 'int popped1 = stack[top];\n'
    });
    assert.equal(explanation.category, 'Stack Pop (Retrieve Top)');
    assert.ok(explanation.what.includes('Retrieving top element'));
  });

  test('19. Empty stack check (if (top == -1)): explains underflow protection', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: -1 } } },
      sourceCode: 'if (top == -1) {\n'
    });
    assert.equal(explanation.category, 'Empty Stack Check (Underflow Protection)');
    assert.ok(explanation.what.includes('TRUE'));
  });

  test('20. Stack draining loop (while (top >= 0)): explains LIFO drain until empty', () => {
    const explanation = generateStepExplanation({
      step: { line: 1, variables: { top: { value: 2 } } },
      sourceCode: 'while (top >= 0) {\n'
    });
    assert.equal(explanation.category, 'Stack Draining Loop');
    assert.ok(explanation.what.includes('top >= 0'));
  });
});

// ---------------------------------------------------------------------------
// 3. Docker Container Execution Integration
// ---------------------------------------------------------------------------

describe('Stack Docker Execution Integration (Phase 10.1)', () => {

  test('21. Stack Java code runs in isolated Docker container and returns genuine JDI trace', { timeout: 35_000 }, async () => {
    assert.ok(fs.existsSync(STACK_DEMO_FIXTURE), 'StackDemo.java fixture must exist');
    const javaSource = fs.readFileSync(STACK_DEMO_FIXTURE, 'utf-8');

    const result = await runInContainer({
      code: javaSource,
      mainClass: 'StackDemo',
      limits: { timeoutMs: 25_000 }
    });

    assert.equal(result.outcome, 'success', `Run failed: ${result.stderr}`);
    assert.ok(result.events && result.events.length > 0, 'Must produce genuine trace events');

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length >= 15, `Expected at least 15 step events, got ${stepEvents.length}`);

    // Check variable captures
    const stepsWithTop = stepEvents.filter(e => e.variables && e.variables.top !== undefined);
    assert.ok(stepsWithTop.length > 0, 'Should capture local variable top');

    // Check array captures
    const stepsWithStack = stepEvents.filter(e => e.arrays && e.arrays.stack !== undefined);
    assert.ok(stepsWithStack.length > 0, 'Should capture array stack');

    // Check program stdout
    assert.ok(result.exitEvent, 'Exit event should be present');
    const stdout = result.exitEvent.stdout || '';
    assert.ok(stdout.includes('Underflow: Stack is empty'), 'Output must contain underflow notice');
    assert.ok(stdout.includes('PUSH: 10'), 'Output must contain PUSH 10');
    assert.ok(stdout.includes('PEEK: 30'), 'Output must contain PEEK 30');
    assert.ok(stdout.includes('POP: 30'), 'Output must contain POP 30');
    assert.ok(stdout.includes('PUSH: -42'), 'Output must contain negative push PUSH -42');
    assert.ok(stdout.includes('Stack operations completed successfully'), 'Output must show completion');
  });
});

// ---------------------------------------------------------------------------
// 4. Regression Protection for Existing Algorithms
// ---------------------------------------------------------------------------

describe('Regression Protection for Core Array Algorithms (Phase 10.1)', () => {

  test('22. Core sorting and searching algorithms remain functional', () => {
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
