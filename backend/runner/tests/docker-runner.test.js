// =============================================================================
// ALGOLAB — Docker Container Execution Bridge Tests (Phase 5)
//
// Tests the docker-runner.js module against real Docker containers.
// Does NOT modify existing tracer or playback tests.
// Requires: Docker Desktop running, algolab-runner:latest image built.
// =============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runInContainer } from '../docker-runner.js';

// ---------------------------------------------------------------------------
// Fixtures: small deterministic Java programs
// ---------------------------------------------------------------------------

const BUBBLE_SORT_SOURCE = `public class BubbleSort {
    public static void main(String[] args) {
        int[] arr = { 64, 34, 25, 12, 22 };
        int n = arr.length;

        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }

        System.out.println("Sorted array:");
        for (int val : arr) {
            System.out.print(val + " ");
        }
        System.out.println();
    }
}`;

const SIMPLE_HELLO = `public class SimpleHello {
    public static void main(String[] args) {
        String msg = "Hello ALGOLAB";
        System.out.println(msg);
    }
}`;

const SYNTAX_ERROR_SOURCE = `public class SyntaxError {
    public static void main(String[] args) {
        int x = ;
    }
}`;

const INFINITE_LOOP_SOURCE = `public class InfiniteLoop {
    public static void main(String[] args) {
        int x = 0;
        while (true) {
            x++;
        }
    }
}`;

const BIG_OUTPUT_SOURCE = `public class BigOutput {
    public static void main(String[] args) {
        for (int i = 0; i < 200; i++) {
            System.out.println("LINE-" + i + "-ABCDEFGHIJKLMNOPQRSTUVWXYZ-PADDING");
        }
    }
}`;

// ---------------------------------------------------------------------------
// Test 1: Valid Bubble Sort produces real trace events
// ---------------------------------------------------------------------------

test('1. Bubble Sort: returns genuine trace with 72 step events', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: BUBBLE_SORT_SOURCE,
    mainClass: 'BubbleSort',
    limits: { timeoutMs: 15_000 },
  });

  assert.equal(result.outcome, 'success', `Expected success, got ${result.outcome}: ${result.errorEvent?.message || result.stderr}`);
  assert.equal(result.containerExitCode, 0, `Container exit code: ${result.containerExitCode}`);
  assert.equal(result.timedOut, false);

  // Init event
  assert.ok(result.initEvent, 'Init event must be present');
  assert.equal(result.initEvent.type, 'init');
  assert.equal(result.initEvent.mainClass, 'BubbleSort');
  assert.equal(result.initEvent.semantics, 'state_before_line_execution');

  // Step events
  assert.equal(result.stepCount, 72, `Expected 72 steps, got ${result.stepCount}`);

  // Exit event
  assert.ok(result.exitEvent, 'Exit event must be present');
  assert.equal(result.exitEvent.type, 'exit');
  assert.equal(result.exitEvent.exitCode, 0);
  assert.equal(result.exitEvent.totalSteps, 72);

  // Verify sorted output
  assert.ok(result.exitEvent.stdout.includes('Sorted array:'));
  const numbers = result.exitEvent.stdout.match(/\d+/g).map(Number);
  assert.deepEqual(numbers, [12, 22, 25, 34, 64]);
});

// ---------------------------------------------------------------------------
// Test 2: Simple program output and exit status
// ---------------------------------------------------------------------------

test('2. Simple program: correct output and exit code 0', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: SIMPLE_HELLO,
    mainClass: 'SimpleHello',
    limits: { timeoutMs: 15_000 },
  });

  assert.equal(result.outcome, 'success');
  assert.equal(result.containerExitCode, 0);
  assert.ok(result.exitEvent);
  assert.ok(result.exitEvent.stdout.includes('Hello ALGOLAB'));
});

// ---------------------------------------------------------------------------
// Test 3: Compilation error returns real failure
// ---------------------------------------------------------------------------

