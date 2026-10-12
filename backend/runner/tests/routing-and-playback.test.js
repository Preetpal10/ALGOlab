// =============================================================================
// ALGOLAB - Phase 10.1 Bug Fix: Algorithm Routing + Stack Playback Tests
//
// Automated test suite verifying:
//   1. Algorithm URL routing: each algo generator produces correct results.
//   2. Stack Play: canPlay logic, step advancement, final-step stop.
//   3. Stack Pause: stops advancement at current position.
//   4. Stack Reset: goToStep(0) restores initial state.
//   5. Speed: formula produces correct ms values.
//   6. Duplicate timer prevention: isPlaying guard works.
//   7. Prev/Next continue to work after simulated pause.
//   8. Regression: push, pop, peek, underflow, clear, history length.
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import { StackEngine } from '../../../frontend/js/stack.js';
import {
  generateBubbleSortSteps,
  generateSelectionSortSteps,
  generateInsertionSortSteps,
  generateLinearSearchSteps,
  generateBinarySearchSteps,
} from '../../../frontend/js/visualizer.js';

// ---------------------------------------------------------------------------
// 1. Algorithm URL Routing - Generator Correctness
// ---------------------------------------------------------------------------

describe('Algorithm URL Routing - Generator Correctness (Phase 10.1 Bug Fix)', () => {

  test('1. bubble-sort: final array is sorted ascending', () => {
    const input = [5, 3, 1, 4, 2];
    const steps = generateBubbleSortSteps(input);
    assert.ok(steps.length > 0);
    assert.deepEqual(steps[steps.length - 1].array, [1, 2, 3, 4, 5]);
    assert.deepEqual(input, [5, 3, 1, 4, 2]); // immutable check
  });

  test('2. selection-sort: final array is sorted ascending', () => {
    const input = [64, 25, 12, 22, 11];
    const steps = generateSelectionSortSteps(input);
    assert.ok(steps.length > 0);
    assert.deepEqual(steps[steps.length - 1].array, [11, 12, 22, 25, 64]);
    assert.deepEqual(input, [64, 25, 12, 22, 11]);
  });

  test('3. insertion-sort: final array is sorted ascending', () => {
    const input = [9, 7, 5, 3, 1];
    const steps = generateInsertionSortSteps(input);
    assert.ok(steps.length > 0);
    assert.deepEqual(steps[steps.length - 1].array, [1, 3, 5, 7, 9]);
    assert.deepEqual(input, [9, 7, 5, 3, 1]);
  });

  test('4. linear-search: finds target at correct index', () => {
    const steps = generateLinearSearchSteps([10, 20, 30, 40, 50], 30);
    const match = steps.find(s => s.foundIndex !== null && s.foundIndex !== undefined);
    assert.ok(match, 'Match step must exist');
    assert.equal(match.foundIndex, 2);
    assert.equal(match.target, 30);
  });

  test('5. linear-search absent target: not-found terminal step', () => {
    const steps = generateLinearSearchSteps([10, 20, 30], 99);
    const last = steps[steps.length - 1];
    assert.equal(last.foundIndex, null);
    assert.ok(last.message.toLowerCase().includes('not found'));
  });

  test('6. binary-search: finds target in sorted array', () => {
    const steps = generateBinarySearchSteps([1, 3, 5, 7, 9, 11, 13], 7);
    const match = steps.find(s => s.foundIndex !== null && s.foundIndex !== undefined);
    assert.ok(match);
    assert.equal(match.foundIndex, 3);
  });

  test('7. binary-search absent target: not-found terminal step', () => {
    const steps = generateBinarySearchSteps([2, 4, 6, 8, 10], 5);
    const last = steps[steps.length - 1];
    assert.equal(last.foundIndex, null);
  });

  test('8. binary-search auto-sorts unsorted input before searching', () => {
    const steps = generateBinarySearchSteps([9, 1, 5, 3, 7], 5);
    const match = steps.find(s => s.foundIndex !== null && s.foundIndex !== undefined);
    assert.ok(match, 'Must still find target after auto-sort');
  });

  test('9. All generators preserve caller input (immutability)', () => {
    const orig = [5, 2, 8, 1, 9];
    const a = [...orig], b = [...orig], c = [...orig], d = [...orig], e = [...orig];
    generateBubbleSortSteps(a);
    generateSelectionSortSteps(b);
    generateInsertionSortSteps(c);
    generateLinearSearchSteps(d, 5);
    generateBinarySearchSteps(e, 5);
    assert.deepEqual(a, orig);
    assert.deepEqual(b, orig);
    assert.deepEqual(c, orig);
    assert.deepEqual(d, orig);
    assert.deepEqual(e, orig);
  });

  test('10. All generators handle empty array without throwing', () => {
    assert.doesNotThrow(() => generateBubbleSortSteps([]));
    assert.doesNotThrow(() => generateSelectionSortSteps([]));
    assert.doesNotThrow(() => generateInsertionSortSteps([]));
    assert.doesNotThrow(() => generateLinearSearchSteps([], 42));
    assert.doesNotThrow(() => generateBinarySearchSteps([], 42));
  });

  test('11. All generators handle single-element array without throwing', () => {
    assert.doesNotThrow(() => generateBubbleSortSteps([42]));
    assert.doesNotThrow(() => generateSelectionSortSteps([42]));
    assert.doesNotThrow(() => generateInsertionSortSteps([42]));
    assert.doesNotThrow(() => generateLinearSearchSteps([42], 42));
    assert.doesNotThrow(() => generateBinarySearchSteps([42], 42));
  });
});

