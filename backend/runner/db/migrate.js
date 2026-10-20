// =============================================================================
// ALGOLAB — Database Migration Script (Phase 15)
//
// Reads schema.sql and creates the algolab database and tables.
// Run with: node db/migrate.js
// =============================================================================

import '../env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { getDbConfig } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(customConfig = null) {
  const config = customConfig || getDbConfig();
  console.log(`[MIGRATION] Connecting to MySQL at ${config.host}:${config.port} as '${config.user}'...`);

  // Step 1: Connect without selecting a database (to allow CREATE DATABASE IF NOT EXISTS)
  const connectionConfig = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('[MIGRATION] Connected successfully to MySQL.');

    // Step 2: Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Step 3: Execute SQL statements
    console.log('[MIGRATION] Executing schema.sql statements...');
    await connection.query(sqlContent);
    console.log('[MIGRATION] Schema executed successfully. All tables created/verified.');

    return { ok: true };
  } catch (err) {
    console.error(`[MIGRATION ERROR] ${err.message}`);
    return { ok: false, error: err.message };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Allow direct CLI invocation
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runMigrations().then(res => {
    if (!res.ok) {
      process.exit(1);
    }
    process.exit(0);
  });
}