test('3. Compilation error: returns compilation_error outcome', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: SYNTAX_ERROR_SOURCE,
    mainClass: 'SyntaxError',
    limits: { timeoutMs: 15_000 },
  });

  assert.equal(result.outcome, 'compilation_error');
  assert.ok(result.errorEvent, 'Error event must be present');
  assert.equal(result.errorEvent.errorType, 'compilation_error');
  assert.ok(result.errorEvent.message);
  // Container should exit with code 1 for compilation errors
  assert.equal(result.containerExitCode, 1);
});

// ---------------------------------------------------------------------------
// Test 4: Infinite loop ends within timeout
// ---------------------------------------------------------------------------

test('4. Infinite loop: terminated by timeout', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: INFINITE_LOOP_SOURCE,
    mainClass: 'InfiniteLoop',
    limits: { timeoutMs: 8_000 },
  });

  assert.equal(result.outcome, 'timeout', `Expected timeout, got ${result.outcome}`);
});

// ---------------------------------------------------------------------------
// Test 5: Oversized source is rejected before Docker
// ---------------------------------------------------------------------------

test('5. Oversized source: rejected with validation_error', async () => {
  const oversizedCode = 'x'.repeat(70_000); // > 64KB limit

  const result = await runInContainer({
    code: oversizedCode,
  });

  assert.equal(result.outcome, 'validation_error');
  assert.ok(result.errorEvent.message.includes('exceeds maximum size'));
  assert.equal(result.containerExitCode, -1); // Never started
});

// ---------------------------------------------------------------------------
// Test 6: Excessive output is bounded
// ---------------------------------------------------------------------------

test('6. Excessive output: stdout bounded by tracer', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: BIG_OUTPUT_SOURCE,
    mainClass: 'BigOutput',
    limits: {
      timeoutMs: 15_000,
      maxOutputBytes: 500,  // Very small limit to trigger truncation
    },
  });

  assert.equal(result.outcome, 'success');
  assert.ok(result.exitEvent, 'Exit event must be present');
  assert.equal(result.exitEvent.stdoutTruncated, true, 'stdoutTruncated must be true');
  // The tracer bounds student stdout inside the exit event
  assert.ok(result.exitEvent.stdout.length <= 600, `Stdout too large: ${result.exitEvent.stdout.length}`);
});

// ---------------------------------------------------------------------------
// Test 7: Empty code is rejected
// ---------------------------------------------------------------------------

test('7. Empty code: rejected with validation_error', async () => {
  const result = await runInContainer({ code: '   ' });

  assert.equal(result.outcome, 'validation_error');
  assert.ok(result.errorEvent.message.includes('empty'));
});

// ---------------------------------------------------------------------------
// Test 8: Invalid request types are rejected
// ---------------------------------------------------------------------------

test('8. Invalid request: null, non-object, non-string code', async () => {
  const r1 = await runInContainer(null);
  assert.equal(r1.outcome, 'validation_error');

  const r2 = await runInContainer('not-an-object');
  assert.equal(r2.outcome, 'validation_error');

  const r3 = await runInContainer({ code: 42 });
  assert.equal(r3.outcome, 'validation_error');
});

// ---------------------------------------------------------------------------
// Test 9: Temporary files are cleaned up
// ---------------------------------------------------------------------------

test('9. Temp file cleanup: directory removed after execution', { timeout: 30_000 }, async () => {
  // List temp dirs before
  const before = (await fs.readdir(os.tmpdir())).filter(d => d.startsWith('algolab_job_'));

  await runInContainer({
    code: SIMPLE_HELLO,
    mainClass: 'SimpleHello',
    limits: { timeoutMs: 15_000 },
  });

  // List temp dirs after
  const after = (await fs.readdir(os.tmpdir())).filter(d => d.startsWith('algolab_job_'));

  // No new algolab_job_ directories should remain
  assert.equal(after.length, before.length,
    `Temp dirs not cleaned up. Before: ${before.length}, After: ${after.length}`);
});

// ---------------------------------------------------------------------------
// Test 10: Temp cleanup also happens on compilation failure
// ---------------------------------------------------------------------------

