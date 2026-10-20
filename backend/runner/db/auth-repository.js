// =============================================================================
// ALGOLAB — Authentication Repository (Phase 15)
//
// Parameterized database operations for users and server-side sessions.
// =============================================================================

import { executeQuery } from './connection.js';

/**
 * Creates a new student user in the database.
 * Never stores or returns plaintext passwords.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @returns {Promise<{ id: number, name: string, email: string, createdAt: string }>}
 */
export async function createUser({ name, email, passwordHash }) {
  const sql = `
    INSERT INTO users (name, email, password_hash)
    VALUES (?, ?, ?)
  `;
  const result = await executeQuery(sql, [name.trim(), email.trim().toLowerCase(), passwordHash]);
  return {
    id: result.insertId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Looks up a user by email address (includes password_hash for authentication verification).
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
export async function findUserByEmail(email) {
  const sql = `
    SELECT id, name, email, password_hash AS passwordHash, created_at AS createdAt, updated_at AS updatedAt
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  const rows = await executeQuery(sql, [email.trim().toLowerCase()]);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Looks up a user by primary key ID. Never returns password_hash.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function findUserById(id) {
  const sql = `
    SELECT id, name, email, created_at AS createdAt, updated_at AS updatedAt
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  const rows = await executeQuery(sql, [id]);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Creates a persistent server session.
 *
 * @param {string} sessionId Cryptographically generated token
 * @param {number} userId
 * @param {Date|string} expiresAt
 */
export async function createSession(sessionId, userId, expiresAt) {
  const sql = `
    INSERT INTO sessions (session_id, user_id, expires_at)
    VALUES (?, ?, ?)
  `;
  const expiryDate = expiresAt instanceof Date ? expiresAt.toISOString().slice(0, 19).replace('T', ' ') : expiresAt;
  await executeQuery(sql, [sessionId, userId, expiryDate]);
  return { sessionId, userId, expiresAt };
}

/**
 * Retrieves an active, unexpired session along with the associated user profile.
 *
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
export async function findSession(sessionId) {
  const sql = `
    SELECT s.session_id AS sessionId, s.user_id AS userId, s.expires_at AS expiresAt,
           u.name, u.email, u.created_at AS userCreatedAt
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.session_id = ? AND s.expires_at > NOW()
    LIMIT 1
  `;
  const rows = await executeQuery(sql, [sessionId]);
  return rows && rows.length > 0 ? rows[0] : null;
}

/**
 * Deletes a session record (logout).
 *
 * @param {string} sessionId
 */
export async function deleteSession(sessionId) {
  const sql = `DELETE FROM sessions WHERE session_id = ?`;
  await executeQuery(sql, [sessionId]);
  return true;
}

/**
 * Purges expired sessions for maintenance.
 */
export async function deleteExpiredSessions() {
  const sql = `DELETE FROM sessions WHERE expires_at <= NOW()`;
  await executeQuery(sql, []);
}
