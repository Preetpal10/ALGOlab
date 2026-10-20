// =============================================================================
// ALGOLAB — Problem Progress Repository (Phase 15)
//
// Parameterized database operations for tracking per-student problem attempts,
// first-solve timestamps, and progress aggregation statistics.
// =============================================================================

import { executeQuery } from './connection.js';
import { getPublicProblemCatalog } from '../problem-catalog.js';

/**
 * Updates progress for a student after an evaluation attempt.
 *
 * Atomic semantics:
 * - If new: inserts record with is_solved = true/false, first_solved_at (if accepted), last_attempt_at = NOW().
 * - If existing: updates last_attempt_at = NOW().
 *   If previously solved (is_solved = 1), it REMAINS solved and first_solved_at is preserved.
 *   If not previously solved, it becomes solved only if current attempt isAccepted.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.problemId
 * @param {boolean} params.isAccepted
 */
export async function recordAttempt({ userId, problemId, isAccepted }) {
  const sql = `
    INSERT INTO problem_progress (
      user_id, problem_id, is_solved, first_solved_at, last_attempt_at
    ) VALUES (
      ?, ?, ?, IF(? = 1, NOW(), NULL), NOW()
    ) ON DUPLICATE KEY UPDATE
      last_attempt_at = NOW(),
      first_solved_at = IF(problem_progress.is_solved = 1, problem_progress.first_solved_at, IF(VALUES(is_solved) = 1, NOW(), NULL)),
      is_solved = IF(problem_progress.is_solved = 1, 1, VALUES(is_solved))
  `;

  const isSolvedVal = isAccepted ? 1 : 0;
  await executeQuery(sql, [userId, problemId, isSolvedVal, isSolvedVal]);

  return {
    userId,
    problemId,
    isSolved: Boolean(isAccepted),
  };
}

/**
 * Retrieves the comprehensive progress records and learning metrics for a student.
 * Combines database progress rows with the problem catalog for topic breakdown.
 *
 * @param {number} userId
 * @returns {Promise<object>} Progress summary
 */
export async function getStudentProgress(userId) {
  const sql = `
    SELECT id, problem_id AS problemId, is_solved AS isSolved,
           first_solved_at AS firstSolvedAt, last_attempt_at AS lastAttemptAt
    FROM problem_progress
    WHERE user_id = ?
    ORDER BY last_attempt_at DESC
  `;
  const rows = (await executeQuery(sql, [userId])) || [];

  // Get total submissions count for acceptance rate calculation
  const subCountSql = `SELECT COUNT(*) AS totalSubmissions, SUM(IF(verdict = 'Accepted', 1, 0)) AS acceptedSubmissions FROM submissions WHERE user_id = ?`;
  const subRows = await executeQuery(subCountSql, [userId]);
  const totalSubmissions = subRows && subRows[0] ? Number(subRows[0].totalSubmissions) : 0;
  const acceptedSubmissions = subRows && subRows[0] ? Number(subRows[0].acceptedSubmissions) : 0;

  // Catalog lookup map
  const catalog = getPublicProblemCatalog();
  const catalogMap = new Map();
  for (const prob of catalog) {
    catalogMap.set(prob.id, prob);
  }

  const solvedProblems = [];
  const attemptedUnsolvedProblems = [];
  const topicStats = {};

  // Initialize topic stats from catalog
  for (const prob of catalog) {
    const topic = prob.topic || 'General';
    if (!topicStats[topic]) {
      topicStats[topic] = { topic, total: 0, solved: 0 };
    }
    topicStats[topic].total += 1;
  }

  for (const r of rows) {
    const probInfo = catalogMap.get(r.problemId) || {
      id: r.problemId,
      title: r.problemId,
      difficulty: 'Unknown',
      topic: 'General'
    };

    const isSolved = Boolean(r.isSolved === 1 || r.isSolved === true);
    const enriched = {
      problemId: r.problemId,
      title: probInfo.title,
      difficulty: probInfo.difficulty,
      topic: probInfo.topic,
      isSolved,
      firstSolvedAt: r.firstSolvedAt,
      lastAttemptAt: r.lastAttemptAt,
    };

    if (isSolved) {
      solvedProblems.push(enriched);
      if (topicStats[probInfo.topic]) {
        topicStats[probInfo.topic].solved += 1;
      }
    } else {
      attemptedUnsolvedProblems.push(enriched);
    }
  }

  const uniqueSolved = solvedProblems.length;
  const uniqueAttempted = rows.length;
  const acceptanceRate = totalSubmissions > 0
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0;

  return {
    totalCatalogProblems: catalog.length,
    uniqueSolved,
    uniqueAttempted,
    totalSubmissions,
    acceptedSubmissions,
    acceptanceRate,
    topicProgress: Object.values(topicStats),
    solvedProblems,
    attemptedUnsolvedProblems,
  };
}
