import test from 'node:test';
import assert from 'node:assert/strict';
import { TracePlaybackEngine } from '../../../frontend/js/playback-engine.js';
import {
  BUBBLE_SORT_TRACE_FIXTURE,
  SINGLE_STEP_FIXTURE,
  TRUNCATED_TRACE_FIXTURE,
  TIMEOUT_ERROR_FIXTURE,
  COMPILATION_ERROR_FIXTURE,
  EMPTY_TRACE_FIXTURE,
  MALFORMED_TRACE_FIXTURE
} from '../../../frontend/js/trace-fixtures.js';

test('1. Playback Engine: loads genuine Bubble Sort fixture and initializes at step 0', () => {
  let notifiedStep = null;
  let notifiedIndex = -1;
  const engine = new TracePlaybackEngine({
    onStepChange: (step, index) => {
      notifiedStep = step;
      notifiedIndex = index;
    }
  });

  const success = engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);
  assert.equal(success, true);
  assert.equal(engine.steps.length, 72);
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.status, 'ready');
  assert.ok(notifiedStep);
  assert.equal(notifiedIndex, 0);
  assert.equal(notifiedStep.line, 3);
});

test('2. Forward and backward stepping works deterministically', () => {
  const engine = new TracePlaybackEngine();
  engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);

  // Initial step 0
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.isAtFirstStep(), true);

  // Step next to index 1
  engine.stepNext();
  assert.equal(engine.currentStepIndex, 1);
  assert.equal(engine.getCurrentStep().stepIndex, 2);
  assert.equal(engine.isAtFirstStep(), false);

  // Step next to index 2
  engine.stepNext();
  assert.equal(engine.currentStepIndex, 2);

  // Step backward to index 1
  engine.stepPrev();
  assert.equal(engine.currentStepIndex, 1);
  assert.equal(engine.getCurrentStep().stepIndex, 2);

  // Step backward to index 0
  engine.stepPrev();
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.isAtFirstStep(), true);

  // Step backward beyond 0 does not underflow
  engine.stepPrev();
  assert.equal(engine.currentStepIndex, 0);
});

test('3. Reset restores initial state and pauses playback', () => {
  const engine = new TracePlaybackEngine();
  engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);

  // Advance several steps
  engine.stepNext();
  engine.stepNext();
  engine.stepNext();
  assert.equal(engine.currentStepIndex, 3);

  // Reset
  engine.reset();
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.status, 'ready');
});

test('4. Play and pause controls', async () => {
  const engine = new TracePlaybackEngine({ speedMs: 50 });
  engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);

  engine.play();
  assert.equal(engine.isPlaying, true);
  assert.equal(engine.status, 'playing');

  // Wait 120ms to allow ~2 auto-steps
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.ok(engine.currentStepIndex >= 1, `Expected at least 1 step, got ${engine.currentStepIndex}`);

  // Pause
  engine.pause();
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.status, 'paused');
  const pausedIndex = engine.currentStepIndex;

  // Wait another 80ms and ensure playback stopped
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(engine.currentStepIndex, pausedIndex);
});

test('5. Speed adjustments update interval properly', () => {
  const engine = new TracePlaybackEngine();
  engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);

  engine.setSpeed(250);
  assert.equal(engine.speedMs, 250);

  // Bounded within 50ms - 2000ms
  engine.setSpeed(10);
  assert.equal(engine.speedMs, 50);

  engine.setSpeed(5000);
  assert.equal(engine.speedMs, 2000);
});

test('6. Empty traces handle gracefully without throwing', () => {
  let statusReported = null;
  const engine = new TracePlaybackEngine({
    onStatusChange: (status) => { statusReported = status; }
  });

  const success = engine.loadTrace(EMPTY_TRACE_FIXTURE);
  assert.equal(success, true);
  assert.equal(engine.steps.length, 0);
  assert.equal(engine.currentStepIndex, -1);
  assert.equal(statusReported, 'empty');

  // Stepping on empty trace does not error
  engine.stepNext();
  engine.stepPrev();
  engine.play();
  assert.equal(engine.currentStepIndex, -1);
});

test('7. Single-event traces handle bounds correctly', () => {
  const engine = new TracePlaybackEngine();
  engine.loadTrace(SINGLE_STEP_FIXTURE);

  assert.equal(engine.steps.length, 1);
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.isAtFirstStep(), true);
  assert.equal(engine.isAtLastStep(), true);

  // Stepping forward stays at last step
  engine.stepNext();
  assert.equal(engine.currentStepIndex, 0);
  assert.equal(engine.isAtLastStep(), true);
});

