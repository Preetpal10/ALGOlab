// =============================================================================
// ALGOLAB — Lab State Persistence & Authorization Tests (Phase 15)
//
// Tests saving, retrieving, and student isolation of lab states across Code Lab,
// Practice Arena, and data structure labs.
// =============================================================================

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServer } from '../server.js';
import { setMockDriver } from '../db/connection.js';
import { MockDatabase } from './mock-db.js';

let server;
let port;
let mockDb;

function httpRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: { ...headers }
    };

    if (body !== null && typeof body === 'string') {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let json = null;
        try { json = JSON.parse(raw); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          raw,
          json
        });
      });
    });

    req.on('error', reject);
    if (body !== null) req.write(body);
    req.end();
  });
}

function extractCookieValue(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  const match = cookieStr.match(/algolab_session=([^;]+)/);
  return match ? match[1] : null;
}

describe('Phase 15: Lab State Persistence & Student Isolation', () => {
  before(async () => {
    mockDb = new MockDatabase();
    setMockDriver(mockDb);

    server = createServer();
    await new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
      server.on('error', reject);
    });
  });

  after(async () => {
    setMockDriver(null);
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  beforeEach(() => {
    mockDb.reset();
  });

  test('1. Unauthenticated request to /api/lab-state returns 401', async () => {
    const res = await httpRequest({
      method: 'GET',
      path: '/api/lab-state/codelab'
    });

    assert.equal(res.statusCode, 401);
    assert.ok(res.json.error.includes('Authentication required'));
  });

  test('2. Authenticated student can save and retrieve Code Lab state', async () => {
    // 1. Register student
    const regRes = await httpRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Turing',
        email: 'alice@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    assert.equal(regRes.statusCode, 201);
    const sessionToken = extractCookieValue(regRes.headers['set-cookie']);

    // 2. Save Code Lab state
    const codeLabState = {
      code: 'public class Custom { public static void main(String[] args) { System.out.println("Hello"); } }',
      template: 'custom',
      problemId: null,
      timestamp: Date.now()
    };

    const saveRes = await httpRequest({
      method: 'PUT',
      path: '/api/lab-state/codelab',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `algolab_session=${sessionToken}`
      },
      body: JSON.stringify(codeLabState)
    });

    assert.equal(saveRes.statusCode, 200);
    assert.equal(saveRes.json.success, true);
    assert.equal(saveRes.json.labId, 'codelab');

    // 3. Retrieve Code Lab state
    const getRes = await httpRequest({
      method: 'GET',
      path: '/api/lab-state/codelab',
      headers: {
        Cookie: `algolab_session=${sessionToken}`
      }
    });

    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.json.labId, 'codelab');
    assert.equal(getRes.json.state.template, 'custom');
    assert.ok(getRes.json.state.code.includes('Alice') || getRes.json.state.code.includes('Custom'));
  });

  test('3. CRITICAL: Strict Student Isolation — Student A cannot access Student B lab state', async () => {
    // Register Student A
    const resA = await httpRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student A',
        email: 'student.a@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const tokenA = extractCookieValue(resA.headers['set-cookie']);

    // Register Student B
    const resB = await httpRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student B',
        email: 'student.b@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const tokenB = extractCookieValue(resB.headers['set-cookie']);

    // Student A saves secret code in Code Lab
    await httpRequest({
      method: 'PUT',
      path: '/api/lab-state/codelab',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `algolab_session=${tokenA}`
      },
      body: JSON.stringify({
        code: '// PRIVATE_SECRET_CODE_FROM_STUDENT_A',
        template: 'bubble-sort'
      })
    });

    // Student B attempts to read Student A's codelab state
    const resBRead = await httpRequest({
      method: 'GET',
      path: '/api/lab-state/codelab',
      headers: {
        Cookie: `algolab_session=${tokenB}`
      }
    });

    // Student B must NOT see Student A's code; they receive 404 (No saved state for Student B)
    assert.equal(resBRead.statusCode, 404);
    assert.ok(resBRead.json.error.includes('No saved state found'));
  });

  test('4. Saving state overwrites previous state cleanly (upsert)', async () => {
    const regRes = await httpRequest({
      method: 'POST',
      path: '/api/auth/register',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const token = extractCookieValue(regRes.headers['set-cookie']);

    // Save initial stack state
    await httpRequest({
      method: 'PUT',
      path: '/api/lab-state/stack',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `algolab_session=${token}`
      },
      body: JSON.stringify({ elements: [10, 20] })
    });

    // Overwrite with new stack state
    await httpRequest({
      method: 'PUT',
      path: '/api/lab-state/stack',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `algolab_session=${token}`
      },
      body: JSON.stringify({ elements: [10, 20, 30, 40] })
    });

    // Retrieve state
    const res = await httpRequest({
      method: 'GET',
      path: '/api/lab-state/stack',
      headers: {
        Cookie: `algolab_session=${token}`
      }
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json.state.elements, [10, 20, 30, 40]);
  });
});
