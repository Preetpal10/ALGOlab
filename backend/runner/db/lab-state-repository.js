// =============================================================================
// ALGOLAB — Lab State Repository (Phase 15)
//
// Parameterized database operations for persisting account-associated lab state
// (Code Lab drafts, Practice Arena drafts, and interactive lab configurations).
// =============================================================================

import { executeQuery } from './connection.js';

/**
 * Saves or updates lab state for a specific user and lab.
 *
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.labId
 * @param {string|object} params.stateData - Object or JSON string
 * @returns {Promise<object>}
 */
export async function saveLabState({ userId, labId, stateData }) {
  if (!userId || !labId) {
    throw new Error('userId and labId are required to save lab state.');
  }

  const stateJson = typeof stateData === 'string' ? stateData : JSON.stringify(stateData);

  const sql = `
    INSERT INTO lab_states (user_id, lab_id, state_json, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      state_json = VALUES(state_json),
      updated_at = NOW()
  `;

  await executeQuery(sql, [userId, labId, stateJson]);

  return {
    userId,
    labId,
    stateJson,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Retrieves a single lab state for an authenticated student.
 * CRITICAL ISOLATION INVARIANT: strictly scoped by userId!
 *
 * @param {number} userId
 * @param {string} labId
 * @returns {Promise<object|null>}
 */
export async function getLabState(userId, labId) {
  if (!userId || !labId) return null;

  const sql = `
    SELECT id, user_id AS userId, lab_id AS labId, state_json AS stateJson, updated_at AS updatedAt
    FROM lab_states
    WHERE user_id = ? AND lab_id = ?
    LIMIT 1
  `;

  const rows = await executeQuery(sql, [userId, labId]);
  if (!rows || rows.length === 0) return null;

  const r = rows[0];
  let parsed = null;
  try {
    parsed = JSON.parse(r.stateJson);
  } catch (_) {
    parsed = r.stateJson;
  }

  return {
    id: r.id,
    userId: r.userId,
    labId: r.labId,
    state: parsed,
    rawState: r.stateJson,
    updatedAt: r.updatedAt
  };
}

/**
 * Retrieves all saved lab states for a student.
 *
 * @param {number} userId
 * @returns {Promise<Array>}
 */
export async function getAllLabStates(userId) {
  if (!userId) return [];

  const sql = `
    SELECT id, user_id AS userId, lab_id AS labId, state_json AS stateJson, updated_at AS updatedAt
    FROM lab_states
    WHERE user_id = ?
    ORDER BY updated_at DESC
  `;

  const rows = await executeQuery(sql, [userId]);
  if (!rows) return [];

  return rows.map(r => {
    let parsed = null;
    try {
      parsed = JSON.parse(r.stateJson);
    } catch (_) {
      parsed = r.stateJson;
    }
    return {
      id: r.id,
      labId: r.labId,
      state: parsed,
      updatedAt: r.updatedAt
    };
  });
}

/**
 * Deletes a lab state for a student.
 *
 * @param {number} userId
 * @param {string} labId
 * @returns {Promise<boolean>}
 */
export async function deleteLabState(userId, labId) {
  if (!userId || !labId) return false;

  const sql = `DELETE FROM lab_states WHERE user_id = ? AND lab_id = ?`;
  const result = await executeQuery(sql, [userId, labId]);
  return Boolean(result && result.affectedRows > 0);
}
