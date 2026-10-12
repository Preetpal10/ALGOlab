import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRACER_BIN_DIR = path.resolve(__dirname, '../tracer');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const BUBBLE_SORT_FIXTURE = path.resolve(FIXTURES_DIR, 'BubbleSort.java');

// Ensure Tracer is compiled before tests
function ensureTracerCompiled() {
  const tracerJava = path.resolve(TRACER_BIN_DIR, 'Tracer.java');
  const res = spawnSync('javac', ['-d', TRACER_BIN_DIR, tracerJava], { encoding: 'utf-8' });
  if (res.status !== 0) {
    throw new Error(`Failed to compile Tracer.java:\n${res.stderr || res.stdout}`);
  }
}

// Helper to run Tracer and parse JSONL events
function runTracer(cliArgs = [], options = {}) {
  const javaArgs = ['-cp', TRACER_BIN_DIR, 'tracer.Tracer', ...cliArgs];
  const proc = spawnSync('java', javaArgs, {
    encoding: 'utf-8',
    timeout: options.timeout || 15000,
    ...options
  });

  const stdout = proc.stdout || '';
  const lines = stdout.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  const events = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch (e) {
      // non-json line (e.g. debug output)
    }
  }

  return {
    rawStdout: stdout,
    rawStderr: proc.stderr || '',
    exitCode: proc.status,
    events
  };
}

ensureTracerCompiled();

test('1. Bubble Sort: genuine output matches independently calculated expected result', () => {
  const result = runTracer(['--source', BUBBLE_SORT_FIXTURE]);
  assert.equal(result.exitCode, 0, `Tracer exited with code ${result.exitCode}`);

  const exitEvent = result.events.find(e => e.type === 'exit');
  assert.ok(exitEvent, 'Exit event should be present');
  assert.equal(exitEvent.exitCode, 0, 'Target program should exit with code 0');

  // Independently calculate expected sorted array
  const rawInput = [64, 34, 25, 12, 22];
  const expectedSorted = [...rawInput].sort((a, b) => a - b); // [12, 22, 25, 34, 64]

  const stdout = exitEvent.stdout;
  assert.ok(stdout.includes('Sorted array:'), 'Output should contain "Sorted array:"');

  // Extract printed numbers
  const match = stdout.match(/\d+/g);
  assert.ok(match, 'Numbers should be printed in stdout');
  const numbers = match.map(Number);
  assert.deepEqual(numbers, expectedSorted, 'Program output must match independently calculated array');
});

test('2. Source-line and local-variable capture', () => {
  const result = runTracer(['--source', BUBBLE_SORT_FIXTURE]);
  assert.equal(result.exitCode, 0);

  const stepEvents = result.events.filter(e => e.type === 'step');
  assert.ok(stepEvents.length > 20, 'Should have multiple step events');

  // Check initial init event
  const initEvent = result.events.find(e => e.type === 'init');
  assert.ok(initEvent, 'Init event should be present');
  assert.equal(initEvent.semantics, 'state_before_line_execution');

  // Verify variable capture
  const stepWithTemp = stepEvents.find(e => e.variables && e.variables.temp !== undefined);
  assert.ok(stepWithTemp, 'Should capture variable temp during swap');
  assert.equal(stepWithTemp.variables.temp.type, 'int');
  assert.ok(typeof stepWithTemp.variables.temp.value === 'number');

  // Verify variable n
  const stepWithN = stepEvents.find(e => e.variables && e.variables.n !== undefined);
  assert.ok(stepWithN, 'Should capture variable n');
  assert.equal(stepWithN.variables.n.value, 5);
});

