// =============================================================================
// ALGOLAB — Submission History & Problem Progress Test Suite (Phase 15)
//
// Tests persistent submission recording on /api/judge, strict authorization
// isolation between students, progress tracking on Accepted vs Failed verdicts,
// unique problem statistics, and anonymous judging compatibility.
// =============================================================================

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../server.js';
import { setMockDriver } from '../db/connection.js';
import { MockDatabase } from './mock-db.js';

describe('Phase 15: Submission Persistence, Authorization & Progress Tracking', () => {
  let server;
  let baseUrl;
  let mockDb;
  let userACookie;
  let userBCookie;
  let userAId;
  let userBId;

  before(async () => {
    mockDb = new MockDatabase();
    setMockDriver(mockDb);

    // Mock runner simulating compilation and output
    const mockRunner = async ({ code, stdin }) => {
      if (code.includes('COMPILE_ERROR')) {
        return { outcome: 'compilation_error', errorEvent: { message: 'Syntax error' } };
      }
      if (code.includes('RUNTIME_ERROR')) {
        return { outcome: 'runtime_error', stderr: 'NullPointerException' };
      }
      if (code.includes('WRONG_ANSWER')) {
        return { outcome: 'success', exitEvent: { stdout: 'wrong output', exitCode: 0 } };
      }
      // Accurately solve reverse-array or find-largest based on stdin
      if (stdin) {
        const lines = stdin.trim().split('\n');
        if (lines.length >= 2) {
          const numbers = lines[1].trim().split(/\s+/).filter(Boolean).map(Number);
          if (code.includes('find-largest') || stdin.includes('3 9 1 7 4') || stdin.includes('15 8 15')) {
            const max = Math.max(...numbers);
            return { outcome: 'success', exitEvent: { stdout: String(max), exitCode: 0 } };
          }
          const reversed = [...numbers].reverse().join(' ');
          return { outcome: 'success', exitEvent: { stdout: reversed, exitCode: 0 } };
        }
        if (lines.length === 1 && lines[0].trim()) {
          return { outcome: 'success', exitEvent: { stdout: lines[0].trim(), exitCode: 0 } };
        }
      }
      return { outcome: 'success', exitEvent: { stdout: '0', exitCode: 0 } };
    };

    server = createServer({ runner: mockRunner });
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

  beforeEach(async () => {
    mockDb.reset();

    // Register Student A
    const resA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student A',
        email: 'studentA@algolab.org',
        password: 'Password123',
        confirmPassword: 'Password123'
      })
    });
    userACookie = resA.headers.get('set-cookie').split(';')[0];
    const dataA = await resA.json();
    userAId = dataA.user.id;

    // Register Student B
    const resB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Student B',
        email: 'studentB@algolab.org',
        password: 'Password456',
        confirmPassword: 'Password456'
      })
    });
    userBCookie = resB.headers.get('set-cookie').split(';')[0];
    const dataB = await resB.json();
    userBId = dataB.user.id;
  });

  // ---------------------------------------------------------------------------
  // A. SUBMISSION PERSISTENCE & HISTORY
  // ---------------------------------------------------------------------------

  test('1. Authenticated submission in submit mode is persisted to database with authoritative verdict', async () => {
    const res = await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userACookie
      },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* correct code */ }',
        mode: 'submit'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.verdict, 'Accepted');

    // Verify submission exists in Student A's history
    const histRes = await fetch(`${baseUrl}/api/submissions`, {
      headers: { Cookie: userACookie }
    });
    assert.equal(histRes.status, 200);
    const hist = await histRes.json();
    assert.equal(hist.total, 1);
    assert.equal(hist.submissions[0].problemId, 'reverse-array');
    assert.equal(hist.submissions[0].verdict, 'Accepted');
    assert.equal(hist.submissions[0].userId, userAId);
  });

  test('2. Wrong Answer and Compilation Error are saved with correct verdicts', async () => {
    // Submit Wrong Answer
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { // WRONG_ANSWER }',
        mode: 'submit'
      })
    });

    // Submit Compilation Error
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { // COMPILE_ERROR }',
        mode: 'submit'
      })
    });

    const histRes = await fetch(`${baseUrl}/api/submissions`, {
      headers: { Cookie: userACookie }
    });
    const hist = await histRes.json();
    assert.equal(hist.total, 2);
    const verdicts = hist.submissions.map(s => s.verdict);
    assert.ok(verdicts.includes('Wrong Answer'));
    assert.ok(verdicts.includes('Compilation Error'));
  });

  test('3. Anonymous submissions are evaluated without saving to any user history', async () => {
    const res = await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* anon */ }',
        mode: 'submit'
      })
    });
    assert.equal(res.status, 200);

    // Verify no submission was stored in database
    assert.equal(mockDb.submissions.size, 0);
  });

  // ---------------------------------------------------------------------------
  // B. STRICT AUTHORIZATION ISOLATION
  // ---------------------------------------------------------------------------

  test('4. CRITICAL: Student A cannot retrieve Student B submission (strict data isolation)', async () => {
    // Student B creates a submission
    const resJudgeB = await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
      body: JSON.stringify({
        problemId: 'find-largest',
        code: 'public class Solution { // Secret code belonging to Student B }',
        mode: 'submit'
      })
    });
    assert.equal(resJudgeB.status, 200);

    // Find submission ID
    const histB = await (await fetch(`${baseUrl}/api/submissions`, { headers: { Cookie: userBCookie } })).json();
    const submissionIdB = histB.submissions[0].id;

    // Student B can view their own submission
    const accessByB = await fetch(`${baseUrl}/api/submissions/${submissionIdB}`, {
      headers: { Cookie: userBCookie }
    });
    assert.equal(accessByB.status, 200);
    const dataByB = await accessByB.json();
    assert.ok(dataByB.submission.sourceCode.includes('Secret code belonging to Student B'));

    // Student A attempts to access Student B's submission ID -> MUST RETURN 404 Not Found / Access Denied!
    const accessByA = await fetch(`${baseUrl}/api/submissions/${submissionIdB}`, {
      headers: { Cookie: userACookie }
    });
    assert.equal(accessByA.status, 404);
  });

  test('5. Unauthenticated requests to /api/submissions and /api/progress return 401', async () => {
    const subRes = await fetch(`${baseUrl}/api/submissions`);
    assert.equal(subRes.status, 401);

    const progRes = await fetch(`${baseUrl}/api/progress`);
    assert.equal(progRes.status, 401);
  });

  // ---------------------------------------------------------------------------
  // C. PROGRESS TRACKING & REPEATED SUBMISSIONS
  // ---------------------------------------------------------------------------

  test('6. Progress marks problem solved ONLY on Accepted; Wrong Answer does not mark solved', async () => {
    // Wrong Answer on reverse-array
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { // WRONG_ANSWER }',
        mode: 'submit'
      })
    });

    let prog = await (await fetch(`${baseUrl}/api/progress`, { headers: { Cookie: userACookie } })).json();
    assert.equal(prog.uniqueSolved, 0);
    assert.equal(prog.uniqueAttempted, 1);
    assert.equal(prog.attemptedUnsolvedProblems.length, 1);
    assert.equal(prog.attemptedUnsolvedProblems[0].problemId, 'reverse-array');

    // Now Accepted on reverse-array
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* correct */ }',
        mode: 'submit'
      })
    });

    prog = await (await fetch(`${baseUrl}/api/progress`, { headers: { Cookie: userACookie } })).json();
    assert.equal(prog.uniqueSolved, 1);
    assert.equal(prog.uniqueAttempted, 1);
    assert.equal(prog.solvedProblems.length, 1);
    assert.equal(prog.solvedProblems[0].problemId, 'reverse-array');
    assert.equal(prog.attemptedUnsolvedProblems.length, 0);
  });

  test('7. Repeated Accepted submissions do NOT increment unique solved count', async () => {
    // First Accepted
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* solve 1 */ }',
        mode: 'submit'
      })
    });

    // Second Accepted to SAME problem
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* solve 2 */ }',
        mode: 'submit'
      })
    });

    // Third Accepted to SAME problem
    await fetch(`${baseUrl}/api/judge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        problemId: 'reverse-array',
        code: 'public class Solution { /* solve 3 */ }',
        mode: 'submit'
      })
    });

    const prog = await (await fetch(`${baseUrl}/api/progress`, { headers: { Cookie: userACookie } })).json();
    assert.equal(prog.uniqueSolved, 1, 'Repeated Accepted submissions must not duplicate solved count');
    assert.equal(prog.uniqueAttempted, 1);
    assert.equal(prog.totalSubmissions, 3);
    assert.equal(prog.acceptanceRate, 100);
  });
});
