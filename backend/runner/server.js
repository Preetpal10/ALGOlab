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

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInContainer } from './docker-runner.js';

// ---------------------------------------------------------------------------
// Server Configuration Defaults
// ---------------------------------------------------------------------------

export const SERVER_DEFAULTS = Object.freeze({
  host: '127.0.0.1',
  port: 3001,
  maxBodyBytes: 128 * 1024,      // 128 KB max request body
  maxSourceBytes: 64 * 1024,    // 64 KB max student source code
  maxConcurrency: 2,             // Max concurrent Docker executions
  requestTimeoutMs: 25_000,      // Server-side safety deadline
  serviceName: 'algolab-runner',
  serviceVersion: '1.0.0',
});

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
 * @returns {http.Server}
 */
export function createServer(options = {}) {
  const runner = options.runner || runInContainer;
  const maxConcurrency = options.maxConcurrency ?? SERVER_DEFAULTS.maxConcurrency;
  const maxBodyBytes = options.maxBodyBytes ?? SERVER_DEFAULTS.maxBodyBytes;
  const maxSourceBytes = options.maxSourceBytes ?? SERVER_DEFAULTS.maxSourceBytes;
  const requestTimeoutMs = options.requestTimeoutMs ?? SERVER_DEFAULTS.requestTimeoutMs;

  let activeExecutions = 0;

  const server = http.createServer(async (req, res) => {
    // Set standard security headers on all responses
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');

    // CORS headers: restricted strictly to local development origins
    const origin = req.headers.origin;
    if (origin && isAllowedLocalOrigin(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (!origin) {
      // Direct curl, tests, or non-browser requests
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
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

function isAllowedLocalOrigin(origin) {
  if (origin === 'null') return true; // file:// origin in browsers
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
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
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : SERVER_DEFAULTS.port;
  const host = process.env.HOST || SERVER_DEFAULTS.host;

  const server = createServer();
  server.listen(port, host, () => {
    console.log(`=============================================================`);
    console.log(` ALGOLAB Runner HTTP API`);
    console.log(` Listening on http://${host}:${port}`);
    console.log(` Concurrency limit: ${SERVER_DEFAULTS.maxConcurrency}`);
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
