// =============================================================================
// ALGOLAB — Authentication & Session Service (Phase 15)
//
// Implements bcrypt password hashing, input validation, session cookie handling,
// rate limiting, and request authentication extraction.
// =============================================================================

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
  findUserById,
  createSession,
  findSession,
  deleteSession
} from './db/auth-repository.js';

const SESSION_COOKIE_NAME = 'algolab_session';
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

// In-memory rate limiting map for auth endpoints (IP -> { count, resetTime })
const authRateLimitMap = new Map();
const RATE_LIMIT_MAX_ATTEMPTS = 15;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks and updates rate limits for the given client IP.
 * @param {string} ip
 * @returns {boolean} true if request is permitted, false if rate limited
 */
export function checkAuthRateLimit(ip) {
  const now = Date.now();
  const entry = authRateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    authRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Validates registration input payload.
 *
 * @param {object} body
 * @returns {string|null} Error message or null if valid
 */
export function validateRegistrationPayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid JSON payload.';
  }

  const { name, email, password, confirmPassword } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Full name is required and must be at least 2 characters.';
  }
  if (name.trim().length > 100) {
    return 'Full name cannot exceed 100 characters.';
  }

  if (!email || typeof email !== 'string') {
    return 'A valid email address is required.';
  }
  const emailTrimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed) || emailTrimmed.length > 191) {
    return 'Please provide a valid email address.';
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password cannot exceed 128 characters.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
}

/**
 * Validates login input payload.
 *
 * @param {object} body
 * @returns {string|null} Error message or null if valid
 */
export function validateLoginPayload(body) {
  if (!body || typeof body !== 'object') {
    return 'Invalid JSON payload.';
  }

  const { email, password } = body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return 'Email is required.';
  }
  if (!password || typeof password !== 'string' || !password) {
    return 'Password is required.';
  }

  return null;
}

/**
 * Hashes plaintext password using bcrypt.
 *
 * @param {string} plaintext
 * @returns {Promise<string>}
 */
export async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, 10);
}

/**
 * Compares plaintext password against stored hash.
 *
 * @param {string} plaintext
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plaintext, hash) {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
}

/**
 * Generates a cryptographically secure 256-bit session token.
 *
 * @returns {string}
 */
export function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Builds the Set-Cookie header for an authenticated session.
 *
 * @param {string} sessionId
 * @param {boolean} [isSecure=false]
 * @returns {string}
 */
export function buildSessionCookie(sessionId, isSecure = false) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`
  ];
  if (isSecure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Builds the Set-Cookie header to clear the session cookie.
 *
 * @param {boolean} [isSecure=false]
 * @returns {string}
 */
export function buildClearSessionCookie(isSecure = false) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ];
  if (isSecure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

/**
 * Parses the session ID from request headers.
 *
 * @param {object} req
 * @returns {string|null}
 */
export function extractSessionId(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;

  const cookies = cookieHeader.split(';');
  for (const c of cookies) {
    const [name, ...val] = c.trim().split('=');
    if (name === SESSION_COOKIE_NAME) {
      return val.join('=').trim() || null;
    }
  }
  return null;
}

/**
 * Resolves the authenticated user from the HTTP request.
 *
 * @param {object} req
 * @returns {Promise<{ user: object, sessionId: string }|null>}
 */
export async function authenticateRequest(req) {
  const sessionId = extractSessionId(req);
  if (!sessionId) return null;

  try {
    const session = await findSession(sessionId);
    if (!session) return null;

    return {
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        createdAt: session.userCreatedAt
      },
      sessionId
    };
  } catch (err) {
    console.warn(`[AUTH] Failed to resolve session: ${err.message}`);
    return null;
  }
}
