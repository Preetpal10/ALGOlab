// =============================================================================
// ALGOLAB — Docker Container Execution Bridge (Phase 5)
//
// Accepts student Java source code, writes it to a per-job temp directory,
// spawns an ephemeral Docker container with strict isolation flags, and
// parses the resulting JSONL trace events from stdout.
//
// SECURITY INVARIANTS:
// - Student code is NEVER executed in the Node.js process.
// - Docker is spawned with an explicit argument array — no shell expansion.
// - Student code is written to disk, bind-mounted read-only, then cleaned up.
// - Container runs with --network none, --read-only, --user 1001:1001,
//   bounded memory/cpu/pids, and no capability escalation.
// - JDWP is never exposed.
// - This is a development proof-of-concept, not a production sandbox.
// =============================================================================

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Configuration defaults
// ---------------------------------------------------------------------------

const DEFAULTS = Object.freeze({
  dockerImage: 'algolab-runner:latest',
  timeoutMs: 15_000,        // Host-side hard timeout (includes container startup)
  maxEvents: 1000,
  maxArrayLength: 50,
  maxStringLength: 100,
  maxOutputBytes: 10_000,
  maxSourceBytes: 64_000,   // Max student source file size (64 KB)
  maxStdoutBytes: 512_000,  // Max bytes collected from Docker stdout
  maxStderrBytes: 64_000,   // Max bytes collected from Docker stderr
  containerMemory: '256m',
  containerCpus: '1.0',
  containerPidsLimit: '64',
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute student Java code inside an isolated Docker container.
 *
 * @param {object} request
 * @param {string} request.code           - Java source code
 * @param {string} [request.mainClass]    - Main class name (derived from code if absent)
 * @param {string} [request.stdin]        - Standard input for the program
 * @param {object} [request.limits]       - Execution limits overrides
 * @param {number} [request.limits.timeoutMs]
 * @param {number} [request.limits.maxEvents]
 * @param {number} [request.limits.maxArrayLength]
 * @param {number} [request.limits.maxStringLength]
 * @param {number} [request.limits.maxOutputBytes]
 * @returns {Promise<RunResult>}
 */
export async function runInContainer(request) {
  // --- Step 1: Validate request ---
  const validation = validateRequest(request);
  if (!validation.valid) {
    return makeErrorResult('validation_error', validation.message);
  }

  const code = request.code;
  const mainClass = request.mainClass || detectMainClass(code);
  const stdin = request.stdin || null;
  const limits = {
    timeoutMs:       clampInt(request.limits?.timeoutMs,       1000, 30_000, DEFAULTS.timeoutMs),
    maxEvents:       clampInt(request.limits?.maxEvents,       1,    10_000, DEFAULTS.maxEvents),
    maxArrayLength:  clampInt(request.limits?.maxArrayLength,  1,    500,    DEFAULTS.maxArrayLength),
    maxStringLength: clampInt(request.limits?.maxStringLength, 1,    1000,   DEFAULTS.maxStringLength),
    maxOutputBytes:  clampInt(request.limits?.maxOutputBytes,  100,  100_000,DEFAULTS.maxOutputBytes),
  };

  // --- Step 2: Create per-job temp directory ---
  const jobId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `algolab_job_${jobId}`);
  const sourceFileName = `${mainClass}.java`;
  const sourceFilePath = path.join(tempDir, sourceFileName);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(sourceFilePath, code, 'utf-8');

    // --- Step 3: Build Docker argument array ---
    const containerSourcePath = `/sandbox/build/${sourceFileName}`;
    const dockerArgs = buildDockerArgs({
      sourceFilePath,
      containerSourcePath,
      mainClass,
      stdin,
      limits,
      jobId,
    });

    // --- Step 4: Spawn Docker and collect output ---
    const execResult = await spawnDocker(dockerArgs, limits.timeoutMs);

    // --- Step 5: Parse JSONL events ---
    const parseResult = parseJsonlOutput(execResult.stdout, limits.maxEvents);

    // --- Step 6: Determine outcome ---
    return buildRunResult(execResult, parseResult, limits);

  } catch (err) {
    // Docker not found, permission denied, or other system error
    if (err.code === 'ENOENT' && err.syscall === 'spawn') {
      return makeErrorResult('docker_unavailable',
        'Docker is not available. Ensure Docker Desktop is running and docker is in PATH.');
    }
    return makeErrorResult('internal_error', err.message);
  } finally {
    // --- Cleanup: always remove temp directory ---
    await cleanupTempDir(tempDir);
  }
}

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

