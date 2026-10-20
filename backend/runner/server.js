// =============================================================================
// ALGOLAB — HTTP API Server for Java Code Execution (Phase 6)
//
// Minimal, robust Node.js HTTP server built exclusively with Node.js built-ins.
// Safely exposes /api/health and /api/execute, routing requests to the
// isolated Docker execution bridge (docker-runner.js).
//
// SECURITY & RESOURCE INVARIANTS:
// - Binds to 127.0.0.1 by default (never binds to 0.0.0.0 without explicit intent).
// - Strict request body size capping (max 128 KB, rejects with 413).
// - Enforces concurrency limit (default 2 concurrent executions, rejects with 429).
// - Content-Type validation (requires application/json, rejects with 415).
// - Strict input validation on code, mainClass, stdin (rejects with 400).
// - Client CANNOT override Docker security flags or arbitrary execution limits.
// - Docker execution is ALWAYS isolated via docker-runner.js.
// - Zero shell interpolation or command generation from user input.
// - Sanitized error responses: no internal stack traces, paths, or secrets leaked.
// - No full student source code logged to stdout/stderr.
// - Clean HTTP server lifecycle (graceful shutdown support).
// =============================================================================

import './env.js';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInContainer } from './docker-runner.js';
import { getPublicProblemCatalog, getPublicProblemById } from './problem-catalog.js';
import { evaluateSolution } from './judge.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  findSession,
  deleteSession
} from './db/auth-repository.js';
import {
  createSubmission,
  getSubmissionsByUser,
  getSubmissionById
} from './db/submissions-repository.js';
import {
  recordAttempt,
  getStudentProgress
} from './db/progress-repository.js';
import {
  saveLabState,
  getLabState,
  getAllLabStates,
  deleteLabState
} from './db/lab-state-repository.js';
import {
  checkAuthRateLimit,
  validateRegistrationPayload,
  validateLoginPayload,
  hashPassword,
  verifyPassword,
  generateSessionId,
  buildSessionCookie,
  buildClearSessionCookie,
  extractSessionId,
  authenticateRequest
} from './auth-service.js';

// ---------------------------------------------------------------------------
// Server Configuration Defaults
// ---------------------------------------------------------------------------

export const SERVER_DEFAULTS = Object.freeze({
  host: '127.0.0.1',
  port: 3001,
  allowedOrigins: Object.freeze([]), // By default, only local development origins are permitted
  maxBodyBytes: 128 * 1024,          // 128 KB max request body
  maxSourceBytes: 64 * 1024,         // 64 KB max student source code
  maxConcurrency: 2,                 // Max concurrent Docker executions
  requestTimeoutMs: 25_000,          // Server-side safety deadline
  serviceName: 'algolab-runner',
  serviceVersion: '1.0.0',
});

// ---------------------------------------------------------------------------
// Configuration Helpers
// ---------------------------------------------------------------------------

/**
 * Safely parses integer environment variable with bounds and fallback.
 */
