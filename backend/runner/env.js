// =============================================================================
// ALGOLAB — Environment Variable Loader
//
// Automatically loads environment configuration from .env using Node.js's
// native process.loadEnvFile (Node.js v20.6+) with a robust zero-dependency
// fallback. Secrets are never logged or exposed.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let envLoaded = false;

/**
 * Loads environment variables from the nearest .env file.
 * Prioritizes backend/runner/.env, falling back to root .env.
 * Existing process.env entries take precedence.
 *
 * @param {string} [customPath]
 * @returns {boolean} true if an env file was found and processed
 */
export function loadEnv(customPath = null) {
  if (envLoaded && !customPath) {
    return true;
  }

  const candidatePaths = customPath
    ? [path.resolve(customPath)]
    : [
        path.join(__dirname, '.env'),
        path.join(__dirname, '../../.env'),
        path.resolve(process.cwd(), '.env')
      ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        } else {
          // Zero-dependency fallback parser for Node.js < 20.6
          const content = fs.readFileSync(envPath, 'utf8');
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const key = trimmed.slice(0, eqIdx).trim();
              let val = trimmed.slice(eqIdx + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
              }
              if (!(key in process.env)) {
                process.env[key] = val;
              }
            }
          }
        }
        envLoaded = true;
        return true;
      } catch (err) {
        // Log safe message without printing file content or secrets
        console.warn(`[ENV] Warning: Unable to load environment file at ${envPath}: ${err.message}`);
      }
    }
  }

  return false;
}

// Automatically invoke on module import
loadEnv();