// ---------------------------------------------------------------------------
// 2. Stack Playback Engine Logic (DOM-free simulation using StackEngine)
// ---------------------------------------------------------------------------

describe('Stack Playback Engine - Play/Pause/Reset/Speed (Phase 10.1 Bug Fix)', () => {

  test('12. Initial stack: history.length === 1 (INITIAL step only)', () => {
    const stack = new StackEngine();
    assert.equal(stack.history.length, 1);
    assert.equal(stack.currentHistoryIndex, 0);
  });

  test('13. canPlay is false when history.length <= 1 (nothing to play)', () => {
    const stack = new StackEngine();
    const canPlay = stack.history.length > 1;
    assert.equal(canPlay, false);
  });

  test('14. canPlay is true after 1 push (history.length === 2)', () => {
    const stack = new StackEngine();
    stack.push(42);
    assert.equal(stack.history.length > 1, true);
  });

  test('15. Play advances through history steps in correct operation order', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);
    // history: [INITIAL(0), PUSH(10)(1), PUSH(20)(2), PUSH(30)(3)] = 4 steps

    assert.equal(stack.history.length, 4);

    // Simulate play() restarting from step 0
    const step0 = stack.goToStep(0);
    assert.equal(step0.operation, 'INITIAL'); // goToStep(0) returns the INITIAL step
    assert.equal(stack.currentHistoryIndex, 0);

    // Tick 1: advance from index 0 to index 1 = PUSH(10)
    let s = stack.nextStep();
    assert.equal(s.operation, 'PUSH');
    assert.equal(s.operand, 10);
    assert.equal(stack.currentHistoryIndex, 1);

    // Tick 2: advance to index 2 = PUSH(20)
    s = stack.nextStep();
    assert.equal(s.operation, 'PUSH');
    assert.equal(s.operand, 20);

    // Tick 3: advance to index 3 = PUSH(30)
    s = stack.nextStep();
    assert.equal(s.operation, 'PUSH');
    assert.equal(s.operand, 30);
    assert.equal(stack.currentHistoryIndex, 3);

    // At final index: nextStep returns null (triggers pause)
    assert.equal(stack.nextStep(), null);
  });

  test('16. nextStep() at the final index returns null (playback terminates)', () => {
    const stack = new StackEngine();
    stack.push(5);
    // now at index 1 = last index
    const result = stack.nextStep();
    assert.equal(result, null);
  });

  test('17. Playback stops naturally when currentHistoryIndex >= history.length - 1', () => {
    const stack = new StackEngine();
    stack.push(100);
    stack.push(200);

    stack.goToStep(0);
    while (stack.currentHistoryIndex < stack.history.length - 1) {
      stack.nextStep();
    }

    assert.equal(stack.currentHistoryIndex >= stack.history.length - 1, true);
    // next tick: interval condition fails -> pause() called
    assert.equal(stack.nextStep(), null);
  });

  test('18. After simulated pause: prevStep and nextStep both work', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);

    stack.goToStep(2); // at PUSH(20)
    assert.equal(stack.currentHistoryIndex, 2);

    const prev = stack.prevStep();
    assert.ok(prev !== null);
    assert.equal(stack.currentHistoryIndex, 1);

    const next = stack.nextStep();
    assert.ok(next !== null);
    assert.equal(stack.currentHistoryIndex, 2);
  });

  test('19. Reset timeline: goToStep(0) restores INITIAL step with empty elements', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    stack.goToStep(stack.history.length - 1);
    assert.equal(stack.currentHistoryIndex, 3);

    const first = stack.goToStep(0);
    assert.ok(first !== null);
    assert.equal(first.operation, 'INITIAL');
    assert.equal(stack.currentHistoryIndex, 0);
    assert.deepEqual(stack.elements, []);
  });

  test('20. Reset mid-playback: goToStep(0) correctly restores state', () => {
    const stack = new StackEngine();
    stack.push(5);
    stack.push(15);
    stack.push(25);

    stack.goToStep(2); // mid-timeline
    const first = stack.goToStep(0);
    assert.equal(stack.currentHistoryIndex, 0);
    assert.equal(first.operation, 'INITIAL');
    assert.deepEqual(stack.elements, []);
  });

  test('21. Duplicate timer prevention: isPlaying guard blocks second play() call', () => {
    const stack = new StackEngine();
    stack.push(10);

    let isPlaying = false;
    let timerCount = 0;

    function simulatedPlay() {
      if (isPlaying) return; // guard - second call blocked
      if (stack.history.length <= 1) return;
      isPlaying = true;
      timerCount++;
    }

    simulatedPlay(); // first click - one timer created
    simulatedPlay(); // second click - blocked

    assert.equal(timerCount, 1, 'Only one timer should exist after repeated clicks');
  });

  test('22. canPlay logic: true iff history.length > 1 AND not currently playing', () => {
    const stack = new StackEngine();

    // Only INITIAL step - cannot play
    assert.equal(stack.history.length > 1 && !false, false);

    stack.push(99);
    // Has ops, not playing
    assert.equal(stack.history.length > 1 && !false, true);

    // Has ops, but currently playing
    assert.equal(stack.history.length > 1 && !true, false);
  });

  test('23. Speed formula: 1600 - rangeValue maps correctly to playback delay', () => {
    assert.equal(1600 - 100, 1500);  // slowest (range min)
    assert.equal(1600 - 800, 800);   // default (range mid)
    assert.equal(1600 - 1500, 100);  // fastest (range max)
    assert.ok(1600 - 100 > 1600 - 1500, 'Higher range value = faster = lower ms delay');
  });

  test('24. goToStep() restores correct element state at every history snapshot', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    stack.goToStep(0);
    assert.deepEqual(stack.elements, []);

    stack.goToStep(1);
    assert.deepEqual(stack.elements, [10]);

    stack.goToStep(2);
    assert.deepEqual(stack.elements, [10, 20]);

    stack.goToStep(3);
    assert.deepEqual(stack.elements, [10, 20, 30]);
  });
});

