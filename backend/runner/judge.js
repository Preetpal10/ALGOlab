// =============================================================================
// ALGOLAB — Automated Java Judging Engine (Phase 14)
//
// Evaluates student Java solutions against authoritative problem test suites
// using the isolated Docker execution sandbox (docker-runner.js).
//
// VERDICTS:
// - Accepted: Solution passed all authoritative test cases.
// - Wrong Answer: Actual output did not match expected output.
// - Compilation Error: javac failed to compile the source code.
// - Runtime Error: Program threw an unhandled exception or exited non-zero.
// - Time Limit Exceeded: Execution exceeded the allotted time limit.
// - Judging Error: Invalid problem ID, invalid payload, or infrastructure error.
//
// SECURITY & CONFIDENTIALITY:
// - Untrusted code is NEVER executed in the Node.js server.
// - Hidden test cases are NEVER returned in API responses.
// - Client cannot supply, override, or alter test cases.
// - Compiler and runtime diagnostic strings are sanitized of internal paths.
// =============================================================================

import { runInContainer } from './docker-runner.js';
import { getAuthoritativeProblem } from './problem-catalog.js';

/**
 * Normalizes program output for robust comparison:
 * - Normalizes CRLF (\r\n) to LF (\n)
 * - Trims leading and trailing whitespace from the full text
 * - Normalizes multiple spaces/tabs within lines
 * - Removes empty trailing lines
 *
 * @param {string} str
 * @returns {string}
 */
export function normalizeOutput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .trim();
}

/**
 * Sanitizes compiler and runtime error messages, removing internal container
 * or host filesystem paths, Docker job IDs, and system artifacts.
 *
 * @param {string} rawError
 * @returns {string}
 */
export function sanitizeErrorMessage(rawError) {
  if (typeof rawError !== 'string') return '';
  return rawError
    .replace(/\/sandbox\/build\/[A-Za-z0-9_-]+\.java/g, 'Solution.java')
    .replace(/[A-Za-z]:\\[^:\n\r]+[\\/]([A-Za-z0-9_-]+\.java)/g, '$1')
    .replace(/algolab[-_]run[-_][a-f0-9-]+/gi, 'sandbox')
    .replace(/\/tmp\/algolab_job_[a-f0-9-]+/gi, '/sandbox')
    .trim();
}

/**
 * Evaluates a Java solution against authoritative test cases.
 *
 * @param {object} options
 * @param {string} options.problemId - ID from problem catalog
 * @param {string} options.code - Java source code
 * @param {'submit'|'sample'} [options.mode='submit'] - Evaluation mode
 * @param {Function} [options.runner=runInContainer] - Execution function
 * @returns {Promise<JudgeResult>}
 */