function validateRequest(request) {
  if (!request || typeof request !== 'object') {
    return { valid: false, message: 'Request must be a non-null object.' };
  }
  if (typeof request.code !== 'string') {
    return { valid: false, message: 'Request.code must be a string.' };
  }
  if (request.code.trim().length === 0) {
    return { valid: false, message: 'Request.code must not be empty.' };
  }
  const codeBytes = Buffer.byteLength(request.code, 'utf-8');
  if (codeBytes > DEFAULTS.maxSourceBytes) {
    return { valid: false, message: `Source code exceeds maximum size (${codeBytes} > ${DEFAULTS.maxSourceBytes} bytes).` };
  }
  if (request.mainClass !== undefined && request.mainClass !== null) {
    if (typeof request.mainClass !== 'string' || !/^[A-Za-z_]\w*$/.test(request.mainClass)) {
      return { valid: false, message: 'Invalid mainClass name. Must be a valid Java identifier.' };
    }
  }
  if (request.stdin !== undefined && request.stdin !== null && typeof request.stdin !== 'string') {
    return { valid: false, message: 'Request.stdin must be a string or null.' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Main class detection
// ---------------------------------------------------------------------------

function detectMainClass(code) {
  // Match `public class ClassName` — first occurrence
  const match = code.match(/public\s+class\s+([A-Za-z_]\w*)/);
  return match ? match[1] : 'Solution';
}

// ---------------------------------------------------------------------------
// Docker argument construction (no shell, explicit array)
// ---------------------------------------------------------------------------

function buildDockerArgs({ sourceFilePath, containerSourcePath, mainClass, stdin, limits, jobId }) {
  const args = [
    'run', '--rm',
    '--name', `algolab-run-${jobId}`,
    '--network', 'none',
    '--memory', DEFAULTS.containerMemory,
    '--memory-swap', DEFAULTS.containerMemory,
    '--cpus', DEFAULTS.containerCpus,
    '--pids-limit', DEFAULTS.containerPidsLimit,
    '--read-only',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
    '--tmpfs', '/sandbox/build:rw,exec,nosuid,size=32m,mode=1777',
    '--user', '1001:1001',
    '--cap-drop', 'ALL',
    '--security-opt', 'no-new-privileges:true',
    // Mount only the student source file, read-only
    '-v', `${sourceFilePath}:${containerSourcePath}:ro`,
    // Image
    DEFAULTS.dockerImage,
    // Tracer CLI arguments (passed to entrypoint)
    '--source', containerSourcePath,
    '--main', mainClass,
    '--timeout-ms', String(limits.timeoutMs > 2000 ? limits.timeoutMs - 2000 : limits.timeoutMs),
    '--max-events', String(limits.maxEvents),
    '--max-array-length', String(limits.maxArrayLength),
    '--max-string-length', String(limits.maxStringLength),
    '--max-output-bytes', String(limits.maxOutputBytes),
  ];

  if (stdin) {
    args.push('--stdin', stdin);
  }

  return args;
}

// ---------------------------------------------------------------------------
// Docker process spawning with bounded output and timeout
// ---------------------------------------------------------------------------

function spawnDocker(dockerArgs, timeoutMs) {
  return new Promise((resolve, reject) => {
    let proc;
    try {
      proc = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch (err) {
      return reject(err);
    }

    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stdoutTruncated = false;
    let stderrTruncated = false;
    let timedOut = false;
    let killed = false;

    // Bounded stdout collection
    proc.stdout.on('data', (chunk) => {
      if (stdoutBytes >= DEFAULTS.maxStdoutBytes) {
        stdoutTruncated = true;
        return;
      }
      const remaining = DEFAULTS.maxStdoutBytes - stdoutBytes;
      if (chunk.length > remaining) {
        stdoutChunks.push(chunk.slice(0, remaining));
        stdoutBytes += remaining;
        stdoutTruncated = true;
      } else {
        stdoutChunks.push(chunk);
        stdoutBytes += chunk.length;
      }
    });

    // Bounded stderr collection
    proc.stderr.on('data', (chunk) => {
      if (stderrBytes >= DEFAULTS.maxStderrBytes) {
        stderrTruncated = true;
        return;
      }
      const remaining = DEFAULTS.maxStderrBytes - stderrBytes;
      if (chunk.length > remaining) {
        stderrChunks.push(chunk.slice(0, remaining));
        stderrBytes += remaining;
        stderrTruncated = true;
      } else {
        stderrChunks.push(chunk);
        stderrBytes += chunk.length;
      }
    });

    // Host-side hard timeout
    const timer = setTimeout(() => {
      timedOut = true;
      killed = true;
      try { proc.kill('SIGKILL'); } catch (_) { /* already exited */ }
    }, timeoutMs);

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
        stderr: Buffer.concat(stderrChunks).toString('utf-8'),
        exitCode: exitCode ?? -1,
        signal,
        timedOut,
        killed,
        stdoutTruncated,
        stderrTruncated,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// JSONL parsing with validation and event cap
// ---------------------------------------------------------------------------

function parseJsonlOutput(stdout, maxEvents) {
  const lines = stdout.split(/\r?\n/).filter(l => l.trim().length > 0);
  const events = [];
  const malformedLines = [];
  let initEvent = null;
  let exitEvent = null;
  let errorEvent = null;
  let truncationEvent = null;
  let stepCount = 0;
  let eventCapExceeded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Event cap: stop parsing after maxEvents + 10 non-step events margin
    if (events.length >= maxEvents + 50) {
      eventCapExceeded = true;
      break;
    }

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (_) {
      malformedLines.push({ lineIndex: i, preview: line.substring(0, 200) });
      continue;
    }

    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      malformedLines.push({ lineIndex: i, preview: line.substring(0, 200) });
      continue;
    }

    // Classify events
    switch (parsed.type) {
      case 'init':
        initEvent = parsed;
        break;
      case 'step':
        stepCount++;
        break;
      case 'truncation':
        truncationEvent = parsed;
        break;
      case 'exit':
        exitEvent = parsed;
        break;
      case 'error':
        errorEvent = parsed;
        break;
      // Unknown types are still collected
    }

    events.push(parsed);
  }

  return {
    events,
    initEvent,
    exitEvent,
    errorEvent,
    truncationEvent,
    stepCount,
    totalLines: lines.length,
    malformedLines,
    eventCapExceeded,
  };
}

// ---------------------------------------------------------------------------
// Result construction
// ---------------------------------------------------------------------------

/**
 * @typedef {object} RunResult
 * @property {string}  outcome      - 'success' | 'compilation_error' | 'timeout' | 'runtime_error' | 'docker_unavailable' | 'validation_error' | 'internal_error'
 * @property {Array}   events       - Parsed JSONL events
 * @property {object|null} initEvent
 * @property {object|null} exitEvent
 * @property {object|null} errorEvent
 * @property {object|null} truncationEvent
 * @property {number}  stepCount
 * @property {number}  containerExitCode
 * @property {string}  stderr       - Bounded container stderr
 * @property {boolean} timedOut
 * @property {boolean} stdoutTruncated
 * @property {boolean} stderrTruncated
 * @property {number}  malformedLineCount
 * @property {boolean} eventCapExceeded
 */

function buildRunResult(execResult, parseResult, limits) {
  const result = {
    outcome: 'success',
    events: parseResult.events,
    initEvent: parseResult.initEvent,
    exitEvent: parseResult.exitEvent,
    errorEvent: parseResult.errorEvent,
    truncationEvent: parseResult.truncationEvent,
    stepCount: parseResult.stepCount,
    containerExitCode: execResult.exitCode,
    stderr: execResult.stderr,
    timedOut: execResult.timedOut,
    stdoutTruncated: execResult.stdoutTruncated,
    stderrTruncated: execResult.stderrTruncated,
    malformedLineCount: parseResult.malformedLines.length,
    eventCapExceeded: parseResult.eventCapExceeded,
  };

  // Determine outcome from container behaviour
  if (execResult.timedOut) {
    result.outcome = 'timeout';
  } else if (parseResult.errorEvent) {
    const errorType = parseResult.errorEvent.errorType;
    if (errorType === 'compilation_error') {
      result.outcome = 'compilation_error';
    } else if (errorType === 'timeout') {
      result.outcome = 'timeout';
    } else {
      result.outcome = 'runtime_error';
    }
  } else if (execResult.exitCode === 2) {
    // Tracer exit code 2 = timeout
    result.outcome = 'timeout';
  } else if (execResult.exitCode === 1) {
    result.outcome = 'runtime_error';
  } else if (execResult.exitCode !== 0) {
    result.outcome = 'runtime_error';
  }
  // exitCode 0 with no error event = success

  return result;
}

function makeErrorResult(outcome, message) {
  return {
    outcome,
    events: [],
    initEvent: null,
    exitEvent: null,
    errorEvent: { type: 'error', errorType: outcome, message },
    truncationEvent: null,
    stepCount: 0,
    containerExitCode: -1,
    stderr: '',
    timedOut: false,
    stdoutTruncated: false,
    stderrTruncated: false,
    malformedLineCount: 0,
    eventCapExceeded: false,
  };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clampInt(value, min, max, fallback) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

async function cleanupTempDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (_) {
    // Best-effort cleanup; temp dir will be purged by OS eventually
  }
}