export function parseEnvInt(val, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (val === undefined || val === null || val === '') return fallback;
  const n = parseInt(String(val).trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Parses comma-separated origin strings or string arrays into a clean list of origins.
 *
 * @param {string|string[]} [input]
 * @returns {string[]}
 */
export function parseAllowedOrigins(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map(o => String(o).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Evaluates whether a request origin is permitted.
 *
 * Rules:
 * 1. Missing or undefined origin: handled separately (non-browser requests).
 * 2. Origin 'null': NOT trusted by default (protects against sandboxed iframes / data: URLs).
 *    Only allowed if explicitly specified in allowedOrigins or allowNullOrigin: true.
 * 3. Approved local development origins: always allowed (http://localhost, http://127.0.0.1 on any port).
 * 4. Configured allowlist: any explicitly configured origins (e.g. https://thriving-tanuki-9df908.netlify.app).
 * 5. All other origins: rejected.
 *
 * @param {string|undefined} origin
 * @param {string[]} [allowedOrigins=[]]
 * @param {boolean} [allowNullOrigin=false]
 * @returns {boolean}
 */
export function isAllowedOrigin(origin, allowedOrigins = [], allowNullOrigin = false) {
  if (!origin || typeof origin !== 'string') return false;

  const trimmed = origin.trim();

  // Explicit check for 'null' origin (RFC 6454 / privacy-sensitive or sandboxed origins)
  if (trimmed === 'null') {
    return Boolean(allowNullOrigin || allowedOrigins.includes('null'));
  }

  // Approved local development origins (localhost or 127.0.0.1 on any port over http or https)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(trimmed)) {
    return true;
  }

  // Explicitly configured production / staging origins (case-insensitive exact origin match)
  const normalized = trimmed.toLowerCase();
  for (const allowed of allowedOrigins) {
    if (allowed.toLowerCase() === normalized) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Server Factory
// ---------------------------------------------------------------------------

/**
 * Creates and configures the HTTP API server.
 *
 * @param {object} [options]
 * @param {Function} [options.runner]            - Custom runner function (defaults to runInContainer)
 * @param {number}   [options.maxConcurrency]    - Max concurrent executions
 * @param {number}   [options.maxBodyBytes]      - Max HTTP body size in bytes
 * @param {number}   [options.maxSourceBytes]    - Max source code size in bytes
 * @param {number}   [options.requestTimeoutMs]  - Server-side request deadline
 * @param {string[]|string} [options.allowedOrigins] - Explicitly allowed CORS origins
 * @param {string}   [options.allowedOrigin]     - Alias for allowedOrigins (single origin)
 * @param {boolean}  [options.allowNullOrigin]   - Whether to explicitly permit Origin: null
 * @returns {http.Server}
 */
export function createServer(options = {}) {
  const runner = options.runner || runInContainer;
  const maxConcurrency = options.maxConcurrency ?? parseEnvInt(process.env.MAX_CONCURRENCY, SERVER_DEFAULTS.maxConcurrency, 1, 32);
  const maxBodyBytes = options.maxBodyBytes ?? parseEnvInt(process.env.MAX_BODY_BYTES, SERVER_DEFAULTS.maxBodyBytes, 1024, 10 * 1024 * 1024);
  const maxSourceBytes = options.maxSourceBytes ?? parseEnvInt(process.env.MAX_SOURCE_BYTES, SERVER_DEFAULTS.maxSourceBytes, 512, 1024 * 1024);
  const requestTimeoutMs = options.requestTimeoutMs ?? parseEnvInt(process.env.REQUEST_TIMEOUT_MS, SERVER_DEFAULTS.requestTimeoutMs, 1000, 120_000);

  const rawOrigins = options.allowedOrigins ?? options.allowedOrigin ?? process.env.ALLOWED_ORIGIN ?? process.env.ALLOWED_ORIGINS ?? SERVER_DEFAULTS.allowedOrigins;
  const allowedOrigins = parseAllowedOrigins(rawOrigins);
  const allowNullOrigin = options.allowNullOrigin ?? (process.env.ALLOW_NULL_ORIGIN === 'true');

  let activeExecutions = 0;

  const server = http.createServer(async (req, res) => {
    // Set standard security headers on all responses
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    const origin = req.headers.origin;
    const originAllowed = isAllowedOrigin(origin, allowedOrigins, allowNullOrigin);

    // If an Origin header is present and permitted, reflect it explicitly (never wildcard '*')
    if (origin && originAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
    }

    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      if (origin && !originAllowed) {
        return sendJson(res, 403, { error: 'CORS origin denied.' });
      }

      if (originAllowed) {
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      res.writeHead(204);
      res.end();
      return;
    }

    // Reject non-preflight requests carrying an unapproved Origin header
    if (origin && !originAllowed) {
      return sendJson(res, 403, { error: 'CORS origin not allowed.' });
    }

    // Set CORS headers for approved non-preflight requests
    if (origin && originAllowed) {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = parsedUrl.pathname;

    // --- Route: GET /api/health ---
    if (pathname === '/api/health') {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      return sendJson(res, 200, {
        status: 'ok',
        service: SERVER_DEFAULTS.serviceName,
        version: SERVER_DEFAULTS.serviceVersion,
      });
    }

    // --- Route: POST /api/execute ---
    if (pathname === '/api/execute') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 1. Content-Type Validation
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return sendJson(res, 415, {
          error: "Unsupported Content-Type. Expected 'application/json'.",
        });
      }

      // 2. Concurrency Check
      if (activeExecutions >= maxConcurrency) {
        res.setHeader('Retry-After', '2');
        return sendJson(res, 429, {
          error: 'Server is busy. Maximum concurrent executions reached. Please try again shortly.',
          activeExecutions,
          maxConcurrency,
        });
      }

      // 3. Read Body with strict size limit
      let rawBody;
      try {
        rawBody = await readRequestBody(req, maxBodyBytes);
      } catch (err) {
        if (err.code === 'BODY_TOO_LARGE') {
          return sendJson(res, 413, {
            error: `Request body exceeds maximum allowed size (${maxBodyBytes} bytes).`,
          });
        }
        return sendJson(res, 400, { error: 'Failed to read request body.' });
      }

      // 4. Parse JSON
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }

      // 5. Validate Payload
      const validationError = validateExecutePayload(body, maxSourceBytes);
      if (validationError) {
        return sendJson(res, 400, { error: validationError });
      }

      // 6. Execute via Runner (tracked concurrency)
      activeExecutions++;
      const startTime = Date.now();
      let clientAborted = false;

      req.on('close', () => {
        if (!res.writableEnded) {
          clientAborted = true;
        }
      });

      try {
        // Enforce server-side execution deadline safety wrapper
        const runPromise = runner({
          code: body.code,
          mainClass: body.mainClass || undefined,
          stdin: body.stdin || undefined,
          // Client cannot pass custom limits; backend runner defaults apply
        });

        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            const timeoutErr = new Error('Execution exceeded server request deadline.');
            timeoutErr.code = 'SERVER_DEADLINE_EXCEEDED';
            reject(timeoutErr);
          }, requestTimeoutMs);
        });

        let result;
        try {
          result = await Promise.race([runPromise, timeoutPromise]);
        } finally {
          clearTimeout(timer);
        }
        const durationMs = Date.now() - startTime;

        // Log non-sensitive summary
        const detectedClass = body.mainClass || '(auto)';
        const codeSize = Buffer.byteLength(body.code, 'utf-8');
        console.log(`[API /execute] class=${detectedClass} size=${codeSize}B outcome=${result?.outcome} duration=${durationMs}ms`);

        if (clientAborted) {
          return;
        }

        // 7. Map Runner Outcome to HTTP Response
        return handleRunnerResult(res, result);

      } catch (err) {
        const durationMs = Date.now() - startTime;
        console.error(`[API /execute ERROR] duration=${durationMs}ms code=${err.code || 'UNKNOWN'}`);

        if (clientAborted) return;

        if (err.code === 'SERVER_DEADLINE_EXCEEDED') {
          return sendJson(res, 504, {
            error: 'Execution timed out on the server.',
            outcome: 'timeout',
          });
        }

        // Never expose stack trace or internal filesystem details
        return sendJson(res, 500, {
          error: 'An internal server error occurred during execution.',
          outcome: 'internal_error',
        });
      } finally {
        activeExecutions--;
      }
    }

    // --- Route: GET /api/problems ---
    if (pathname === '/api/problems') {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      return sendJson(res, 200, {
        problems: getPublicProblemCatalog(),
      });
    }

    // --- Route: GET /api/problems/:id ---
    if (pathname.startsWith('/api/problems/')) {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      const problemId = decodeURIComponent(pathname.slice('/api/problems/'.length));
      const problem = getPublicProblemById(problemId);
      if (!problem) {
        return sendJson(res, 404, { error: `Problem "${problemId}" not found.` });
      }
      return sendJson(res, 200, { problem });
    }

    // --- Route: POST /api/judge ---
    if (pathname === '/api/judge') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }

      // 1. Content-Type Validation
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return sendJson(res, 415, {
          error: "Unsupported Content-Type. Expected 'application/json'.",
        });
      }

      // 2. Concurrency Check
      if (activeExecutions >= maxConcurrency) {
        res.setHeader('Retry-After', '2');
        return sendJson(res, 429, {
          error: 'Server is busy. Maximum concurrent evaluations reached. Please try again shortly.',
          activeExecutions,
          maxConcurrency,
        });
      }

      // 3. Read Body
      let rawBody;
      try {
        rawBody = await readRequestBody(req, maxBodyBytes);
      } catch (err) {
        if (err.code === 'BODY_TOO_LARGE') {
          return sendJson(res, 413, {
            error: `Request body exceeds maximum allowed size (${maxBodyBytes} bytes).`,
          });
        }
        return sendJson(res, 400, { error: 'Failed to read request body.' });
      }

      // 4. Parse JSON
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }

      // 5. Basic Validation
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return sendJson(res, 400, { error: 'Request body must be a JSON object.' });
      }
      if (typeof body.problemId !== 'string' || !body.problemId.trim()) {
        return sendJson(res, 400, { error: "Field 'problemId' is required and must be a string." });
      }
      if (typeof body.code !== 'string' || !body.code.trim()) {
        return sendJson(res, 400, { error: "Field 'code' is required and must be a non-empty string." });
      }
      if (body.mode && body.mode !== 'submit' && body.mode !== 'sample') {
        return sendJson(res, 400, { error: "Field 'mode' must be either 'submit' or 'sample'." });
      }

      // 6. Evaluate via Judging Engine
      activeExecutions++;
      const startTime = Date.now();
      let clientAborted = false;

      req.on('close', () => {
        if (!res.writableEnded) {
          clientAborted = true;
        }
      });

      try {
        const judgePromise = evaluateSolution({
          problemId: body.problemId.trim(),
          code: body.code,
          mode: body.mode || 'submit',
          runner,
        });

        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            const timeoutErr = new Error('Judging exceeded server request deadline.');
            timeoutErr.code = 'SERVER_DEADLINE_EXCEEDED';
            reject(timeoutErr);
          }, requestTimeoutMs);
        });

        let result;
        try {
          result = await Promise.race([judgePromise, timeoutPromise]);
        } finally {
          clearTimeout(timer);
        }

        const durationMs = Date.now() - startTime;
        console.log(`[API /judge] problem=${body.problemId} mode=${body.mode || 'submit'} verdict=${result?.verdict} passed=${result?.passedCount}/${result?.totalCount} duration=${durationMs}ms`);

        if (clientAborted) return;

        if (result.verdict === 'Judging Error' && result.error?.includes('Unknown problem ID')) {
          return sendJson(res, 404, result);
        }

        // If authenticated user and mode === 'submit', persist submission & progress
        if (body.mode === 'submit') {
          try {
            const auth = await authenticateRequest(req);
            if (auth && auth.user) {
              await createSubmission({
                userId: auth.user.id,
                problemId: body.problemId.trim(),
                sourceCode: body.code,
                verdict: result.verdict,
                passedTests: result.passedCount || 0,
                totalTests: result.totalCount || 0,
                executionTimeMs: result.executionTimeMs || durationMs
              });
              await recordAttempt({
                userId: auth.user.id,
                problemId: body.problemId.trim(),
                isAccepted: result.verdict === 'Accepted'
              });
            }
          } catch (dbErr) {
            console.warn(`[API /judge DB WARN] Failed to save submission for authenticated user: ${dbErr.message}`);
          }
        }

        return sendJson(res, 200, result);

      } catch (err) {
        const durationMs = Date.now() - startTime;
        console.error(`[API /judge ERROR] duration=${durationMs}ms code=${err.code || 'UNKNOWN'}`);

        if (clientAborted) return;

        if (err.code === 'SERVER_DEADLINE_EXCEEDED') {
          return sendJson(res, 504, {
            success: false,
            verdict: 'Time Limit Exceeded',
            error: 'Judging request exceeded server deadline.',
          });
        }

        return sendJson(res, 500, {
          success: false,
          verdict: 'Judging Error',
          error: 'An internal server error occurred during evaluation.',
        });
      } finally {
        activeExecutions--;
      }
    }

    // --- Route: POST /api/auth/register ---
    if (pathname === '/api/auth/register') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      const clientIp = req.socket?.remoteAddress || '127.0.0.1';
      if (!checkAuthRateLimit(clientIp)) {
        return sendJson(res, 429, { error: 'Too many registration attempts. Please try again later.' });
      }
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return sendJson(res, 415, { error: "Unsupported Content-Type. Expected 'application/json'." });
      }

      let rawBody;
      try {
        rawBody = await readRequestBody(req, maxBodyBytes);
      } catch (err) {
        return sendJson(res, 400, { error: 'Failed to read request body.' });
      }
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }

      const validationErr = validateRegistrationPayload(body);
      if (validationErr) {
        return sendJson(res, 400, { error: validationErr });
      }

      try {
        const existing = await findUserByEmail(body.email);
        if (existing) {
          return sendJson(res, 409, { error: 'An account with this email address already exists.' });
        }

        const passwordHash = await hashPassword(body.password);
        const newUser = await createUser({
          name: body.name,
          email: body.email,
          passwordHash
        });

        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await createSession(sessionId, newUser.id, expiresAt);

        const isSecure = req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted);
        res.setHeader('Set-Cookie', buildSessionCookie(sessionId, Boolean(isSecure)));

        return sendJson(res, 201, {
          message: 'Registration successful.',
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            createdAt: newUser.createdAt
          }
        });
      } catch (err) {
        console.error(`[AUTH /register ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable. Please try again later.' });
      }
    }

    // --- Route: POST /api/auth/login ---
    if (pathname === '/api/auth/login') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      const clientIp = req.socket?.remoteAddress || '127.0.0.1';
      if (!checkAuthRateLimit(clientIp)) {
        return sendJson(res, 429, { error: 'Too many login attempts. Please try again later.' });
      }
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return sendJson(res, 415, { error: "Unsupported Content-Type. Expected 'application/json'." });
      }

      let rawBody;
      try {
        rawBody = await readRequestBody(req, maxBodyBytes);
      } catch (err) {
        return sendJson(res, 400, { error: 'Failed to read request body.' });
      }
      let body;
      try {
        body = JSON.parse(rawBody);
      } catch (_) {
        return sendJson(res, 400, { error: 'Invalid JSON payload.' });
      }

      const validationErr = validateLoginPayload(body);
      if (validationErr) {
        return sendJson(res, 400, { error: validationErr });
      }

      try {
        const user = await findUserByEmail(body.email);
        const passwordsMatch = user ? await verifyPassword(body.password, user.passwordHash) : false;

        if (!user || !passwordsMatch) {
          return sendJson(res, 401, { error: 'Invalid email or password.' });
        }

        // Regenerate session ID on login to protect against session fixation
        const sessionId = generateSessionId();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await createSession(sessionId, user.id, expiresAt);

        const isSecure = req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted);
        res.setHeader('Set-Cookie', buildSessionCookie(sessionId, Boolean(isSecure)));

        return sendJson(res, 200, {
          message: 'Login successful.',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          }
        });
      } catch (err) {
        console.error(`[AUTH /login ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable. Please try again later.' });
      }
    }

    // --- Route: POST /api/auth/logout ---
    if (pathname === '/api/auth/logout') {
      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      try {
        const sessionId = extractSessionId(req);
        if (sessionId) {
          await deleteSession(sessionId);
        }
      } catch (err) {
        console.warn(`[AUTH /logout WARN] ${err.message}`);
      }
      const isSecure = req.headers['x-forwarded-proto'] === 'https' || (req.socket && req.socket.encrypted);
      res.setHeader('Set-Cookie', buildClearSessionCookie(Boolean(isSecure)));
      return sendJson(res, 200, { message: 'Logged out successfully.' });
    }

    // --- Route: GET /api/auth/me ---
    if (pathname === '/api/auth/me') {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      try {
        const auth = await authenticateRequest(req);
        if (!auth || !auth.user) {
          return sendJson(res, 401, { authenticated: false, user: null });
        }
        return sendJson(res, 200, {
          authenticated: true,
          user: auth.user
        });
      } catch (err) {
        console.error(`[AUTH /me ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable.' });
      }
    }

    // --- Route: GET /api/submissions ---
    if (pathname === '/api/submissions') {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      try {
        const auth = await authenticateRequest(req);
        if (!auth || !auth.user) {
          return sendJson(res, 401, { error: 'Authentication required to access submission history.' });
        }
        const limit = parsedUrl.searchParams.get('limit') || 20;
        const offset = parsedUrl.searchParams.get('offset') || 0;
        const problemId = parsedUrl.searchParams.get('problemId') || null;
        const verdict = parsedUrl.searchParams.get('verdict') || null;

        const data = await getSubmissionsByUser(auth.user.id, { limit, offset, problemId, verdict });
        return sendJson(res, 200, data);
      } catch (err) {
        console.error(`[SUBMISSIONS ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable.' });
      }
    }

    // --- Route: GET /api/submissions/:id ---
    if (pathname.startsWith('/api/submissions/')) {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      try {
        const auth = await authenticateRequest(req);
        if (!auth || !auth.user) {
          return sendJson(res, 401, { error: 'Authentication required to view submission details.' });
        }
        const submissionId = parseInt(pathname.slice('/api/submissions/'.length), 10);
        if (!Number.isFinite(submissionId)) {
          return sendJson(res, 400, { error: 'Invalid submission ID.' });
        }

        // CRITICAL AUTHORIZATION INVARIANT: user_id = auth.user.id
        const submission = await getSubmissionById(submissionId, auth.user.id);
        if (!submission) {
          return sendJson(res, 404, { error: 'Submission not found or access denied.' });
        }
        return sendJson(res, 200, { submission });
      } catch (err) {
        console.error(`[SUBMISSION DETAILS ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable.' });
      }
    }

    // --- Route: GET /api/progress ---
    if (pathname === '/api/progress') {
      if (req.method !== 'GET') {
        return sendJson(res, 405, { error: 'Method Not Allowed' });
      }
      try {
        const auth = await authenticateRequest(req);
        if (!auth || !auth.user) {
          return sendJson(res, 401, { error: 'Authentication required to access learning progress.' });
        }
        const progress = await getStudentProgress(auth.user.id);
        return sendJson(res, 200, progress);
      } catch (err) {
        console.error(`[PROGRESS ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable.' });
      }
    }

    // --- Route: GET /api/lab-state/:labId or GET /api/lab-state ---
    if (pathname === '/api/lab-state' || pathname.startsWith('/api/lab-state/')) {
      try {
        const auth = await authenticateRequest(req);
        if (!auth || !auth.user) {
          return sendJson(res, 401, { error: 'Authentication required to access saved lab state.' });
        }

        const labId = pathname.startsWith('/api/lab-state/')
          ? pathname.slice('/api/lab-state/'.length).trim()
          : null;

        if (req.method === 'GET') {
          if (!labId) {
            const list = await getAllLabStates(auth.user.id);
            return sendJson(res, 200, { labStates: list });
          }
          const saved = await getLabState(auth.user.id, labId);
          if (!saved) {
            return sendJson(res, 404, { error: `No saved state found for lab '${labId}'.` });
          }
          return sendJson(res, 200, saved);
        }

        if (req.method === 'PUT' || req.method === 'POST') {
          if (!labId) {
            return sendJson(res, 400, { error: 'Lab ID is required in URL path (e.g. /api/lab-state/codelab).' });
          }

          let rawBody;
          try {
            rawBody = await readRequestBody(req, maxBodyBytes);
          } catch (err) {
            return sendJson(res, 400, { error: 'Failed to read request body.' });
          }

          let stateData;
          try {
            stateData = JSON.parse(rawBody);
          } catch (_) {
            return sendJson(res, 400, { error: 'Invalid JSON payload for lab state.' });
          }

          const saved = await saveLabState({
            userId: auth.user.id,
            labId,
            stateData
          });

          return sendJson(res, 200, {
            success: true,
            labId: saved.labId,
            updatedAt: saved.updatedAt
          });
        }

        if (req.method === 'DELETE') {
          if (!labId) {
            return sendJson(res, 400, { error: 'Lab ID is required in URL path.' });
          }
          await deleteLabState(auth.user.id, labId);
          return sendJson(res, 200, { success: true, message: `Lab state for '${labId}' deleted.` });
        }

        return sendJson(res, 405, { error: 'Method Not Allowed' });
      } catch (err) {
        console.error(`[LAB STATE ERROR] ${err.message}`);
        return sendJson(res, 503, { error: 'Database service is currently unavailable.' });
      }
    }

    // --- Route Not Found ---
    return sendJson(res, 404, { error: 'Not Found' });
  });

  return server;
}

// ---------------------------------------------------------------------------
// Request Body Reader (Bounded)
// ---------------------------------------------------------------------------

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytesReceived = 0;

    req.on('data', (chunk) => {
      bytesReceived += chunk.length;
      if (bytesReceived > maxBytes) {
        const err = new Error('Request body too large');
        err.code = 'BODY_TOO_LARGE';
        req.pause();
        return reject(err);
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Payload Validation
// ---------------------------------------------------------------------------

function validateExecutePayload(body, maxSourceBytes) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }

  if (typeof body.code !== 'string') {
    return "Field 'code' is required and must be a string.";
  }

  if (body.code.trim().length === 0) {
    return "Field 'code' must not be empty.";
  }

  const codeBytes = Buffer.byteLength(body.code, 'utf-8');
  if (codeBytes > maxSourceBytes) {
    return `Source code exceeds maximum allowed size (${codeBytes} > ${maxSourceBytes} bytes).`;
  }

  if (body.mainClass !== undefined && body.mainClass !== null) {
    if (typeof body.mainClass !== 'string') {
      return "Field 'mainClass' must be a string.";
    }
    if (!/^[A-Za-z_]\w*$/.test(body.mainClass)) {
      return "Field 'mainClass' must be a valid Java identifier (letters, digits, underscores, starting with letter or underscore).";
    }
  }

  if (body.stdin !== undefined && body.stdin !== null) {
    if (typeof body.stdin !== 'string') {
      return "Field 'stdin' must be a string.";
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Runner Outcome Mapping
// ---------------------------------------------------------------------------

function handleRunnerResult(res, result) {
  if (!result || typeof result !== 'object') {
    return sendJson(res, 500, {
      error: 'Invalid response from execution runner.',
      outcome: 'internal_error',
    });
  }

  switch (result.outcome) {
    case 'docker_unavailable':
      // 503 Service Unavailable without stack trace
      return sendJson(res, 503, {
        error: 'Execution service is temporarily unavailable (Docker unreachable).',
        outcome: 'docker_unavailable',
      });

    case 'validation_error':
      return sendJson(res, 400, {
        error: result.errorEvent?.message || 'Validation error in student code.',
        outcome: 'validation_error',
      });

    case 'internal_error':
      return sendJson(res, 500, {
        error: 'An internal error occurred during execution.',
        outcome: 'internal_error',
      });

    case 'compilation_error':
    case 'timeout':
    case 'runtime_error':
    case 'success':
    default:
      // These are normal execution outcomes that the frontend/client inspects
      return sendJson(res, 200, {
        outcome: result.outcome,
        events: result.events || [],
        initEvent: result.initEvent || null,
        exitEvent: result.exitEvent || null,
        errorEvent: result.errorEvent || null,
        truncationEvent: result.truncationEvent || null,
        stepCount: result.stepCount ?? 0,
        timedOut: !!result.timedOut,
        stdoutTruncated: !!result.stdoutTruncated,
        stderrTruncated: !!result.stderrTruncated,
        containerExitCode: result.containerExitCode ?? 0,
        stderr: sanitizeStderr(result.stderr),
      });
  }
}

/**
 * Sanitizes stderr before returning to client (prevents host path disclosure).
 */
function sanitizeStderr(stderr) {
  if (!stderr || typeof stderr !== 'string') return '';
  // Strip out any host path references if any leaked
  return stderr.replace(/([A-Za-z]:\\[^ \r\n:]+|\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/g, (match) => {
    // Keep /sandbox/ references inside container, sanitize others
    if (match.startsWith('/sandbox/')) return match;
    return '<path>';
  });
}

// ---------------------------------------------------------------------------
// JSON Response Helper
// ---------------------------------------------------------------------------

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

// ---------------------------------------------------------------------------
// Standalone Server Entrypoint
// ---------------------------------------------------------------------------

export function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const invokedFilePath = path.resolve(process.argv[1]);
    return path.normalize(currentFilePath).toLowerCase() === path.normalize(invokedFilePath).toLowerCase();
  } catch (_) {
    return false;
  }
}

if (isDirectExecution()) {
  const port = parseEnvInt(process.env.PORT, SERVER_DEFAULTS.port, 1, 65535);
  const host = process.env.HOST || SERVER_DEFAULTS.host;

  const rawOrigins = process.env.ALLOWED_ORIGIN ?? process.env.ALLOWED_ORIGINS ?? SERVER_DEFAULTS.allowedOrigins;
  const configuredOrigins = parseAllowedOrigins(rawOrigins);

  const server = createServer();
  server.listen(port, host, () => {
    console.log(`=============================================================`);
    console.log(` ALGOLAB Runner HTTP API`);
    console.log(` Listening on http://${host}:${port}`);
    console.log(` Concurrency limit: ${SERVER_DEFAULTS.maxConcurrency}`);
    console.log(` Allowed origins: ${configuredOrigins.length > 0 ? configuredOrigins.join(', ') : '(local dev only)'}`);
    console.log(` Health check: http://${host}:${port}/api/health`);
    console.log(`=============================================================`);
  });

  const shutdown = () => {
    console.log('\nShutting down ALGOLAB Runner HTTP API cleanly...');
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