export async function evaluateSolution({
  problemId,
  code,
  mode = 'submit',
  runner = runInContainer
}) {
  // 1. Validate Problem ID
  const problem = getAuthoritativeProblem(problemId);
  if (!problem) {
    return {
      success: false,
      verdict: 'Judging Error',
      error: `Unknown problem ID: "${problemId}". Problem does not exist in catalog.`,
      passedCount: 0,
      totalCount: 0
    };
  }

  // 2. Validate Code Payload
  if (typeof code !== 'string' || code.trim().length === 0) {
    return {
      success: false,
      verdict: 'Judging Error',
      error: 'Submitted code must be a non-empty string.',
      passedCount: 0,
      totalCount: 0
    };
  }

  const codeBytes = Buffer.byteLength(code, 'utf-8');
  if (codeBytes > 64 * 1024) {
    return {
      success: false,
      verdict: 'Judging Error',
      error: `Source code exceeds maximum allowed size (${codeBytes} > 65536 bytes).`,
      passedCount: 0,
      totalCount: 0
    };
  }

  // 3. Select Test Cases based on Mode
  const isSampleMode = mode === 'sample';
  const testCases = isSampleMode
    ? problem.sampleCases
    : [...problem.sampleCases, ...problem.hiddenCases];

  const totalCount = testCases.length;
  let passedCount = 0;
  const sampleResults = [];
  let totalExecutionTimeMs = 0;

  // 4. Evaluate Test Cases sequentially (fail-fast on submit)
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const isVisible = i < problem.sampleCases.length;
    const testNumber = i + 1;

    const startTime = Date.now();
    let runResult;
    try {
      runResult = await runner({
        code,
        stdin: testCase.input,
        limits: {
          timeoutMs: 20_000,
          maxEvents: 500,
          maxOutputBytes: 15_000
        }
      });
    } catch (err) {
      return {
        success: false,
        verdict: 'Judging Error',
        error: `Execution sandbox error: ${sanitizeErrorMessage(err.message)}`,
        passedCount,
        totalCount
      };
    }

    const elapsed = Date.now() - startTime;
    totalExecutionTimeMs += elapsed;

    // Handle Compilation Error (halts immediately)
    if (runResult.outcome === 'compilation_error') {
      const sanitizedStderr = sanitizeErrorMessage(runResult.stderr || runResult.errorEvent?.message || 'Compilation failed.');
      return {
        success: false,
        verdict: 'Compilation Error',
        error: sanitizedStderr,
        failedTestCase: testNumber,
        passedCount: 0,
        totalCount,
        executionTimeMs: elapsed,
        sampleResults: isSampleMode ? sampleResults : undefined
      };
    }

    // Handle Time Limit Exceeded
    if (runResult.outcome === 'timeout' || runResult.timedOut) {
      return {
        success: false,
        verdict: 'Time Limit Exceeded',
        error: `Time limit exceeded on test case ${testNumber} (limit: ${problem.timeLimitMs || 4000}ms). Check for infinite loops or suboptimal complexity.`,
        failedTestCase: testNumber,
        passedCount,
        totalCount,
        executionTimeMs: elapsed,
        sampleResults: isSampleMode ? sampleResults : undefined
      };
    }

    // Handle Runtime Error
    if (runResult.outcome === 'runtime_error' || (runResult.exitEvent && runResult.exitEvent.exitCode !== 0)) {
      const runtimeErrorMsg = sanitizeErrorMessage(
        runResult.exitEvent?.stderr || runResult.stderr || runResult.errorEvent?.message || 'Process terminated with non-zero exit code.'
      );
      return {
        success: false,
        verdict: 'Runtime Error',
        error: runtimeErrorMsg,
        failedTestCase: testNumber,
        passedCount,
        totalCount,
        executionTimeMs: elapsed,
        sampleResults: isSampleMode ? sampleResults : undefined
      };
    }

    // Check Output
    const actualOutput = runResult.exitEvent?.stdout || '';
    const normActual = normalizeOutput(actualOutput);
    const normExpected = normalizeOutput(testCase.expectedOutput);
    const isPassed = normActual === normExpected;

    if (isSampleMode) {
      sampleResults.push({
        id: testCase.id,
        testNumber,
        passed: isPassed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: actualOutput.trim(),
        explanation: testCase.explanation || null,
        executionTimeMs: elapsed
      });
      if (isPassed) {
        passedCount++;
      }
    } else {
      // Submit Mode
      if (isPassed) {
        passedCount++;
      } else {
        // Fail-fast on wrong answer
        const failureDetails = {
          success: false,
          verdict: 'Wrong Answer',
          failedTestCase: testNumber,
          passedCount,
          totalCount,
          executionTimeMs: totalExecutionTimeMs,
          // If it was a visible sample test, we can show input & output
          // If it was a hidden test, NEVER expose hidden inputs or expected outputs!
          input: isVisible ? testCase.input : '[Hidden Test Case]',
          expectedOutput: isVisible ? testCase.expectedOutput : '[Hidden Test Case]',
          actualOutput: isVisible ? actualOutput.trim() : '[Hidden Test Case]',
          error: `Wrong Answer on test case ${testNumber}. Output did not match expected result.`
        };
        return failureDetails;
      }
    }
  }

  // Final Summary
  if (isSampleMode) {
    const allPassed = passedCount === totalCount;
    return {
      success: true,
      mode: 'sample',
      verdict: allPassed ? 'Accepted' : 'Wrong Answer',
      passedCount,
      totalCount,
      executionTimeMs: totalExecutionTimeMs,
      sampleResults
    };
  }

  // Full submission passed all test cases!
  return {
    success: true,
    mode: 'submit',
    verdict: 'Accepted',
    passedCount,
    totalCount,
    executionTimeMs: totalExecutionTimeMs,
    message: `Congratulations! Solution passed all ${totalCount} test cases (visible + hidden).`
  };
}