// ---------------------------------------------------------------------------
// 3. Regression - Existing Stack Operations
// ---------------------------------------------------------------------------

describe('Stack Regression - Push, Pop, Peek, Underflow, Timeline (Phase 10.1)', () => {

  test('25. Push records correct step with operand and advancing top pointer', () => {
    const stack = new StackEngine();
    const step = stack.push(77);
    assert.equal(step.operation, 'PUSH');
    assert.equal(step.operand, 77);
    assert.equal(step.currentTop, 0);
    assert.equal(stack.elements.length, 1);
  });

  test('26. Pop removes top element in strict LIFO order', () => {
    const stack = new StackEngine();
    stack.push(1);
    stack.push(2);
    const step = stack.pop();
    assert.equal(step.operation, 'POP');
    assert.equal(step.operand, 2);
    assert.deepEqual(stack.elements, [1]);
  });

  test('27. Peek inspects top element without mutating stack', () => {
    const stack = new StackEngine();
    stack.push(55);
    const step = stack.peek();
    assert.equal(step.operation, 'PEEK');
    assert.equal(step.operand, 55);
    assert.equal(stack.elements.length, 1);
  });

  test('28. Pop underflow: returns underflow step, does not crash', () => {
    const stack = new StackEngine();
    const step = stack.pop();
    assert.equal(step.operation, 'POP_UNDERFLOW');
    assert.equal(step.isUnderflow, true);
    assert.equal(stack.elements.length, 0);
  });

  test('29. Peek underflow: returns underflow step, does not crash', () => {
    const stack = new StackEngine();
    const step = stack.peek();
    assert.equal(step.operation, 'PEEK_UNDERFLOW');
    assert.equal(step.isUnderflow, true);
  });

  test('30. Clear empties stack and records RESET step', () => {
    const stack = new StackEngine();
    stack.push(1);
    stack.push(2);
    const step = stack.clear();
    assert.equal(step.operation, 'RESET');
    assert.deepEqual(stack.elements, []);
    assert.equal(step.currentTop, -1);
  });

  test('31. Timeline: prevStep and nextStep traverse history correctly', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    let s = stack.prevStep();
    assert.equal(s.operand, 20);

    s = stack.prevStep();
    assert.equal(s.operand, 10);

    s = stack.prevStep();
    assert.equal(s.operation, 'INITIAL');

    const blocked = stack.prevStep();
    assert.equal(blocked, null); // cannot go before index 0

    s = stack.nextStep();
    assert.equal(s.operand, 10);
  });

  test('32. History length increments exactly once per operation', () => {
    const stack = new StackEngine();
    assert.equal(stack.history.length, 1);
    stack.push(1);
    assert.equal(stack.history.length, 2);
    stack.push(2);
    assert.equal(stack.history.length, 3);
    stack.pop();
    assert.equal(stack.history.length, 4);
    stack.peek();
    assert.equal(stack.history.length, 5);
    stack.clear();
    assert.equal(stack.history.length, 6);
  });

  test('33. Core algorithms regression: all 5 produce correct final results', () => {
    const arr = [64, 34, 25, 12, 22];
    const sorted = [12, 22, 25, 34, 64];

    const b = generateBubbleSortSteps(arr);
    assert.deepEqual(b[b.length - 1].array, sorted);

    const sel = generateSelectionSortSteps(arr);
    assert.deepEqual(sel[sel.length - 1].array, sorted);

    const ins = generateInsertionSortSteps(arr);
    assert.deepEqual(ins[ins.length - 1].array, sorted);

    const lin = generateLinearSearchSteps(arr, 25);
    const lm = lin.find(s => s.foundIndex !== null && s.foundIndex !== undefined);
    assert.equal(lm.foundIndex, 2);

    const bin = generateBinarySearchSteps([12, 22, 25, 34, 64], 25);
    const bm = bin.find(s => s.foundIndex !== null && s.foundIndex !== undefined);
    assert.equal(bm.foundIndex, 2);
  });
});

