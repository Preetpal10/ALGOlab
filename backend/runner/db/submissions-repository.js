// =============================================================================
// ALGOLAB — Submissions Repository (Phase 15)
//
// Parameterized database operations for recording authoritative judging outcomes
// and retrieving private student submission histories.
// =============================================================================

import { executeQuery } from './connection.js';

/**
 * Records an authoritative server-evaluated submission.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.problemId
 * @param {string} params.sourceCode
 * @param {string} params.verdict
 * @param {number} [params.passedTests=0]
 * @param {number} [params.totalTests=0]
 * @param {number|null} [params.executionTimeMs=null]
 * @returns {Promise<object>} Created submission summary
 */
export async function createSubmission({
  userId,
  problemId,
  sourceCode,
  verdict,
  passedTests = 0,
  totalTests = 0,
  executionTimeMs = null
}) {
  const sql = `
    INSERT INTO submissions (
      user_id, problem_id, source_code, verdict, passed_tests, total_tests, execution_time_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(sql, [
    userId,
    problemId,
    sourceCode,
    verdict,
    passedTests,
    totalTests,
    executionTimeMs
  ]);

  return {
    id: result.insertId,
    userId,
    problemId,
    verdict,
    passedTests,
    totalTests,
    executionTimeMs,
    createdAt: new Date().toISOString()
  };
}

/**
 * Retrieves a paginated list of submissions belonging exclusively to the specified student.
 * Optional filters for problemId and verdict.
 *
 * @param {number} userId
 * @param {object} [options]
 * @param {number} [options.limit=20]
 * @param {number} [options.offset=0]
 * @param {string} [options.problemId]
 * @param {string} [options.verdict]
 * @returns {Promise<{ submissions: Array, total: number }>}
 */
export async function getSubmissionsByUser(userId, {
  limit = 20,
  offset = 0,
  problemId = null,
  verdict = null
} = {}) {
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  const conditions = ['user_id = ?'];
  const params = [userId];

  if (problemId && typeof problemId === 'string' && problemId.trim()) {
    conditions.push('problem_id = ?');
    params.push(problemId.trim());
  }

  if (verdict && typeof verdict === 'string' && verdict.trim()) {
    conditions.push('verdict = ?');
    params.push(verdict.trim());
  }

  const whereClause = conditions.join(' AND ');

  // Get total count matching filters
  const countSql = `SELECT COUNT(*) AS total FROM submissions WHERE ${whereClause}`;
  const countRows = await executeQuery(countSql, params);
  const total = countRows && countRows[0] ? Number(countRows[0].total) : 0;

  // Get page rows (exclude heavy source_code from bulk list for performance)
  const listSql = `
    SELECT id, user_id AS userId, problem_id AS problemId, verdict,
           passed_tests AS passedTests, total_tests AS totalTests,
           execution_time_ms AS executionTimeMs, created_at AS createdAt
    FROM submissions
    WHERE ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
  `;
  const submissions = await executeQuery(listSql, [...params, safeLimit, safeOffset]);

  return {
    submissions: submissions || [],
    total,
    limit: safeLimit,
    offset: safeOffset
  };
}

/**
 * Retrieves a single submission with full source code.
 * CRITICAL SECURITY INVARIANT: Strictly scoped to the authenticated student!
 * Changing submission ID in the URL will never permit access to another user's code.
 *
 * @param {number} submissionId
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
export async function getSubmissionById(submissionId, userId) {
  const sql = `
    SELECT id, user_id AS userId, problem_id AS problemId, source_code AS sourceCode,
           verdict, passed_tests AS passedTests, total_tests AS totalTests,
           execution_time_ms AS executionTimeMs, created_at AS createdAt
    FROM submissions
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;
  const rows = await executeQuery(sql, [submissionId, userId]);
  return rows && rows.length > 0 ? rows[0] : null;
}
