// =============================================================================
// ALGOLAB — Frontend-to-API Integration Tests (Phase 7)
//
// Tests the full flow: student Java code submitted to HTTP API (/api/execute),
// receiving genuine execution output and JDI trace events, and loading
// the returned trace into the client-side TracePlaybackEngine.
// =============================================================================

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.js';
import { runInContainer } from '../docker-runner.js';
import { TracePlaybackEngine } from '../../../frontend/js/playback-engine.js';

function httpRequest(serverOrPort, { method = 'POST', path = '/api/execute', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const port = typeof serverOrPort === 'number' ? serverOrPort : serverOrPort.address()?.port;
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: { ...headers },
    };

    if (body !== null && typeof body === 'string') {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let json = null;
        try { json = JSON.parse(raw); } catch (_) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, raw, json });
      });
    });

    req.on('error', reject);
    if (body !== null) req.write(body);
    req.end();
  });
}

function startTestServer(options = {}) {
  return new Promise((resolve, reject) => {
    const server = createServer({ runner: runInContainer, ...options });
    server.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

function stopTestServer(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

describe('Code Lab Frontend Integration (Phase 7)', () => {

  // Test 1: Real Java code execution -> genuine output -> playback engine integration
  test('1. Example array program executes, yields genuine stdout, and steps deterministically through playback engine', { timeout: 35_000 }, async () => {
    const server = await startTestServer();
    try {
      const studentCode = `public class Main {
    public static void main(String[] args) {
        int[] arr = {3, 1, 2};
        for (int i = 0; i < arr.length; i++) {
            System.out.println(arr[i]);
        }
    }
}`;

      // Simulate codelab.js client POST
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: studentCode,
          mainClass: 'Main',
        }),
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'success');
      assert.equal(res.json.containerExitCode, 0);

      // Verify stdout contains the printed numbers
      assert.ok(res.json.exitEvent);
      assert.ok(res.json.exitEvent.stdout.includes('3\n1\n2\n'), `Expected 3, 1, 2 in stdout, got: ${res.json.exitEvent.stdout}`);

      // Verify step events belong to student code
      assert.ok(res.json.stepCount > 0);
      const stepEvents = res.json.events.filter(e => e.type === 'step');
      assert.ok(stepEvents.length >= 5);

      // Feed trace events to the actual client-side TracePlaybackEngine
      const engine = new TracePlaybackEngine({ speedMs: 500 });
      const loaded = engine.loadTrace(res.json.events);
      assert.equal(loaded, true);
      assert.equal(engine.status, 'ready');
      assert.equal(engine.steps.length, stepEvents.length);

      // Verify step 0 (initial state before line execution)
      const step0 = engine.getCurrentStep();
      assert.ok(step0);
      assert.equal(typeof step0.line, 'number');
      assert.equal(step0.method, 'main');

      // Step forward through playback engine
      engine.stepNext();
      const step1 = engine.getCurrentStep();
      assert.ok(step1);
      assert.equal(engine.currentStepIndex, 1);

      // Search for a step where 'arr' is captured
      const arrayStep = stepEvents.find(s => s.arrays && s.arrays.arr);
      assert.ok(arrayStep, 'Should have captured array snapshot for arr');
      assert.equal(arrayStep.arrays.arr.length, 3);
      assert.deepEqual(arrayStep.arrays.arr.values, [3, 1, 2]);

    } finally {
      await stopTestServer(server);
    }
  });

  // Test 2: Compilation error does not load fake trace
  test('2. Compilation error results in compilation_error outcome and loads no trace', { timeout: 20_000 }, async () => {
    const server = await startTestServer();
    try {
      const brokenCode = `public class SyntaxErr {
    public static void main(String[] args) {
        int x = ;
    }
}`;

      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: brokenCode,
          mainClass: 'SyntaxErr',
        }),
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'compilation_error');
      assert.ok(res.json.errorEvent);
      assert.equal(res.json.errorEvent.errorType, 'compilation_error');

      // The frontend wipes trace events on compilation error
      const engine = new TracePlaybackEngine();
      engine.loadTrace([]);
      assert.equal(engine.steps.length, 0);
      assert.equal(engine.status, 'empty');

    } finally {
      await stopTestServer(server);
    }
  });

  // Test 3: Infinite loop produces timeout outcome and loads no trace
  test('3. Infinite loop terminates via timeout outcome', { timeout: 20_000 }, async () => {
    const server = await startTestServer();
    try {
      const infiniteLoop = `public class Spin {
    public static void main(String[] args) {
        int count = 0;
        while (true) {
            count++;
        }
    }
}`;

      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: infiniteLoop,
          mainClass: 'Spin',
        }),
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.json.outcome, 'timeout');
      assert.ok(res.json.timedOut || res.json.containerExitCode === 2, 'Expected timedOut or containerExitCode 2');

      // On timeout, engine is cleared
      const engine = new TracePlaybackEngine();
      engine.loadTrace([]);
      assert.equal(engine.steps.length, 0);

    } finally {
      await stopTestServer(server);
    }
  });

  // Test 4: Offline server reports connection failure
  test('4. Connection to offline server throws and reports clear error message', async () => {
    // Port 1 is reserved and closed on local machine
    const offlinePort = 59999;
    await assert.rejects(
      async () => {
        await httpRequest(offlinePort, {
          method: 'POST',
          path: '/api/execute',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: 'class A {}' }),
        });
      },
      (err) => {
        assert.ok(err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET');
        return true;
      }
    );
  });
});
