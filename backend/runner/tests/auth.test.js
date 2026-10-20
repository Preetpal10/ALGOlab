// =============================================================================
// ALGOLAB — Authentication & Session Test Suite (Phase 15)
//
// Tests student registration, bcrypt password hashing, login, logout,
// current user endpoints, session lifecycle, and security invariants.
// =============================================================================

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { setMockDriver } from '../db/connection.js';
import { MockDatabase } from './mock-db.js';

describe('Phase 15: Student Registration, Authentication & Sessions', () => {
  let server;
  let baseUrl;
  let mockDb;

  before(async () => {
    mockDb = new MockDatabase();
    setMockDriver(mockDb);

    server = createServer({ runner: async () => ({ outcome: 'success' }) });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
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

  // ---------------------------------------------------------------------------
  // A. REGISTRATION TESTS
  // ---------------------------------------------------------------------------

  test('1. Successful student registration creates user, hashes password, sets session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@algolab.org',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.user.name, 'Ada Lovelace');
    assert.equal(data.user.email, 'ada@algolab.org');
    assert.equal(typeof data.user.id, 'number');

    // CRITICAL: Password hash must NEVER be returned in response!
    assert.equal(data.user.password, undefined);
    assert.equal(data.user.passwordHash, undefined);
    assert.equal(data.user.password_hash, undefined);

    // Verify Set-Cookie header is present with HttpOnly and SameSite
    const cookie = res.headers.get('set-cookie');
    assert.ok(cookie);
    assert.ok(cookie.includes('algolab_session='));
    assert.ok(cookie.includes('HttpOnly'));
    assert.ok(cookie.includes('SameSite=Lax'));

    // Verify password in DB was genuinely hashed (not plaintext)
    const storedUser = mockDb.users.get(data.user.id);
    assert.ok(storedUser);
    assert.notEqual(storedUser.password_hash, 'SecurePassword123');
    assert.ok(storedUser.password_hash.startsWith('$2')); // bcrypt prefix
  });

  test('2. Registration rejects duplicate email addresses with 409 Conflict', async () => {
    // First registration
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Original Student',
        email: 'duplicate@algolab.org',
        password: 'Password123',
        confirmPassword: 'Password123'
      })
    });

    // Duplicate attempt
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: 'DUPLICATE@algolab.org', // Case-insensitive duplicate check
        password: 'OtherPassword456',
        confirmPassword: 'OtherPassword456'
      })
    });

    assert.equal(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes('already exists'));
  });

  test('3. Registration validates invalid email, short password, and mismatched confirmation', async () => {
    // Invalid email
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'not-an-email',
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123'
      })
    });
    assert.equal(res1.status, 400);

    // Password too short (< 8 chars)
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'valid@algolab.org',
        password: 'short',
        confirmPassword: 'short'
      })
    });
    assert.equal(res2.status, 400);
    const data2 = await res2.json();
    assert.ok(data2.error.includes('at least 8 characters'));

    // Password mismatch
    const res3 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'valid@algolab.org',
        password: 'Password123',
        confirmPassword: 'PasswordMismatch'
      })
    });
    assert.equal(res3.status, 400);
    const data3 = await res3.json();
    assert.ok(data3.error.includes('do not match'));
  });

  // ---------------------------------------------------------------------------
  // B. LOGIN & LOGOUT TESTS
  // ---------------------------------------------------------------------------

  test('4. Successful student login returns session cookie and user profile', async () => {
    // Register account
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Grace Hopper',
        email: 'grace@algolab.org',
        password: 'CompilerPioneer1952',
        confirmPassword: 'CompilerPioneer1952'
      })
    });

    // Login with correct credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'grace@algolab.org',
        password: 'CompilerPioneer1952'
      })
    });

    assert.equal(loginRes.status, 200);
    const data = await loginRes.json();
    assert.equal(data.user.name, 'Grace Hopper');
    assert.equal(data.user.email, 'grace@algolab.org');

    const cookie = loginRes.headers.get('set-cookie');
    assert.ok(cookie);
    assert.ok(cookie.includes('algolab_session='));
  });

  test('5. Login with incorrect password or non-existent email returns generic 401', async () => {
    // Wrong password for existing user
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alan Turing',
        email: 'alan@algolab.org',
        password: 'EnigmaCracked1940',
        confirmPassword: 'EnigmaCracked1940'
      })
    });

    const resWrongPass = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alan@algolab.org',
        password: 'WrongPassword'
      })
    });
    assert.equal(resWrongPass.status, 401);
    const dataWrongPass = await resWrongPass.json();
    assert.equal(dataWrongPass.error, 'Invalid email or password.');

    // Non-existent email (must return IDENTICAL generic error to prevent account enumeration)
    const resUnknown = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'does-not-exist@algolab.org',
        password: 'SomePassword123'
      })
    });
    assert.equal(resUnknown.status, 401);
    const dataUnknown = await resUnknown.json();
    assert.equal(dataUnknown.error, 'Invalid email or password.');
  });

  test('6. Student logout invalidates session on server and clears cookie', async () => {
    // Register and get cookie
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Katherine Johnson',
        email: 'katherine@algolab.org',
        password: 'ApolloTrajectory11',
        confirmPassword: 'ApolloTrajectory11'
      })
    });
    const cookie = regRes.headers.get('set-cookie').split(';')[0];

    // Call logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie }
    });
    assert.equal(logoutRes.status, 200);

    // Verify clear cookie header
    const clearCookie = logoutRes.headers.get('set-cookie');
    assert.ok(clearCookie.includes('Max-Age=0'));

    // Verify session is no longer valid on /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: cookie }
    });
    assert.equal(meRes.status, 401);
  });

  // ---------------------------------------------------------------------------
  // C. CURRENT USER ENDPOINT (/api/auth/me)
  // ---------------------------------------------------------------------------

  test('7. /api/auth/me returns current student when authenticated, 401 when anonymous', async () => {
    // Anonymous request
    const anonRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(anonRes.status, 401);
    const anonData = await anonRes.json();
    assert.equal(anonData.authenticated, false);

    // Authenticated request
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Claude Shannon',
        email: 'shannon@algolab.org',
        password: 'InformationTheory1948',
        confirmPassword: 'InformationTheory1948'
      })
    });
    const cookie = regRes.headers.get('set-cookie').split(';')[0];

    const authRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie }
    });
    assert.equal(authRes.status, 200);
    const authData = await authRes.json();
    assert.equal(authData.authenticated, true);
    assert.equal(authData.user.name, 'Claude Shannon');
    assert.equal(authData.user.email, 'shannon@algolab.org');
  });

  test('8. Database outage returns clean 503 without crashing server process', async () => {
    mockDb.setHealthy(false);

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fail Test',
        email: 'fail@algolab.org',
        password: 'ValidPassword123',
        confirmPassword: 'ValidPassword123'
      })
    });

    assert.equal(res.status, 503);
    const data = await res.json();
    assert.ok(data.error.includes('unavailable'));

    mockDb.setHealthy(true);
  });
});