test('3. Array snapshots capture genuine element mutations', () => {
  const result = runTracer(['--source', BUBBLE_SORT_FIXTURE]);
  assert.equal(result.exitCode, 0);

  const stepEvents = result.events.filter(e => e.type === 'step');
  const stepsWithArr = stepEvents.filter(e => e.arrays && e.arrays.arr);
  assert.ok(stepsWithArr.length > 0, 'Should capture array arr');

  // Check first recorded array state: [64, 34, 25, 12, 22]
  const firstArr = stepsWithArr[0].arrays.arr;
  assert.equal(firstArr.type, 'int[]');
  assert.equal(firstArr.length, 5);
  assert.deepEqual(firstArr.values, [64, 34, 25, 12, 22]);

  // Check last recorded array state: [12, 22, 25, 34, 64]
  const lastArr = stepsWithArr[stepsWithArr.length - 1].arrays.arr;
  assert.equal(lastArr.length, 5);
  assert.deepEqual(lastArr.values, [12, 22, 25, 34, 64]);
});

test('4. Deterministic repeated runs produce identical step counts and line sequences', () => {
  const run1 = runTracer(['--source', BUBBLE_SORT_FIXTURE]);
  const run2 = runTracer(['--source', BUBBLE_SORT_FIXTURE]);

  assert.equal(run1.exitCode, 0);
  assert.equal(run2.exitCode, 0);

  const steps1 = run1.events.filter(e => e.type === 'step');
  const steps2 = run2.events.filter(e => e.type === 'step');

  assert.equal(steps1.length, steps2.length, 'Total steps must be deterministic');

  const lines1 = steps1.map(s => s.line);
  const lines2 = steps2.map(s => s.line);
  assert.deepEqual(lines1, lines2, 'Line execution sequence must be identical');
});

