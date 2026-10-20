// =============================================================================
// ALGOLAB — MySQL Database Connection & Pool Manager (Phase 15)
//
// Manages MySQL connection pooling, health diagnostics, and parameterized
// query execution using mysql2/promise.
// =============================================================================

import '../env.js';
import mysql from 'mysql2/promise';

let activePool = null;
let mockDriver = null;

/**
 * Returns database configuration derived from process.env with safe defaults.
 */
export function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'algolab',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00',
    dateStrings: true
  };
}

/**
 * Sets a mock database driver (used for hermetic automated tests).
 * @param {object|null} driver
 */
export function setMockDriver(driver) {
  mockDriver = driver;
}

/**
 * Retrieves the singleton connection pool. Lazily initializes on first call.
 * @param {object} [customConfig]
 * @returns {mysql.Pool}
 */
export function getPool(customConfig = null) {
  if (mockDriver) {
    return mockDriver;
  }

  if (!activePool) {
    const config = customConfig || getDbConfig();
    activePool = mysql.createPool(config);
  }
  return activePool;
}

/**
 * Executes a parameterized SQL query safely.
 *
 * @param {string} sql
 * @param {Array} [params=[]]
 * @returns {Promise<any>}
 */
export async function executeQuery(sql, params = []) {
  const pool = getPool();
  if (mockDriver && typeof mockDriver.query === 'function') {
    return mockDriver.query(sql, params);
  }

  const [results] = await pool.execute(sql, params);
  return results;
}

/**
 * Tests the connection to the database.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function testDbConnection() {
  try {
    const pool = getPool();
    if (mockDriver && typeof mockDriver.testConnection === 'function') {
      return mockDriver.testConnection();
    }
    const [rows] = await pool.query('SELECT 1 AS check_alive');
    return { ok: Boolean(rows && rows[0]?.check_alive === 1) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Gracefully shuts down the connection pool.
 */
export async function closePool() {
  if (activePool) {
    await activePool.end();
    activePool = null;
  }
  mockDriver = null;
}
