// =============================================================================
// ALGOLAB — In-Memory Mock Database Driver for Hermetic Tests
//
// Simulates MySQL tables (users, sessions, submissions, problem_progress)
// with primary keys, unique constraints, foreign keys, and parameterized query parsing.
// =============================================================================

export class MockDatabase {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map(); // id -> user
    this.sessions = new Map(); // sessionId -> session
    this.submissions = new Map(); // id -> submission
    this.progress = new Map(); // `${userId}:${problemId}` -> progress
    this.labStates = new Map(); // `${userId}:${labId}` -> labState
    this.nextUserId = 1;
    this.nextSubmissionId = 1;
    this.nextProgressId = 1;
    this.nextLabStateId = 1;
    this.isHealthy = true;
  }

  setHealthy(val) {
    this.isHealthy = Boolean(val);
  }

  async testConnection() {
    if (!this.isHealthy) {
      throw new Error('Database connection failed');
    }
    return { ok: true };
  }

  async query(sql, params = []) {
    if (!this.isHealthy) {
      throw new Error('Database connection failed');
    }

    const cleanSql = sql.trim().replace(/\s+/g, ' ');

    // 1. INSERT INTO users
    if (cleanSql.startsWith('INSERT INTO users')) {
      const [name, email, passwordHash] = params;
      // Unique email check
      for (const u of this.users.values()) {
        if (u.email === email) {
          const err = new Error(`Duplicate entry '${email}' for key 'users.email'`);
          err.code = 'ER_DUP_ENTRY';
          throw err;
        }
      }
      const id = this.nextUserId++;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const user = { id, name, email, password_hash: passwordHash, created_at: now, updated_at: now };
      this.users.set(id, user);
      return { insertId: id, affectedRows: 1 };
    }

    // 2. SELECT FROM users WHERE email = ?
    if (cleanSql.includes('FROM users WHERE email = ?')) {
      const email = params[0];
      for (const u of this.users.values()) {
        if (u.email === email) {
          return [{
            id: u.id,
            name: u.name,
            email: u.email,
            passwordHash: u.password_hash,
            createdAt: u.created_at,
            updatedAt: u.updated_at
          }];
        }
      }
      return [];
    }

    // 3. SELECT FROM users WHERE id = ?
    if (cleanSql.includes('FROM users WHERE id = ?')) {
      const id = params[0];
      const u = this.users.get(id);
      if (u) {
        return [{
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.created_at,
          updatedAt: u.updated_at
        }];
      }
      return [];
    }

    // 4. INSERT INTO sessions
    if (cleanSql.startsWith('INSERT INTO sessions')) {
      const [sessionId, userId, expiresAt] = params;
      this.sessions.set(sessionId, {
        session_id: sessionId,
        user_id: userId,
        expires_at: new Date(expiresAt),
        created_at: new Date()
      });
      return { affectedRows: 1 };
    }

    // 5. SELECT FROM sessions JOIN users
    if (cleanSql.includes('FROM sessions s') && cleanSql.includes('WHERE s.session_id = ?')) {
      const sessionId = params[0];
      const s = this.sessions.get(sessionId);
      if (!s) return [];

      if (new Date(s.expires_at) <= new Date()) {
        return []; // Expired
      }

      const u = this.users.get(s.user_id);
      if (!u) return [];

      return [{
        sessionId: s.session_id,
        userId: s.user_id,
        expiresAt: s.expires_at,
        name: u.name,
        email: u.email,
        userCreatedAt: u.created_at
      }];
    }

    // 6. DELETE FROM sessions WHERE session_id = ?
    if (cleanSql.startsWith('DELETE FROM sessions WHERE session_id = ?')) {
      const sessionId = params[0];
      this.sessions.delete(sessionId);
      return { affectedRows: 1 };
    }

    // 7. INSERT INTO submissions
    if (cleanSql.startsWith('INSERT INTO submissions')) {
      const [userId, problemId, sourceCode, verdict, passedTests, totalTests, executionTimeMs] = params;
      const id = this.nextSubmissionId++;
      const now = new Date().toISOString();
      const sub = {
        id,
        user_id: userId,
        problem_id: problemId,
        source_code: sourceCode,
        verdict,
        passed_tests: passedTests,
        total_tests: totalTests,
        execution_time_ms: executionTimeMs,
        created_at: now
      };
      this.submissions.set(id, sub);
      return { insertId: id, affectedRows: 1 };
    }

    // 8. SELECT COUNT(*) AS total FROM submissions
    if (cleanSql.startsWith('SELECT COUNT(*) AS total FROM submissions')) {
      const userId = params[0];
      let matches = Array.from(this.submissions.values()).filter(s => s.user_id === userId);
      if (params.length > 1 && cleanSql.includes('problem_id = ?')) {
        matches = matches.filter(s => s.problem_id === params[1]);
      }
      if (cleanSql.includes('verdict = ?')) {
        const vParam = params[params.length - 1];
        matches = matches.filter(s => s.verdict === vParam);
      }
      return [{ total: matches.length }];
    }

    // 9. SELECT submissions list with limit/offset
    if (cleanSql.includes('SELECT id, user_id AS userId, problem_id AS problemId, verdict') && cleanSql.includes('FROM submissions')) {
      const userId = params[0];
      let matches = Array.from(this.submissions.values())
        .filter(s => s.user_id === userId)
        .sort((a, b) => b.id - a.id);

      const limit = params[params.length - 2];
      const offset = params[params.length - 1];
      const paged = matches.slice(offset, offset + limit).map(s => ({
        id: s.id,
        userId: s.user_id,
        problemId: s.problem_id,
        verdict: s.verdict,
        passedTests: s.passed_tests,
        totalTests: s.total_tests,
        executionTimeMs: s.execution_time_ms,
        createdAt: s.created_at
      }));
      return paged;
    }

    // 10. SELECT single submission by id and user_id
    if (cleanSql.includes('FROM submissions') && cleanSql.includes('WHERE id = ? AND user_id = ?')) {
      const [id, userId] = params;
      const sub = this.submissions.get(id);
      if (sub && sub.user_id === userId) {
        return [{
          id: sub.id,
          userId: sub.user_id,
          problemId: sub.problem_id,
          sourceCode: sub.source_code,
          verdict: sub.verdict,
          passedTests: sub.passed_tests,
          totalTests: sub.total_tests,
          executionTimeMs: sub.execution_time_ms,
          createdAt: sub.created_at
        }];
      }
      return [];
    }

    // 11. Problem progress INSERT / ON DUPLICATE KEY UPDATE
    if (cleanSql.startsWith('INSERT INTO problem_progress')) {
      const [userId, problemId, isSolvedParam] = params;
      const key = `${userId}:${problemId}`;
      const now = new Date().toISOString();
      const existing = this.progress.get(key);

      const isAccepted = isSolvedParam === 1;

      if (!existing) {
        const row = {
          id: this.nextProgressId++,
          user_id: userId,
          problem_id: problemId,
          is_solved: isAccepted ? 1 : 0,
          first_solved_at: isAccepted ? now : null,
          last_attempt_at: now
        };
        this.progress.set(key, row);
      } else {
        existing.last_attempt_at = now;
        if (!existing.is_solved && isAccepted) {
          existing.is_solved = 1;
          existing.first_solved_at = now;
        }
      }
      return { affectedRows: 1 };
    }

    // 12. SELECT FROM problem_progress WHERE user_id = ?
    if (cleanSql.includes('FROM problem_progress') && cleanSql.includes('WHERE user_id = ?')) {
      const userId = params[0];
      const rows = Array.from(this.progress.values())
        .filter(p => p.user_id === userId)
        .map(p => ({
          id: p.id,
          problemId: p.problem_id,
          isSolved: p.is_solved,
          firstSolvedAt: p.first_solved_at,
          lastAttemptAt: p.last_attempt_at
        }));
      return rows;
    }

    // 13. Submissions count aggregate for progress
    if (cleanSql.includes('COUNT(*) AS totalSubmissions') && cleanSql.includes('FROM submissions WHERE user_id = ?')) {
      const userId = params[0];
      const userSubs = Array.from(this.submissions.values()).filter(s => s.user_id === userId);
      const acceptedSubs = userSubs.filter(s => s.verdict === 'Accepted').length;
      return [{
        totalSubmissions: userSubs.length,
        acceptedSubmissions: acceptedSubs
      }];
    }

    // 14. INSERT / ON DUPLICATE KEY UPDATE lab_states
    if (cleanSql.startsWith('INSERT INTO lab_states')) {
      const [userId, labId, stateJson] = params;
      const key = `${userId}:${labId}`;
      const now = new Date().toISOString();
      const existing = this.labStates.get(key);

      if (!existing) {
        const row = {
          id: this.nextLabStateId++,
          user_id: userId,
          lab_id: labId,
          state_json: stateJson,
          updated_at: now
        };
        this.labStates.set(key, row);
      } else {
        existing.state_json = stateJson;
        existing.updated_at = now;
      }
      return { affectedRows: 1 };
    }

    // 15. SELECT FROM lab_states WHERE user_id = ? AND lab_id = ?
    if (cleanSql.includes('FROM lab_states') && cleanSql.includes('WHERE user_id = ? AND lab_id = ?')) {
      const [userId, labId] = params;
      const key = `${userId}:${labId}`;
      const row = this.labStates.get(key);
      if (row) {
        return [{
          id: row.id,
          userId: row.user_id,
          labId: row.lab_id,
          stateJson: row.state_json,
          updatedAt: row.updated_at
        }];
      }
      return [];
    }

    // 16. SELECT FROM lab_states WHERE user_id = ?
    if (cleanSql.includes('FROM lab_states') && cleanSql.includes('WHERE user_id = ?')) {
      const userId = params[0];
      const rows = Array.from(this.labStates.values())
        .filter(ls => ls.user_id === userId)
        .map(ls => ({
          id: ls.id,
          userId: ls.user_id,
          labId: ls.lab_id,
          stateJson: ls.state_json,
          updatedAt: ls.updated_at
        }));
      return rows;
    }

    // 17. DELETE FROM lab_states WHERE user_id = ? AND lab_id = ?
    if (cleanSql.startsWith('DELETE FROM lab_states WHERE user_id = ? AND lab_id = ?')) {
      const [userId, labId] = params;
      const key = `${userId}:${labId}`;
      const deleted = this.labStates.delete(key);
      return { affectedRows: deleted ? 1 : 0 };
    }

    return [];
  }
}