test('10. Temp cleanup on failure: directory removed after compile error', { timeout: 30_000 }, async () => {
  const before = (await fs.readdir(os.tmpdir())).filter(d => d.startsWith('algolab_job_'));

  await runInContainer({
    code: SYNTAX_ERROR_SOURCE,
    mainClass: 'SyntaxError',
    limits: { timeoutMs: 15_000 },
  });

  const after = (await fs.readdir(os.tmpdir())).filter(d => d.startsWith('algolab_job_'));
  assert.equal(after.length, before.length);
});

// ---------------------------------------------------------------------------
// Test 11: mainClass auto-detection from code
// ---------------------------------------------------------------------------

test('11. Auto-detect mainClass from source code', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: BUBBLE_SORT_SOURCE,
    // No mainClass specified — should auto-detect "BubbleSort"
    limits: { timeoutMs: 15_000 },
  });

  assert.equal(result.outcome, 'success');
  assert.equal(result.initEvent.mainClass, 'BubbleSort');
});

// ---------------------------------------------------------------------------
// Test 12: Invalid mainClass name is rejected
// ---------------------------------------------------------------------------

test('12. Invalid mainClass: rejected with validation_error', async () => {
  const result = await runInContainer({
    code: SIMPLE_HELLO,
    mainClass: '../../etc/passwd',
  });

  assert.equal(result.outcome, 'validation_error');
  assert.ok(result.errorEvent.message.includes('Invalid mainClass'));
});

// ---------------------------------------------------------------------------
// Test 13: Docker arguments do not allow injection
// ---------------------------------------------------------------------------

test('13. Argument injection: mainClass with special chars rejected', async () => {
  // Attempt to inject docker flags via mainClass
  const r1 = await runInContainer({
    code: SIMPLE_HELLO,
    mainClass: '--privileged',
  });
  assert.equal(r1.outcome, 'validation_error');

  const r2 = await runInContainer({
    code: SIMPLE_HELLO,
    mainClass: 'Foo;rm -rf /',
  });
  assert.equal(r2.outcome, 'validation_error');
});

// ---------------------------------------------------------------------------
// Test 14: Event structure validation
// ---------------------------------------------------------------------------

test('14. Event structure: all step events have required fields', { timeout: 30_000 }, async () => {
  const result = await runInContainer({
    code: BUBBLE_SORT_SOURCE,
    mainClass: 'BubbleSort',
    limits: { timeoutMs: 15_000 },
  });

  assert.equal(result.outcome, 'success');

  const stepEvents = result.events.filter(e => e.type === 'step');
  for (const step of stepEvents) {
    assert.equal(typeof step.stepIndex, 'number', 'step.stepIndex must be number');
    assert.equal(typeof step.line, 'number', 'step.line must be number');
    assert.equal(typeof step.method, 'string', 'step.method must be string');
    assert.ok(step.variables && typeof step.variables === 'object', 'step.variables must be object');
    assert.ok(step.arrays && typeof step.arrays === 'object', 'step.arrays must be object');
  }
});

// ---------------------------------------------------------------------------
// Test 15: Container exit status is correctly captured
// ---------------------------------------------------------------------------

test('15. Container exit status: compilation error exits 1, timeout exits 2', { timeout: 30_000 }, async () => {
  // Compilation error → exit code 1
  const compResult = await runInContainer({
    code: SYNTAX_ERROR_SOURCE,
    mainClass: 'SyntaxError',
    limits: { timeoutMs: 15_000 },
  });
  assert.equal(compResult.containerExitCode, 1);

  // Timeout → exit code 2 (from tracer) or killed
  const timeoutResult = await runInContainer({
    code: INFINITE_LOOP_SOURCE,
    mainClass: 'InfiniteLoop',
    limits: { timeoutMs: 8_000 },
  });
  // The tracer exits with code 2 on internal timeout
  assert.ok(
    timeoutResult.containerExitCode === 2 || timeoutResult.timedOut,
    `Expected exit code 2 or host-side timeout, got exit=${timeoutResult.containerExitCode} timedOut=${timeoutResult.timedOut}`
  );
});
