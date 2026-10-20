// =============================================================================
// ALGOLAB — Frontend API Configuration & Diagnostics (Phase 12.3)
//
// Manages environment-aware API URL resolution, health checks, and execution
// error classification for ALGOLAB Code Lab.
//
// Supports:
// - Local development (http://127.0.0.1:3001)
// - Configurable remote HTTPS API endpoints for production
// - Safe fallback to Offline Demo Mode on deployed hosts without remote API
// - Prevention of false success messages and localhost requests from production
// =============================================================================

/**
 * Checks whether a given hostname is a local loopback / development host.
 * @param {string} [hostname]
 * @returns {boolean}
 */
export function isLocalHostname(hostname) {
  if (!hostname || typeof hostname !== "string") return true;
  const clean = hostname.trim().toLowerCase();
  return (
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "[::1]" ||
    clean === "0.0.0.0" ||
    clean === ""
  );
}

/**
 * Resolves the API configuration based on page location and runtime settings.
 *
 * Priority:
 * 1. window.ALGOLAB_API_URL or options.customUrl (explicit custom endpoint)
 * 2. Localhost fallback (http://127.0.0.1:3001) when running locally
 * 3. Offline Demo Mode when running on a hosted domain without custom API URL
 *
 * @param {object} [options]
 * @param {string} [options.hostname]
 * @param {string} [options.protocol]
 * @param {string} [options.customUrl]
 * @returns {object} Resolved API configuration
 */
export function resolveApiConfig(options = {}) {
  let hostname = options.hostname;
  let protocol = options.protocol;
  let customUrl = options.customUrl;

  // Auto-detect from browser window if running in DOM environment
  if (typeof window !== "undefined") {
    if (hostname === undefined && window.location) {
      hostname = window.location.hostname;
    }
    if (protocol === undefined && window.location) {
      protocol = window.location.protocol;
    }
    if (customUrl === undefined) {
      customUrl =
        window.ALGOLAB_API_URL ||
        (window.ALGOLAB_CONFIG && window.ALGOLAB_CONFIG.apiUrl) ||
        null;
    }
  }

  hostname = (hostname || "").trim();
  protocol = (protocol || "").toLowerCase();

  // Case 1: Custom API URL explicitly provided
  if (customUrl && typeof customUrl === "string" && customUrl.trim().length > 0) {
    const trimmed = customUrl.trim().replace(/\/+$/, "");

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return {
          mode: "error",
          configured: false,
          isLocal: false,
          baseUrl: null,
          executeUrl: null,
          healthUrl: null,
          statusText: "Invalid API Protocol",
          statusType: "error",
          error: `API URL must use HTTP or HTTPS protocol: "${trimmed}"`
        };
      }

      // Security & mixed-content guard: HTTPS pages cannot fetch plain HTTP endpoints
      if (protocol === "https:" && parsed.protocol === "http:" && !isLocalHostname(parsed.hostname)) {
        return {
          mode: "error",
          configured: false,
          isLocal: false,
          baseUrl: null,
          executeUrl: null,
          healthUrl: null,
          statusText: "Mixed Content Blocked",
          statusType: "error",
          error: `Cannot connect to insecure HTTP API (${trimmed}) from an HTTPS page. Use HTTPS for production API.`
        };
      }

      const isLocal = isLocalHostname(parsed.hostname);
      return {
        mode: isLocal ? "local-custom" : "remote",
        configured: true,
        isLocal,
        baseUrl: trimmed,
        executeUrl: `${trimmed}/api/execute`,
        healthUrl: `${trimmed}/api/health`,
        judgeUrl: `${trimmed}/api/judge`,
        problemsUrl: `${trimmed}/api/problems`,
        authUrl: `${trimmed}/api/auth`,
        submissionsUrl: `${trimmed}/api/submissions`,
        progressUrl: `${trimmed}/api/progress`,
        labStateUrl: `${trimmed}/api/lab-state`,
        statusText: isLocal ? "Custom Local API" : "Configured Remote API",
        statusType: "pending"
      };
    } catch (err) {
      return {
        mode: "error",
        configured: false,
        isLocal: false,
        baseUrl: null,
        executeUrl: null,
        healthUrl: null,
        judgeUrl: null,
        problemsUrl: null,
        authUrl: null,
        submissionsUrl: null,
        progressUrl: null,
        labStateUrl: null,
        statusText: "Malformed API URL",
        statusType: "error",
        error: `Invalid URL format for API configuration: "${trimmed}"`
      };
    }
  }

  // Case 2: Local development fallback
  if (isLocalHostname(hostname)) {
    // When running in a browser on localhost, align the API host with the page hostname
    // so that session cookies (SameSite=Lax) are treated as same-site and sent with
    // credentials: 'include'. In hermetic node test runners (no window), default to 127.0.0.1.
    const isBrowserLocalhost = typeof window !== "undefined" && window.location && window.location.hostname === "localhost";
    const devHost = isBrowserLocalhost ? "localhost" : "127.0.0.1";
    const localBase = `http://${devHost}:3001`;
    return {
      mode: "local",
      configured: true,
      isLocal: true,
      baseUrl: localBase,
      executeUrl: `${localBase}/api/execute`,
      healthUrl: `${localBase}/api/health`,
      judgeUrl: `${localBase}/api/judge`,
      problemsUrl: `${localBase}/api/problems`,
      authUrl: `${localBase}/api/auth`,
      submissionsUrl: `${localBase}/api/submissions`,
      progressUrl: `${localBase}/api/progress`,
      labStateUrl: `${localBase}/api/lab-state`,
      statusText: `Local Backend (${devHost}:3001)`,
      statusType: "pending"
    };
  }

  // Case 3: Hosted production environment with NO API URL configured.
  // CRITICAL: Do NOT attempt localhost from a remote hosted page!
  return {
    mode: "offline-demo",
    configured: false,
    isLocal: false,
    baseUrl: null,
    executeUrl: null,
    healthUrl: null,
    judgeUrl: null,
    problemsUrl: null,
    authUrl: null,
    submissionsUrl: null,
    progressUrl: null,
    labStateUrl: null,
    baseUrl: null,
    executeUrl: null,
    healthUrl: null,
    judgeUrl: null,
    problemsUrl: null,
    authUrl: null,
    submissionsUrl: null,
    progressUrl: null,
    statusText: "Offline Demo Mode",
    statusType: "info",
    reason: "unconfigured_remote",
    notice:
      "No remote Java execution backend is configured for this domain. Code Lab is operating in Offline Demo Mode. Pre-recorded JDI demo fixtures are available."
  };
}