test('5. Modified program produces a distinctly changed trace', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_mod_'));
  const modFile = path.join(tempDir, 'SimpleSum.java');
  fs.writeFileSync(modFile, `
public class SimpleSum {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int sum = a + b;
        System.out.println("SUM=" + sum);
    }
}
  `.trim());

  try {
    const result = runTracer(['--source', modFile]);
    assert.equal(result.exitCode, 0);

    const stepEvents = result.events.filter(e => e.type === 'step');
    assert.ok(stepEvents.length < 20, 'Simple program should have fewer steps than Bubble Sort');

    const exitEvent = result.events.find(e => e.type === 'exit');
    assert.ok(exitEvent.stdout.includes('SUM=30'), 'Output should reflect SimpleSum');

    const sumStep = stepEvents.find(e => e.variables && e.variables.sum !== undefined);
    assert.ok(sumStep, 'Should capture sum variable');
    assert.equal(sumStep.variables.sum.value, 30);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('6. Compilation errors are reported clearly without crashing tracer', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_err_'));
  const errFile = path.join(tempDir, 'SyntaxError.java');
  fs.writeFileSync(errFile, `
public class SyntaxError {
    public static void main(String[] args) {
        int invalid = ;
    }
}
  `.trim());

  try {
    const result = runTracer(['--source', errFile]);
    assert.notEqual(result.exitCode, 0, 'Tracer should exit with non-zero on compilation error');

    const errEvent = result.events.find(e => e.type === 'error');
    assert.ok(errEvent, 'Error event must be emitted');
    assert.equal(errEvent.errorType, 'compilation_error');
    assert.ok(errEvent.details && errEvent.details.length > 0, 'Details should contain javac compiler message');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('7. Infinite-loop timeout terminates process and emits timeout error', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_inf_'));
  const infFile = path.join(tempDir, 'InfiniteLoop.java');
  fs.writeFileSync(infFile, `
public class InfiniteLoop {
    public static void main(String[] args) {
        int x = 0;
        while (true) {
            x++;
        }
    }
}
  `.trim());

  try {
    // 1000ms timeout
    const result = runTracer(['--source', infFile, '--timeout-ms', '1000']);
    assert.equal(result.exitCode, 2, 'Tracer should exit with code 2 on timeout');

    const errEvent = result.events.find(e => e.type === 'error');
    assert.ok(errEvent, 'Error event must be emitted');
    assert.equal(errEvent.errorType, 'timeout');
    assert.ok(errEvent.message.includes('timed out'));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('8. Event-limit truncation halts tracing gracefully with explicit report', () => {
  // BubbleSort takes 72 steps; limit to 15
  const result = runTracer(['--source', BUBBLE_SORT_FIXTURE, '--max-events', '15']);
  assert.equal(result.exitCode, 0);

  const truncEvent = result.events.find(e => e.type === 'truncation');
  assert.ok(truncEvent, 'Truncation event should be emitted');
  assert.equal(truncEvent.reason, 'max_events_exceeded');
  assert.equal(truncEvent.limit, 15);

  const exitEvent = result.events.find(e => e.type === 'exit');
  assert.ok(exitEvent, 'Exit event should be emitted');
  assert.equal(exitEvent.stepsTruncated, true, 'stepsTruncated should be true');
});

test('9. Oversized output is bounded and flagged with stdoutTruncated: true', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_out_'));
  const outpFile = path.join(tempDir, 'BigOutput.java');
  fs.writeFileSync(outpFile, `
public class BigOutput {
    public static void main(String[] args) {
        for (int i = 0; i < 50; i++) {
            System.out.println("LINE-" + i + "-ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        }
    }
}
  `.trim());

  try {
    const maxBytes = 250;
    const result = runTracer(['--source', outpFile, '--max-output-bytes', String(maxBytes), '--timeout-ms', '10000']);
    assert.equal(result.exitCode, 0);

    const exitEvent = result.events.find(e => e.type === 'exit');
    assert.ok(exitEvent, 'Exit event must exist');
    assert.equal(exitEvent.stdoutTruncated, true, 'stdoutTruncated must be true');
    assert.ok(exitEvent.stdout.length <= maxBytes + 50, 'Stdout length must be bounded');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('10. Array-size limits bound captured elements and set truncated: true', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_arr_'));
  const arrFile = path.join(tempDir, 'BigArray.java');
  fs.writeFileSync(arrFile, `
public class BigArray {
    public static void main(String[] args) {
        int[] large = new int[60];
        for (int i = 0; i < large.length; i++) {
            large[i] = i * 2;
        }
    }
}
  `.trim());

  try {
    const maxArr = 10;
    const result = runTracer(['--source', arrFile, '--max-array-length', String(maxArr)]);
    assert.equal(result.exitCode, 0);

    const stepEvents = result.events.filter(e => e.type === 'step');
    const stepWithLarge = stepEvents.find(e => e.arrays && e.arrays.large && e.arrays.large.length === 60);
    assert.ok(stepWithLarge, 'Should capture large array');

    const arrSnapshot = stepWithLarge.arrays.large;
    assert.equal(arrSnapshot.length, 60);
    assert.equal(arrSnapshot.truncated, true, 'Array snapshot must be marked truncated');
    assert.equal(arrSnapshot.values.length, maxArr, `Values array must be capped at ${maxArr}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('11. Child-process cleanup: no orphaned target JVMs remain', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'algolab_cleanup_'));
  const targetFile = path.join(tempDir, 'CleanupTarget.java');
  fs.writeFileSync(targetFile, `
public class CleanupTarget {
    public static void main(String[] args) {
        while (true) {
            try { Thread.sleep(100); } catch (Exception ignored) {}
        }
    }
}
  `.trim());

  try {
    // Run with 1000ms timeout to trigger termination
    const result = runTracer(['--source', targetFile, '--timeout-ms', '1000']);
    assert.equal(result.exitCode, 2, 'Should time out and trigger termination');

    // Query Windows process table to ensure target java.exe was terminated
    const ps = spawnSync('powershell', [
      '-NoProfile',
      '-Command',
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'java.exe' -and $_.CommandLine -match 'CleanupTarget' } | Measure-Object | Select-Object -ExpandProperty Count"
    ], { encoding: 'utf-8' });

    const activeCount = parseInt((ps.stdout || '0').trim(), 10);
    assert.equal(activeCount, 0, 'No orphaned CleanupTarget java.exe process should remain running');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