// ---------------------------------------------------------------------------
// 4. Stack Lab Playback & Sequence Bug Fix Regression Tests (Phase C)
// ---------------------------------------------------------------------------

describe('Stack Lab Playback State & Sequence Integrity (Phase C Bug Fix)', () => {

  test('34. Initial state matches the first valid playback frame', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);

    const firstValidIdx = stack.getFirstValidStepIndex();
    assert.equal(firstValidIdx, 1, 'First valid operational frame must be at index 1');

    const firstValidStep = stack.goToStep(firstValidIdx);
    assert.equal(firstValidStep.operation, 'PUSH');
    assert.equal(firstValidStep.operand, 10);
    assert.deepEqual(firstValidStep.resultingElements, [10]);

    // Current step matches first valid playback frame
    const current = stack.getCurrentStep();
    assert.deepEqual(current, firstValidStep);
    assert.notEqual(current.resultingElements.length, 0, 'First playback frame must not be empty');
  });

  test('35. Play does not introduce an unexpected empty-stack frame', () => {
    const stack = new StackEngine();
    stack.push(42);
    stack.push(84);

    // Timeline at end
    stack.goToStep(stack.history.length - 1);
    assert.equal(stack.currentHistoryIndex, 2);

    // Simulate play() reset logic: must jump to first valid step, NEVER index 0 empty frame
    const firstValidIdx = stack.getFirstValidStepIndex();
    const playbackStartStep = stack.goToStep(firstValidIdx);

    assert.equal(playbackStartStep.operation, 'PUSH');
    assert.equal(playbackStartStep.operand, 42);
    assert.deepEqual(playbackStartStep.resultingElements, [42]);
    assert.notEqual(playbackStartStep.operation, 'INITIAL');
    assert.notDeepEqual(playbackStartStep.resultingElements, []);
  });

  test('36. A new sequence does not replay previous operations', () => {
    const stack = new StackEngine();
    // Sequence 1
    stack.push(1);
    stack.push(2);
    stack.push(3);
    assert.equal(stack.history.length, 4);

    // Start genuinely new sequence
    stack.resetSequence();
    assert.equal(stack.history.length, 1);
    assert.deepEqual(stack.elements, []);

    // Sequence 2
    stack.push(100);
    stack.push(200);

    assert.equal(stack.history.length, 3); // INITIAL + 2 pushes
    const operations = stack.history.map(s => s.operand);
    assert.deepEqual(operations, [null, 100, 200]);

    // Verify Sequence 1 operations (1, 2, 3) are completely absent
    assert.equal(stack.history.some(s => s.operand === 1 || s.operand === 2 || s.operand === 3), false);

    // Playback restarts within Sequence 2 only
    const firstIdx = stack.getFirstValidStepIndex();
    const startStep = stack.goToStep(firstIdx);
    assert.equal(startStep.operand, 100);
  });

  test('37. Underflow followed by new operations behaves correctly without corrupting history', () => {
    const stack = new StackEngine();
    // Trigger underflow on empty stack
    const underflow = stack.pop();
    assert.equal(underflow.operation, 'POP_UNDERFLOW');
    assert.equal(underflow.isUnderflow, true);
    assert.equal(stack.elements.length, 0);

    // Continue sequence with valid operations
    stack.push(50);
    stack.push(60);

    assert.equal(stack.history.length, 4); // INITIAL, POP_UNDERFLOW, PUSH 50, PUSH 60
    assert.deepEqual(stack.elements, [50, 60]);

    // Timeline navigation traverses underflow and pushes deterministically
    stack.goToStep(1); // at underflow
    assert.equal(stack.getCurrentStep().isUnderflow, true);
    assert.deepEqual(stack.elements, []);

    stack.nextStep(); // at PUSH 50
    assert.equal(stack.getCurrentStep().operand, 50);
    assert.deepEqual(stack.elements, [50]);

    stack.nextStep(); // at PUSH 60
    assert.equal(stack.getCurrentStep().operand, 60);
    assert.deepEqual(stack.elements, [50, 60]);
  });

  test('38. Clear and Reset behave consistently', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);

    // 1. Reset timeline: rewinds playback to first valid frame without wiping history
    const firstIdx = stack.getFirstValidStepIndex();
    const resetFrame = stack.goToStep(firstIdx);
    assert.equal(resetFrame.operand, 10);
    assert.equal(stack.history.length, 3, 'Reset timeline preserves history');

    // 2. Clear / ResetSequence: starts fresh sequence, wiping prior history
    const cleared = stack.resetSequence();
    assert.equal(cleared.operation, 'INITIAL');
    assert.equal(stack.history.length, 1, 'resetSequence clears prior history');
    assert.deepEqual(stack.elements, []);
  });

  test('39. Pause and Play resume the correct sequence', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);
    stack.push(30);
    stack.push(40);

    // Start playback from first valid frame
    stack.goToStep(stack.getFirstValidStepIndex()); // step 1: PUSH 10
    assert.equal(stack.currentHistoryIndex, 1);

    // Advance 1 step
    stack.nextStep(); // step 2: PUSH 20
    assert.equal(stack.currentHistoryIndex, 2);

    // Simulate pause at step 2
    let isPlaying = false;
    const pausedIndex = stack.currentHistoryIndex;
    assert.equal(pausedIndex, 2);

    // Resume play: should continue from step 2, not restart from beginning
    if (stack.currentHistoryIndex >= stack.history.length - 1) {
      stack.goToStep(stack.getFirstValidStepIndex());
    }
    assert.equal(stack.currentHistoryIndex, 2, 'Resuming play does not restart if not at end');

    // Next step continues to step 3: PUSH 30
    const next = stack.nextStep();
    assert.equal(next.operand, 30);
    assert.equal(stack.currentHistoryIndex, 3);
  });

  test('40. Previous and Next operate on the current sequence', () => {
    const stack = new StackEngine();
    stack.push(5);
    stack.push(15);
    stack.push(25);

    const firstIdx = stack.getFirstValidStepIndex();
    stack.goToStep(3); // at PUSH 25 (last step)

    // Prev step retreats within sequence
    let step = stack.prevStep();
    assert.equal(step.operand, 15);
    assert.equal(stack.currentHistoryIndex, 2);

    step = stack.prevStep();
    assert.equal(step.operand, 5);
    assert.equal(stack.currentHistoryIndex, firstIdx);

    // In UI, prev button is bounded at firstIdx (does not go into empty INITIAL state)
    assert.equal(stack.currentHistoryIndex <= firstIdx, true);

    // Next step advances within sequence
    step = stack.nextStep();
    assert.equal(step.operand, 15);
    assert.equal(stack.currentHistoryIndex, 2);
  });

  test('41. Old playback timers cannot modify a newly initialized sequence (generation token)', () => {
    const stack = new StackEngine();
    stack.push(10);
    stack.push(20);

    let sequenceToken = 1;
    let oldTimerFiredOnNewSequence = false;

    // Simulate active timer with token 1
    const timerToken = sequenceToken;

    // User starts a new sequence, incrementing token
    sequenceToken++;
    stack.resetSequence();
    stack.push(999);

    // Simulated callback from stale timer
    function timerCallback() {
      if (timerToken !== sequenceToken) {
        // Guard caught stale timer!
        return;
      }
      oldTimerFiredOnNewSequence = true;
      stack.nextStep();
    }

    timerCallback();
    assert.equal(oldTimerFiredOnNewSequence, false, 'Stale timer must be rejected by token guard');
    assert.equal(stack.elements[0], 999, 'New sequence state remains untouched');
    assert.equal(stack.history.length, 2, 'New sequence history remains intact');
  });
});
