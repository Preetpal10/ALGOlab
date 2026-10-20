// =============================================================================
// ALGOLAB — Automated Judging Engine Tests (Phase 14)
//
// Automated test suite for Practice Arena judging engine:
// - Output normalization policy
// - Error message path sanitization
// - Problem catalog integrity and hidden test case secrecy
// - Judging verdicts: Accepted, Wrong Answer, Compilation Error, Runtime Error,
//   Time Limit Exceeded, Judging Error
// - Fail-fast evaluation on submission
// - Confidentiality: hidden test inputs and expected outputs are never leaked
// - HTTP endpoints: GET /api/problems, GET /api/problems/:id, POST /api/judge
// - Real Docker container judging verification
// - Platform regression protection across Graph, Tree, Linked List, Stack, Queue
// =============================================================================

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeOutput,
  sanitizeErrorMessage,
  evaluateSolution
} from '../judge.js';

import {
  PROBLEMS,
  getPublicProblemCatalog,
  getPublicProblemById,
  getAuthoritativeProblem
} from '../problem-catalog.js';

import { createServer } from '../server.js';
import { runInContainer } from '../docker-runner.js';
import { GraphEngine } from '../../../frontend/js/graph.js';
import { TreeEngine } from '../../../frontend/js/tree.js';
import { LinkedListEngine } from '../../../frontend/js/linkedlist.js';
import { StackEngine } from '../../../frontend/js/stack.js';
import { QueueEngine } from '../../../frontend/js/queue.js';

// -----------------------------------------------------------------------------
// 1. Output Normalization & Error Sanitization
// -----------------------------------------------------------------------------

describe('1. Output Normalization & Error Sanitization', () => {

  test('Normalizes trailing/leading whitespace and CRLF line endings', () => {
    const raw = '  \r\n5 4 3 2 1 \r\n \r\n';
    assert.equal(normalizeOutput(raw), '5 4 3 2 1');
  });

  test('Collapses multiple spaces and tabs within lines', () => {
    const raw = '1   2\t\t3   4';
    assert.equal(normalizeOutput(raw), '1 2 3 4');
  });

  test('Normalizes multi-line outputs while preserving line structure', () => {
    const raw = '  Line 1   \r\n   Line 2  ';
    assert.equal(normalizeOutput(raw), 'Line 1\nLine 2');
  });

  test('Sanitizes internal container build paths from compiler errors', () => {
    const raw = '/sandbox/build/Solution.java:5: error: cannot find symbol';
    assert.equal(sanitizeErrorMessage(raw), 'Solution.java:5: error: cannot find symbol');
  });

  test('Sanitizes host filesystem paths and Docker job IDs', () => {
    const raw = 'Error in C:\\Users\\user\\job\\Solution.java from container algolab-run-abc-123';
    assert.equal(sanitizeErrorMessage(raw), 'Error in Solution.java from container sandbox');
  });
});

// -----------------------------------------------------------------------------
// 2. Problem Catalog & Hidden Test Secrecy
// -----------------------------------------------------------------------------

describe('2. Problem Catalog & Confidentiality', () => {

  test('Catalog defines all 5 required foundational DSA problems', () => {
    const expectedIds = ['reverse-array', 'find-largest', 'linear-search', 'binary-search', 'move-zeros'];
    for (const id of expectedIds) {
      assert.ok(PROBLEMS[id], `Problem "${id}" must exist in catalog`);
      assert.ok(PROBLEMS[id].title);
      assert.ok(PROBLEMS[id].difficulty);
      assert.ok(PROBLEMS[id].topic);
      assert.ok(PROBLEMS[id].starterCode);
      assert.ok(PROBLEMS[id].sampleCases.length >= 2);
      assert.ok(PROBLEMS[id].hiddenCases.length >= 3);
    }
  });

  test('CRITICAL: Public catalog completely strips hidden test cases', () => {
    const publicCatalog = getPublicProblemCatalog();
    assert.equal(publicCatalog.length, 5);

    for (const p of publicCatalog) {
      assert.equal(p.hiddenCases, undefined, `Public problem "${p.id}" must NOT have hiddenCases`);
      assert.ok(Array.isArray(p.sampleCases));
      assert.ok(p.sampleCases.length >= 2);
    }
  });

  test('CRITICAL: getPublicProblemById completely strips hidden test cases', () => {
    const p = getPublicProblemById('reverse-array');
    assert.notEqual(p, null);
    assert.equal(p.hiddenCases, undefined);
    assert.equal(p.id, 'reverse-array');
  });

  test('Authoritative problem preserves both sample and hidden test cases for server judging', () => {
    const auth = getAuthoritativeProblem('reverse-array');
    assert.notEqual(auth, null);
    assert.ok(Array.isArray(auth.sampleCases));
    assert.ok(Array.isArray(auth.hiddenCases));
    assert.equal(auth.sampleCases.length + auth.hiddenCases.length, 5);
  });
});