/**
 * Checks the reachability and health of the execution service.
 *
 * @param {string} healthUrl - Full URL to /api/health
 * @param {object} [options]
 * @param {Function} [options.fetchFn] - Fetch implementation (default: global fetch)
 * @param {number} [options.timeoutMs] - Probe timeout in milliseconds (default: 3000)
 * @returns {Promise<{ ok: boolean, status: number, data?: any, error?: string }>}
 */
export async function checkBackendHealth(healthUrl, options = {}) {
  const fetchFn = options.fetchFn || (typeof fetch !== "undefined" ? fetch : null);
  const timeoutMs = options.timeoutMs || 3000;

  if (!fetchFn || !healthUrl) {
    return { ok: false, status: 0, error: "Health check unavailable: no fetch or URL provided" };
  }

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetchFn(healthUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (res.ok && data && (data.status === "ok" || data.service === "algolab-runner")) {
      return { ok: true, status: res.status, data };
    }

    return {
      ok: false,
      status: res.status,
      data,
      error: `Health check returned HTTP ${res.status}`
    };
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: err.name === "AbortError" ? "Health check timed out" : (err.message || "Network unreachable")
    };
  }
}

/**
 * Classifies an API execution response or error into user-facing status badges and console messages.
 *
 * @param {object} params
 * @param {number} [params.status] - HTTP status code
 * @param {object} [params.data] - Parsed JSON response body
 * @param {string} [params.error] - Network or fetch error message
 * @param {boolean} [params.isTimeout] - True if request timed out on client
 * @param {object} [params.config] - Current API configuration
 * @returns {object} Classification result
 */
