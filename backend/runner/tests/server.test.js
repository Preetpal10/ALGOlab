// =============================================================================
// ALGOLAB — HTTP API Server Tests (Phase 6)
//
// Automated test suite for server.js using Node.js built-in test runner.
// Tests all required endpoints, validation, error handling, resource limits,
// Docker failure seams, and clean server shutdown.
// =============================================================================

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.js';
import { runInContainer } from '../docker-runner.js';

// ---------------------------------------------------------------------------
// HTTP Request Helper
// ---------------------------------------------------------------------------

function httpRequest(serverOrPort, { method = 'GET', path = '/', headers = {}, body = null }) {
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
        try {
          json = JSON.parse(raw);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          raw,
          json,
        });
      });
    });

    req.on('error', reject);

    if (body !== null) {
      req.write(body);
    }
    req.end();
  });
}

// Helper to spawn a temporary test server on port 0
function startTestServer(options = {}) {
  return new Promise((resolve, reject) => {
    const server = createServer(options);
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
    server.on('error', reject);
  });
}

function stopTestServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('ALGOLAB HTTP API (Phase 6)', () => {

  // Test 1: GET /api/health succeeds
  test('1. GET /api/health succeeds and returns non-sensitive status', async () => {
    const server = await startTestServer();
    try {
      const res = await httpRequest(server, {
        method: 'GET',
        path: '/api/health',
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json, 'Response should be valid JSON');
      assert.equal(res.json.status, 'ok');
      assert.equal(res.json.service, 'algolab-runner');
      assert.equal(res.json.version, '1.0.0');

      // Check no sensitive keys leaked
      const keys = Object.keys(res.json);
      assert.ok(!keys.includes('env'));
      assert.ok(!keys.includes('paths'));
      assert.ok(!keys.includes('docker'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 2: Valid Java request returns genuine trace
  test('2. Valid Java request returns genuine trace via real Docker runner', { timeout: 30_000 }, async () => {
    const server = await startTestServer({ runner: runInContainer });
    try {
      const payload = JSON.stringify({
        code: `public class ApiTest {
          public static void main(String[] args) {
            int a = 10;
            int b = 20;
            int c = a + b;
            System.out.println("Sum=" + c);
          }
        }`,
        mainClass: 'ApiTest',
      });

      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'success');
      assert.ok(res.json.stepCount > 0, 'Should have recorded step events');
      assert.ok(Array.isArray(res.json.events), 'Events should be an array');
      assert.ok(res.json.events.length >= 3);

      // Verify init event
      const initEvent = res.json.initEvent;
      assert.ok(initEvent, 'Init event must exist');
      assert.equal(initEvent.mainClass, 'ApiTest');

      // Verify step events
      const stepEvents = res.json.events.filter(e => e.type === 'step');
      assert.ok(stepEvents.length > 0);
      assert.ok(stepEvents[0].line > 0);
      assert.ok(typeof stepEvents[0].variables === 'object');

      // Verify exit event
      const exitEvent = res.json.exitEvent;
      assert.ok(exitEvent, 'Exit event must exist');
      assert.equal(exitEvent.exitCode, 0);
      assert.ok(exitEvent.stdout.includes('Sum=30'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 3: Invalid JSON is rejected
  test('3. Invalid JSON is rejected with 400 Bad Request', async () => {
    const server = await startTestServer();
    try {
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "code": "class A {}", broken_json ',
      });

      assert.equal(res.statusCode, 400);
      assert.ok(res.json);
      assert.ok(res.json.error.includes('Invalid JSON'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 4: Missing code is rejected
  test('4. Missing code is rejected with 400 Bad Request', async () => {
    const server = await startTestServer();
    try {
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainClass: 'Test' }),
      });

      assert.equal(res.statusCode, 400);
      assert.ok(res.json);
      assert.ok(res.json.error.includes('code'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 5: Empty code is rejected
  test('5. Empty code is rejected with 400 Bad Request', async () => {
    const server = await startTestServer();
    try {
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '   \n\t  ' }),
      });

      assert.equal(res.statusCode, 400);
      assert.ok(res.json);
      assert.ok(res.json.error.includes('empty'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 6: Oversized request body is rejected
  test('6. Oversized request body is rejected with 413 Payload Too Large', async () => {
    // Configure small maxBodyBytes for fast test
    const server = await startTestServer({ maxBodyBytes: 1024 });
    try {
      const bigCode = 'x'.repeat(2048);
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: bigCode }),
      });

      assert.equal(res.statusCode, 413);
      assert.ok(res.json);
      assert.ok(res.json.error.includes('maximum'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 7: Unsupported content type is rejected
  test('7. Unsupported content type is rejected with 415 Unsupported Media Type', async () => {
    const server = await startTestServer();
    try {
      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'text/plain' },
        body: 'public class A {}',
      });

      assert.equal(res.statusCode, 415);
      assert.ok(res.json);
      assert.ok(res.json.error.includes('Unsupported Content-Type'));
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 8: Java compilation failure is represented correctly
  test('8. Java compilation failure is represented correctly with 200 and compilation_error outcome', async () => {
    const server = await startTestServer({ runner: runInContainer });
    try {
      const payload = JSON.stringify({
        code: `public class BadCompile {
          public static void main(String[] args) {
            int a = ;
          }
        }`,
      });

      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'compilation_error');
      assert.ok(res.json.errorEvent, 'Must have errorEvent');
      assert.equal(res.json.errorEvent.errorType, 'compilation_error');
      assert.ok(res.json.errorEvent.message.length > 0);
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 9: Infinite loop produces a timeout outcome
  test('9. Infinite loop produces a timeout outcome', async () => {
    // Use test seam to simulate timeout response deterministically
    const mockTimeoutRunner = async () => ({
      outcome: 'timeout',
      events: [],
      initEvent: null,
      exitEvent: null,
      errorEvent: { type: 'error', errorType: 'timeout', message: 'Execution timed out.' },
      truncationEvent: null,
      stepCount: 15,
      timedOut: true,
      containerExitCode: 2,
      stderr: '',
      stdoutTruncated: false,
      stderrTruncated: false,
    });

    const server = await startTestServer({ runner: mockTimeoutRunner });
    try {
      const payload = JSON.stringify({
        code: 'public class Loop { public static void main(String[] args) { while(true){} } }',
      });

      const res = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'timeout');
      assert.equal(res.json.timedOut, true);
      assert.equal(res.json.errorEvent.errorType, 'timeout');
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 10: Invalid mainClass is rejected
  test('10. Invalid mainClass is rejected with 400 Bad Request', async () => {
    const server = await startTestServer();
    try {
      const badClasses = ['123Bad', 'Class With Space', 'Class; rm -rf /', 'Class$Name!'];
      for (const bad of badClasses) {
        const res = await httpRequest(server, {
          method: 'POST',
          path: '/api/execute',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: 'public class Valid { public static void main(String[] args) {} }',
            mainClass: bad,
          }),
        });

        assert.equal(res.statusCode, 400, `Expected 400 for bad class: ${bad}`);
        assert.ok(res.json.error.includes('mainClass'));
      }
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 11: Excess concurrent requests are handled safely
  test('11. Excess concurrent requests are rejected safely with 429 Too Many Requests', async () => {
    let releaseHold;
    const holdPromise = new Promise(resolve => { releaseHold = resolve; });

    // Mock runner with concurrency limit 1
    const holdingRunner = async () => {
      await holdPromise;
      return {
        outcome: 'success',
        events: [],
        stepCount: 0,
        containerExitCode: 0,
      };
    };

    const server = await startTestServer({ runner: holdingRunner, maxConcurrency: 1 });
    try {
      const validPayload = JSON.stringify({
        code: 'public class Test { public static void main(String[] args) {} }',
      });

      // Launch request 1 (will be held)
      const req1Promise = httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: validPayload,
      });

      // Small delay to ensure request 1 starts processing
      await new Promise(r => setTimeout(r, 20));

      // Launch request 2 (should be rejected immediately due to maxConcurrency: 1)
      const res2 = await httpRequest(server, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: validPayload,
      });

      assert.equal(res2.statusCode, 429);
      assert.ok(res2.json);
      assert.ok(res2.json.error.includes('Maximum concurrent executions'));
      assert.equal(res2.headers['retry-after'], '2');

      // Release hold and await request 1
      releaseHold();
      const res1 = await req1Promise;
      assert.equal(res1.statusCode, 200);
    } finally {
      releaseHold?.();
      await stopTestServer(server);
    }
  });

  // Test 12: Docker-unavailable and unexpected runner errors do not expose stack traces
  test('12. Docker-unavailable and internal runner errors return clean, sanitized responses without stack traces', async () => {
    // 12a. Docker unavailable
    const dockerDownRunner = async () => ({
      outcome: 'docker_unavailable',
      events: [],
      errorEvent: { type: 'error', errorType: 'docker_unavailable', message: 'Docker is not running.' },
    });

    const serverDown = await startTestServer({ runner: dockerDownRunner });
    try {
      const res = await httpRequest(serverDown, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'public class A { public static void main(String[] a){} }' }),
      });

      assert.equal(res.statusCode, 503);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'docker_unavailable');
      assert.ok(!res.raw.includes('stack'), 'Must not leak stack trace');
      assert.ok(!res.raw.includes('node:'), 'Must not leak node internals');
    } finally {
      await stopTestServer(serverDown);
    }

    // 12b. Unexpected thrown exception with internal paths
    const throwingRunner = async () => {
      const err = new Error('Secret system failure at /etc/secret_path/internal.node:123');
      err.stack = 'Error: Secret system failure\n    at internalFunction (/private/users/secret/server.js:42:15)';
      throw err;
    };

    const serverThrowing = await startTestServer({ runner: throwingRunner });
    try {
      const res = await httpRequest(serverThrowing, {
        method: 'POST',
        path: '/api/execute',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'public class A { public static void main(String[] a){} }' }),
      });

      assert.equal(res.statusCode, 500);
      assert.ok(res.json);
      assert.equal(res.json.outcome, 'internal_error');
      assert.ok(!res.raw.includes('/private/users'), 'Must not leak host path');
      assert.ok(!res.raw.includes('internalFunction'), 'Must not leak stack frame');
    } finally {
      await stopTestServer(serverThrowing);
    }
  });

  // Test 13: Server shuts down cleanly
  test('13. Server shuts down cleanly and refuses subsequent connections', async () => {
    const server = await startTestServer();
    const port = server.address().port;

    // Verify it is responding
    const res = await httpRequest(server, { method: 'GET', path: '/api/health' });
    assert.equal(res.statusCode, 200);

    // Stop server
    await stopTestServer(server);

    // Attempt connection after shutdown
    await assert.rejects(
      async () => {
        await httpRequest(port, { method: 'GET', path: '/api/health' });
      },
      (err) => {
        return err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.code === 'ERR_SERVER_NOT_RUNNING';
      }
    );
  });

  // Test 14: Direct server startup regression test
  test('14. Direct server CLI startup: node server.js starts and listens on configured port', { timeout: 15_000 }, async () => {
    const testPort = 3199;
    const serverFilePath = path.resolve(fileURLToPath(import.meta.url), '../../server.js');

    const proc = spawn('node', [serverFilePath], {
      env: { ...process.env, PORT: String(testPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdoutData = '';
    proc.stdout.on('data', (d) => { stdoutData += d.toString(); });

    try {
      // Wait for server to announce listening
      const started = await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (stdoutData.includes('Listening on http')) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          resolve(false);
        }, 5000);
      });

      assert.ok(started, `Server should print listening message. Output was: ${stdoutData}`);

      // Query health check
      const res = await httpRequest(testPort, { method: 'GET', path: '/api/health' });
      assert.equal(res.statusCode, 200);
      assert.ok(res.json);
      assert.equal(res.json.status, 'ok');
      assert.equal(res.json.service, 'algolab-runner');

    } finally {
      proc.kill('SIGKILL');
    }
  });
});