// -----------------------------------------------------------------------------
// 3. Judging Engine Logic & Verdicts
// -----------------------------------------------------------------------------

describe('3. Judging Engine Verdicts (Hermetic & Deterministic)', () => {

  test('Verdict: Accepted when all test cases match expected output', async () => {
    // Mock runner that returns exact expected output for each test
    const mockRunner = async ({ stdin }) => {
      let stdout = '';
      if (stdin.includes('1 2 3 4 5')) stdout = '5 4 3 2 1';
      else if (stdin.includes('10 20 30')) stdout = '30 20 10';
      else if (stdin.includes('42')) stdout = '42';
      else if (stdin.includes('-5 0 8 -2')) stdout = '-2 8 0 -5';
      else if (stdin.includes('7 7 1 7 2 3')) stdout = '3 2 7 1 7 7';

      return {
        outcome: 'success',
        exitEvent: { exitCode: 0, stdout, stderr: '' },
        timedOut: false
      };
    };

    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: 'public class Solution {}',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, true);
    assert.equal(result.verdict, 'Accepted');
    assert.equal(result.passedCount, 5);
    assert.equal(result.totalCount, 5);
  });

  test('Verdict: Wrong Answer when output fails on a sample test case', async () => {
    const mockRunner = async () => ({
      outcome: 'success',
      exitEvent: { exitCode: 0, stdout: 'Wrong Answer Output', stderr: '' },
      timedOut: false
    });

    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: 'public class Solution {}',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Wrong Answer');
    assert.equal(result.failedTestCase, 1);
    assert.equal(result.passedCount, 0);
    // Because it failed on a visible sample test (case 1), input and expected can be displayed
    assert.equal(result.input, '5\n1 2 3 4 5');
    assert.equal(result.expectedOutput, '5 4 3 2 1');
  });

  test('CRITICAL: Wrong Answer on a HIDDEN test case redacts input and expected output', async () => {
    // Pass sample tests (1 and 2), fail on hidden test (3)
    let callCount = 0;
    const mockRunner = async ({ stdin }) => {
      callCount++;
      if (callCount === 1) return { outcome: 'success', exitEvent: { exitCode: 0, stdout: '5 4 3 2 1' } };
      if (callCount === 2) return { outcome: 'success', exitEvent: { exitCode: 0, stdout: '30 20 10' } };
      // Case 3 (hidden) fails!
      return { outcome: 'success', exitEvent: { exitCode: 0, stdout: 'Incorrect' } };
    };

    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: 'public class Solution {}',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Wrong Answer');
    assert.equal(result.failedTestCase, 3);
    assert.equal(result.passedCount, 2);
    // Hidden test details MUST be redacted
    assert.equal(result.input, '[Hidden Test Case]');
    assert.equal(result.expectedOutput, '[Hidden Test Case]');
    assert.equal(result.actualOutput, '[Hidden Test Case]');
  });

  test('Verdict: Compilation Error halts execution immediately', async () => {
    const mockRunner = async () => ({
      outcome: 'compilation_error',
      stderr: '/sandbox/build/Solution.java:3: error: ; expected',
      timedOut: false
    });

    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: 'class BadCode',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Compilation Error');
    assert.match(result.error, /Solution\.java:3: error: ; expected/);
  });

  test('Verdict: Time Limit Exceeded when execution times out', async () => {
    const mockRunner = async () => ({
      outcome: 'timeout',
      timedOut: true
    });

    const result = await evaluateSolution({
      problemId: 'find-largest',
      code: 'public class Solution {}',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Time Limit Exceeded');
    assert.equal(result.failedTestCase, 1);
  });

  test('Verdict: Runtime Error when program exits non-zero or crashes', async () => {
    const mockRunner = async () => ({
      outcome: 'runtime_error',
      exitEvent: { exitCode: 1, stderr: 'java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 5' }
    });

    const result = await evaluateSolution({
      problemId: 'find-largest',
      code: 'public class Solution {}',
      mode: 'submit',
      runner: mockRunner
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Runtime Error');
    assert.match(result.error, /ArrayIndexOutOfBoundsException/);
  });

  test('Sample Mode evaluates only visible test cases and returns all diagnostics', async () => {
    const mockRunner = async ({ stdin }) => ({
      outcome: 'success',
      exitEvent: { exitCode: 0, stdout: '9' }
    });

    const result = await evaluateSolution({
      problemId: 'find-largest',
      code: 'public class Solution {}',
      mode: 'sample',
      runner: mockRunner
    });

    assert.equal(result.mode, 'sample');
    assert.ok(Array.isArray(result.sampleResults));
    assert.equal(result.sampleResults.length, 2); // 2 visible sample cases
    assert.equal(result.sampleResults[0].passed, true);
    assert.equal(result.sampleResults[1].passed, false); // Expected 15, got 9
    assert.equal(result.verdict, 'Wrong Answer');
  });

  test('Rejects unknown problem ID with descriptive error', async () => {
    const result = await evaluateSolution({
      problemId: 'quantum-sorting',
      code: 'public class Solution {}'
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Judging Error');
    assert.match(result.error, /Unknown problem ID/);
  });

  test('Rejects empty source code', async () => {
    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: '   '
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Judging Error');
  });

  test('Rejects oversized source code (>64 KB)', async () => {
    const hugeCode = 'a'.repeat(70 * 1024);
    const result = await evaluateSolution({
      problemId: 'reverse-array',
      code: hugeCode
    });

    assert.equal(result.success, false);
    assert.equal(result.verdict, 'Judging Error');
    assert.match(result.error, /maximum allowed size/);
  });
});

// -----------------------------------------------------------------------------
// 4. Server HTTP Routes: Problems & Judge
// -----------------------------------------------------------------------------

describe('4. Server HTTP Routes (/api/problems and /api/judge)', () => {

  test('GET /api/problems returns public catalog without hidden test cases', async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/problems`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.problems));
      assert.equal(data.problems.length, 5);

      for (const p of data.problems) {
        assert.equal(p.hiddenCases, undefined);
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('GET /api/problems/:id returns problem details or 404', async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const resGood = await fetch(`http://127.0.0.1:${port}/api/problems/linear-search`);
      assert.equal(resGood.status, 200);
      const data = await resGood.json();
      assert.equal(data.problem.id, 'linear-search');
      assert.equal(data.problem.hiddenCases, undefined);

      const resBad = await fetch(`http://127.0.0.1:${port}/api/problems/missing-problem`);
      assert.equal(resBad.status, 404);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('POST /api/judge rejects non-JSON content-type with 415', async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'code'
      });
      assert.equal(res.status, 415);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('POST /api/judge evaluates solution and returns verdict', async () => {
    const mockRunner = async ({ stdin }) => ({
      outcome: 'success',
      exitEvent: { exitCode: 0, stdout: '5 4 3 2 1' }
    });

    const server = createServer({ runner: mockRunner });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/judge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: 'reverse-array',
          code: 'public class Solution {}',
          mode: 'sample'
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.mode, 'sample');
      assert.ok(data.verdict);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});

// -----------------------------------------------------------------------------
// 5. Genuine Docker Judging Execution (End-to-End)
// -----------------------------------------------------------------------------

describe('5. Genuine Docker Container Judging Execution', () => {

  test('Evaluates real Java solution inside Docker container for find-largest (sample mode)', { timeout: 45_000 }, async () => {
    const realJavaCode = `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            int val = sc.nextInt();
            if (val > max) max = val;
        }
        System.out.println(max);
    }
}
`;

    // Real Docker execution against find-largest visible sample tests
    const result = await evaluateSolution({
      problemId: 'find-largest',
      code: realJavaCode,
      mode: 'sample',
      runner: runInContainer
    });


    assert.equal(result.success, true);
    assert.equal(result.verdict, 'Accepted');
    assert.equal(result.passedCount, 2);
    assert.equal(result.totalCount, 2);
    assert.equal(result.sampleResults[0].passed, true);
    assert.equal(result.sampleResults[1].passed, true);
  });
});

// -----------------------------------------------------------------------------
// 6. Platform Regression Protection
// -----------------------------------------------------------------------------

describe('6. Platform Regression Safety', () => {

  test('GraphEngine operates regression-free', () => {
    const graph = new GraphEngine();
    graph.addNode('A');
    graph.addNode('B');
    graph.addEdge('A', 'B');
    const bfs = graph.bfs('A');
    assert.ok(bfs.length > 0);
  });

  test('TreeEngine operates regression-free', () => {
    const tree = new TreeEngine([50, 30, 70]);
    assert.equal(tree.size(), 3);
  });

  test('LinkedListEngine operates regression-free', () => {
    const ll = new LinkedListEngine();
    ll.insertHead(10);
    assert.equal(ll.size(), 1);
  });

  test('StackEngine and QueueEngine operate regression-free', () => {
    const stack = new StackEngine();
    stack.push(1);
    assert.equal(stack.elements.length, 1);

    const queue = new QueueEngine();
    queue.enqueue(1);
    assert.equal(queue.elements.length, 1);
  });
});