test('8. End-of-trace handling stops auto-play and updates status to completed', async () => {
  let finalStatus = null;
  const engine = new TracePlaybackEngine({
    speedMs: 30,
    onStatusChange: (status) => { finalStatus = status; }
  });
  engine.loadTrace(SINGLE_STEP_FIXTURE);

  // Start play on 1-step trace
  engine.play();
  await new Promise(resolve => setTimeout(resolve, 60));

  assert.equal(engine.isPlaying, false);
  assert.equal(finalStatus, 'completed');
});

test('9. Missing variable values are handled safely', () => {
  const traceWithMissingVars = [
    { type: 'step', stepIndex: 1, line: 10, method: 'main', variables: { missingVar: { type: 'null', value: null } }, arrays: {} },
    { type: 'step', stepIndex: 2, line: 11, method: 'main', variables: {}, arrays: {} }
  ];

  const engine = new TracePlaybackEngine();
  const success = engine.loadTrace(traceWithMissingVars);
  assert.equal(success, true);

  const step1 = engine.getCurrentStep();
  assert.equal(step1.variables.missingVar.value, null);

  engine.stepNext();
  const step2 = engine.getCurrentStep();
  assert.deepEqual(step2.variables, {});
});

test('10. Array snapshot inspection captures length, values, and flags', () => {
  const engine = new TracePlaybackEngine();
  engine.loadTrace(BUBBLE_SORT_TRACE_FIXTURE);

  // Step 2 has array arr initialized
  engine.stepNext();
  const step2 = engine.getCurrentStep();
  assert.ok(step2.arrays && step2.arrays.arr);
  assert.equal(step2.arrays.arr.type, 'int[]');
  assert.equal(step2.arrays.arr.length, 5);
  assert.equal(step2.arrays.arr.truncated, false);
  assert.deepEqual(step2.arrays.arr.values, [64, 34, 25, 12, 22]);
});

test('11. Truncated traces trigger truncation callback and report truncated status', () => {
  let truncatedNotified = false;
  let statusNotified = null;
  const engine = new TracePlaybackEngine({
    onTruncated: (event) => {
      truncatedNotified = true;
      assert.equal(event.reason, 'max_events_exceeded');
    },
    onStatusChange: (status) => {
      statusNotified = status;
    }
  });

  const success = engine.loadTrace(TRUNCATED_TRACE_FIXTURE);
  assert.equal(success, true);
  assert.equal(truncatedNotified, true);
  assert.equal(engine.steps.length, 5);

  // Advance to last step
  while (!engine.isAtLastStep()) {
    engine.stepNext();
  }
  assert.equal(statusNotified, 'truncated');
});

test('12. Compilation errors and timeouts report error status and fire onError', () => {
  let errorFired = null;
  const engine = new TracePlaybackEngine({
    onError: (err) => { errorFired = err; }
  });

  // Test compilation error
  const res1 = engine.loadTrace(COMPILATION_ERROR_FIXTURE);
  assert.equal(res1, false);
  assert.equal(engine.status, 'error');
  assert.ok(errorFired);
  assert.equal(errorFired.errorType, 'compilation_error');

  // Test timeout error
  errorFired = null;
  const res2 = engine.loadTrace(TIMEOUT_ERROR_FIXTURE);
  assert.equal(res2, false);
  assert.equal(engine.status, 'error');
  assert.ok(errorFired);
  assert.equal(errorFired.errorType, 'timeout');
});

test('13. Malformed event data is safely sanitized and rejected without crashing', () => {
  let errorFired = null;
  const engine = new TracePlaybackEngine({
    onError: (err) => { errorFired = err; }
  });

  // Non-array input
  const resNonArray = engine.loadTrace('not-an-array');
  assert.equal(resNonArray, false);
  assert.equal(engine.status, 'error');

  // Array with malformed elements (null, string, missing stepIndex/line)
  const resSanitized = engine.loadTrace(MALFORMED_TRACE_FIXTURE);
  assert.equal(resSanitized, true);
  // All invalid items are filtered out, leaving 0 valid steps
  assert.equal(engine.steps.length, 0);
  assert.equal(engine.status, 'empty');
});