export function classifyApiResult({ status, data, error, isTimeout, config }) {
  if (isTimeout) {
    return {
      success: false,
      badgeText: "Request Timed Out",
      badgeClass: "badge-error",
      statusLabel: "Timed Out",
      messages: [
        { text: "Execution Request Timed Out: The backend server did not complete execution within the timeout limit.", type: "error" },
        { text: "Hint: Your program may contain an infinite loop or excessive computation.", type: "muted" }
      ]
    };
  }

  if (error) {
    const isLocal = config?.isLocal ?? true;
    return {
      success: false,
      badgeText: "Execution Service Offline",
      badgeClass: "badge-error",
      statusLabel: "Connection Failed",
      messages: [
        { text: `Cannot connect to Java execution backend: ${error}`, type: "error" },
        {
          text: isLocal
            ? "Hint: Run 'npm start' in backend/runner to start the local API server on http://127.0.0.1:3001."
            : "Hint: Verify network reachability, HTTPS certificate, and CORS configuration on your remote runner VM.",
          type: "muted"
        }
      ]
    };
  }

  if (status === 403) {
    return {
      success: false,
      badgeText: "Access Denied (403)",
      badgeClass: "badge-error",
      statusLabel: "CORS / Forbidden",
      messages: [
        { text: `CORS / Access Denied (403): ${data?.error || "This origin is not allowed by the backend CORS configuration."}`, type: "error" },
        { text: "Hint: Set ALLOWED_ORIGIN on the backend runner to include this domain.", type: "muted" }
      ]
    };
  }

  if (status === 413) {
    return {
      success: false,
      badgeText: "Code Too Large (413)",
      badgeClass: "badge-error",
      statusLabel: "Payload Too Large",
      messages: [
        { text: "Payload Too Large (413): Java code submission exceeds allowed size limit.", type: "error" }
      ]
    };
  }

  if (status === 415) {
    return {
      success: false,
      badgeText: "Unsupported Media (415)",
      badgeClass: "badge-error",
      statusLabel: "Unsupported Format",
      messages: [
        { text: "Unsupported Media Type (415): Request Content-Type must be application/json.", type: "error" }
      ]
    };
  }

  if (status === 429) {
    return {
      success: false,
      badgeText: "Server Busy (429)",
      badgeClass: "badge-pending",
      statusLabel: "Too Many Requests",
      messages: [
        { text: "Server Busy (429): Maximum concurrent container executions reached. Please try again shortly.", type: "warn" }
      ]
    };
  }

  if (status === 503 || data?.outcome === "docker_unavailable") {
    return {
      success: false,
      badgeText: "Docker Unavailable",
      badgeClass: "badge-error",
      statusLabel: "Docker Offline",
      messages: [
        { text: "Docker Service Unavailable (503): Backend reached, but Docker Desktop is not running or the algolab-runner image is missing.", type: "error" },
        { text: "Notice: Pre-recorded demo fixtures remain available for trace playback.", type: "info" }
      ]
    };
  }

  if (status && status !== 200) {
    return {
      success: false,
      badgeText: `Execution Error (${status})`,
      badgeClass: "badge-error",
      statusLabel: "Error",
      messages: [
        { text: `Execution Service Error (${status}): ${data?.error || "Unknown server error"}`, type: "error" }
      ]
    };
  }

  // HTTP 200 — Validate schema
  if (!data || typeof data !== "object") {
    return {
      success: false,
      badgeText: "Malformed Response",
      badgeClass: "badge-error",
      statusLabel: "Invalid Data",
      messages: [
        { text: "Malformed API Response: Execution server returned invalid or non-JSON response data.", type: "error" }
      ]
    };
  }

  if (!data.outcome || typeof data.outcome !== "string") {
    return {
      success: false,
      badgeText: "Invalid Outcome",
      badgeClass: "badge-error",
      statusLabel: "Missing Outcome",
      messages: [
        { text: "Invalid API Response: Server response is missing the required execution 'outcome' field.", type: "error" }
      ]
    };
  }

  return {
    success: true,
    outcome: data.outcome,
    data
  };
}
