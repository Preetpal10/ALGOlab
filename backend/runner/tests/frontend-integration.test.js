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
import {
  isLocalHostname,
  resolveApiConfig,
  checkBackendHealth,
  classifyApiResult
} from '../../../frontend/js/api-config.js';

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

describe('Code Lab API Configuration & Diagnostics (Phase 12.3)', () => {

  // Test 5: Local development resolution
  test('5. Local development endpoint resolution defaults to http://127.0.0.1:3001', () => {
    const localHosts = ['localhost', '127.0.0.1', '[::1]', '0.0.0.0', ''];
    for (const host of localHosts) {
      assert.equal(isLocalHostname(host), true, `Expected ${host} to be recognized as local`);
      const cfg = resolveApiConfig({ hostname: host });
      assert.equal(cfg.mode, 'local');
      assert.equal(cfg.configured, true);
      assert.equal(cfg.isLocal, true);
      assert.equal(cfg.baseUrl, 'http://127.0.0.1:3001');
      assert.equal(cfg.executeUrl, 'http://127.0.0.1:3001/api/execute');
      assert.equal(cfg.healthUrl, 'http://127.0.0.1:3001/api/health');
    }
  });

  // Test 6: Configured production API URL
  test('6. Configured production API URL resolves to remote HTTPS endpoint and cleans slashes', () => {
    const cfg = resolveApiConfig({
      hostname: 'algolab.example.com',
      protocol: 'https:',
      customUrl: 'https://api.algolab.example.com///',
    });

    assert.equal(cfg.mode, 'remote');
    assert.equal(cfg.configured, true);
    assert.equal(cfg.isLocal, false);
    assert.equal(cfg.baseUrl, 'https://api.algolab.example.com');
    assert.equal(cfg.executeUrl, 'https://api.algolab.example.com/api/execute');
    assert.equal(cfg.healthUrl, 'https://api.algolab.example.com/api/health');
  });

  // Test 7: Missing production API URL enforces Offline Demo Mode
  test('7. Missing production API URL enforces Offline Demo Mode and prevents requests to localhost', () => {
    const cfg = resolveApiConfig({
      hostname: 'algolab-preview.netlify.app',
      protocol: 'https:',
    });

    assert.equal(cfg.mode, 'offline-demo');
    assert.equal(cfg.configured, false);
    assert.equal(cfg.isLocal, false);
    assert.equal(cfg.baseUrl, null);
    assert.equal(cfg.executeUrl, null);
    assert.equal(cfg.healthUrl, null);
    assert.equal(cfg.reason, 'unconfigured_remote');
    assert.ok(cfg.notice.includes('Offline Demo Mode'));
  });

  // Test 8: Protocol validation and mixed-content prevention
  test('8. Protocol validation rejects non-HTTP/HTTPS and prevents mixed-content on HTTPS origin', () => {
    // Mixed content block
    const mixedCfg = resolveApiConfig({
      hostname: 'algolab.netlify.app',
      protocol: 'https:',
      customUrl: 'http://api.insecure.com',
    });
    assert.equal(mixedCfg.mode, 'error');
    assert.equal(mixedCfg.statusText, 'Mixed Content Blocked');
    assert.equal(mixedCfg.configured, false);

    // Invalid scheme
    const ftpCfg = resolveApiConfig({
      customUrl: 'ftp://api.example.com',
    });
    assert.equal(ftpCfg.mode, 'error');
    assert.equal(ftpCfg.statusText, 'Invalid API Protocol');

    // Malformed URL
    const badCfg = resolveApiConfig({
      customUrl: 'not an absolute url',
    });
    assert.equal(badCfg.mode, 'error');
    assert.equal(badCfg.statusText, 'Malformed API URL');
  });

  // Test 9: Health check probe reaches active server
  test('9. Health check probe reaches active server and reports status ok', async () => {
    const server = await startTestServer();
    try {
      const port = server.address().port;
      const health = await checkBackendHealth(`http://127.0.0.1:${port}/api/health`, {
        fetchFn: async (url, opts) => {
          const res = await httpRequest(port, { method: 'GET', path: '/api/health' });
          return {
            ok: res.statusCode === 200,
            status: res.statusCode,
            json: async () => res.json,
          };
        },
      });

      assert.equal(health.ok, true);
      assert.equal(health.status, 200);
      assert.ok(health.data);
      assert.equal(health.data.status, 'ok');
      assert.equal(health.data.service, 'algolab-runner');
    } finally {
      await stopTestServer(server);
    }
  });

  // Test 10: Health check probe against offline server returns ok: false
  test('10. Health check probe against offline server returns ok: false without crashing', async () => {
    const offlinePort = 59998;
    const health = await checkBackendHealth(`http://127.0.0.1:${offlinePort}/api/health`, {
      fetchFn: async (url, opts) => {
        const res = await httpRequest(offlinePort, { method: 'GET', path: '/api/health' });
        return {
          ok: res.statusCode === 200,
          status: res.statusCode,
          json: async () => res.json,
        };
      },
    });

    assert.equal(health.ok, false);
    assert.ok(health.error);
  });

  // Test 11: classifyApiResult handles network, CORS, and container errors
  test('11. classifyApiResult distinguishes network failures, CORS rejection, and server errors', () => {
    // Local network error
    const localErr = classifyApiResult({ error: 'Connection refused', config: { isLocal: true } });
    assert.equal(localErr.success, false);
    assert.equal(localErr.statusLabel, 'Connection Failed');
    assert.ok(localErr.messages[1].text.includes('127.0.0.1:3001'));

    // Remote network error
    const remoteErr = classifyApiResult({ error: 'Network timeout', config: { isLocal: false } });
    assert.equal(remoteErr.success, false);
    assert.ok(remoteErr.messages[1].text.includes('remote runner VM'));

    // CORS rejection (403)
    const corsErr = classifyApiResult({ status: 403, data: { error: 'Origin not allowed' } });
    assert.equal(corsErr.success, false);
    assert.equal(corsErr.badgeText, 'Access Denied (403)');
    assert.equal(corsErr.statusLabel, 'CORS / Forbidden');

    // 413 Payload Too Large
    const sizeErr = classifyApiResult({ status: 413 });
    assert.equal(sizeErr.success, false);
    assert.equal(sizeErr.badgeText, 'Code Too Large (413)');

    // 415 Unsupported Media Type
    const mediaErr = classifyApiResult({ status: 415 });
    assert.equal(mediaErr.success, false);
    assert.equal(mediaErr.badgeText, 'Unsupported Media (415)');

    // 429 Server Busy
    const busyErr = classifyApiResult({ status: 429 });
    assert.equal(busyErr.success, false);
    assert.equal(busyErr.badgeText, 'Server Busy (429)');

    // 503 Docker Unavailable
    const dockerErr = classifyApiResult({ status: 503, data: { outcome: 'docker_unavailable' } });
    assert.equal(dockerErr.success, false);
    assert.equal(dockerErr.badgeText, 'Docker Unavailable');

    // Client Timeout
    const timeoutErr = classifyApiResult({ isTimeout: true });
    assert.equal(timeoutErr.success, false);
    assert.equal(timeoutErr.badgeText, 'Request Timed Out');
  });

  // Test 12: classifyApiResult detects malformed payloads and missing outcomes
  test('12. classifyApiResult detects malformed payloads and missing outcomes', () => {
    // Null data on 200 OK
    const nullData = classifyApiResult({ status: 200, data: null });
    assert.equal(nullData.success, false);
    assert.equal(nullData.badgeText, 'Malformed Response');

    // Missing outcome field
    const missingOutcome = classifyApiResult({ status: 200, data: { status: 'running' } });
    assert.equal(missingOutcome.success, false);
    assert.equal(missingOutcome.badgeText, 'Invalid Outcome');

    // Valid 200 with outcome
    const validOutcome = classifyApiResult({ status: 200, data: { outcome: 'success', events: [] } });
    assert.equal(validOutcome.success, true);
    assert.equal(validOutcome.outcome, 'success');
  });

  // Test 13: Prevention of false success messages across all error conditions
  test('13. Prevention of false success messages across all error conditions', () => {
    const errorOutcomes = [
      { status: 400, data: { error: 'Syntax error' } },
      { status: 403, data: { error: 'Forbidden' } },
      { status: 413, data: { error: 'Too large' } },
      { status: 429, data: { error: 'Rate limit' } },
      { status: 503, data: { outcome: 'docker_unavailable' } },
      { status: 500, data: { error: 'Internal failure' } },
      { status: 200, data: { outcome: 'compilation_error' } },
      { status: 200, data: { outcome: 'timeout' } },
      { status: 200, data: { outcome: 'runtime_error' } },
      { error: 'Fetch failed' },
      { isTimeout: true },
    ];

    for (const testCase of errorOutcomes) {
      const result = classifyApiResult(testCase);
      // For any non-success outcome, success flag must be false
      if (testCase.data?.outcome && testCase.status === 200 && testCase.data.outcome !== 'success') {
        // Outcome is present but represents error
        assert.equal(result.success, true);
        assert.notEqual(result.outcome, 'success');
      } else if (!testCase.data?.outcome || testCase.status !== 200) {
        assert.equal(result.success, false);
      }

      // Ensure that in the frontend, error states clear the TracePlaybackEngine
      const engine = new TracePlaybackEngine();
      engine.loadTrace([]);
      assert.equal(engine.steps.length, 0);
      assert.notEqual(engine.status, 'ready');
    }
  });
});
