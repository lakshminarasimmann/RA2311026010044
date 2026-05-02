/**
 * @module logger
 * @description Core logging utility. Sends structured JSON logs to the
 *              external evaluation-service API asynchronously.
 *              Designed to be fire-and-forget — logging failures never
 *              propagate to the caller.
 */

"use strict";

const http = require("http");
const {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES,
  validate,
} = require("./constants");

/* ------------------------------------------------------------------ */
/*  Module state                                                      */
/* ------------------------------------------------------------------ */

const LOG_API_HOST = "20.207.122.201";
const LOG_API_PATH = "/evaluation-service/logs";
const REQUEST_TIMEOUT_MS = 5000;

let _accessToken = null;

/**
 * Set the Bearer token used to authenticate log API requests.
 * Must be called once at application startup after obtaining the token.
 * @param {string} token - The access_token from /evaluation-service/auth
 */
function setToken(token) {
  if (!token || typeof token !== "string") {
    console.warn("[Logger] setToken called with invalid token — skipping.");
    return;
  }
  _accessToken = token.trim();
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                  */
/* ------------------------------------------------------------------ */

/**
 * Level priority for console colouring / filtering.
 */
const LEVEL_PRIORITY = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

/**
 * Colour codes for terminal output.
 */
const LEVEL_COLORS = {
  debug: "\x1b[36m",  // cyan
  info:  "\x1b[32m",  // green
  warn:  "\x1b[33m",  // yellow
  error: "\x1b[31m",  // red
  fatal: "\x1b[35m",  // magenta
};
const RESET = "\x1b[0m";

/**
 * Print a structured log line to the console as a local fallback.
 */
function consoleLog(level, pkg, message, timestamp) {
  const color = LEVEL_COLORS[level] || "";
  const prefix = `${color}[${level.toUpperCase()}]${RESET}`;
  console.log(`${prefix} [${timestamp}] [${pkg}] ${message}`);
}

/**
 * Fire-and-forget HTTP POST to the external logging API.
 * Uses Node's built-in `http` module — no external dependencies.
 */
function sendToApi(payload) {
  return new Promise((resolve) => {
    if (!_accessToken) {
      // Silently skip remote logging when no token is configured
      resolve(false);
      return;
    }

    const body = JSON.stringify(payload);

    const options = {
      hostname: LOG_API_HOST,
      port: 80,
      path: LOG_API_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${_accessToken}`,
      },
      timeout: REQUEST_TIMEOUT_MS,
    };

    const req = http.request(options, (res) => {
      // Drain the response to free resources
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.write(body);
    req.end();
  });
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Send a structured log entry.
 *
 * @param {string} stack   - Application stack (e.g., "backend")
 * @param {string} level   - Severity level (debug | info | warn | error | fatal)
 * @param {string} pkg     - Originating package (handler | repository | route | service | auth | config | middleware | utils)
 * @param {string} message - Human-readable log message
 * @returns {Promise<void>} Resolves when the log has been dispatched (never rejects)
 *
 * @example
 *   await Log("backend", "info", "route", "GET /vehicles called");
 */
async function Log(stack, level, pkg, message) {
  try {
    // ---- Validate inputs ----
    const checks = [
      validate(stack, ALLOWED_STACKS, "stack"),
      validate(level, ALLOWED_LEVELS, "level"),
      validate(pkg, ALLOWED_PACKAGES, "package"),
    ];

    for (const check of checks) {
      if (!check.valid) {
        console.warn(`[Logger] Validation failed: ${check.error}`);
        return;
      }
    }

    if (!message || typeof message !== "string") {
      console.warn("[Logger] Message is required and must be a string.");
      return;
    }

    // ---- Normalize ----
    const normalizedStack = stack.toLowerCase().trim();
    const normalizedLevel = level.toLowerCase().trim();
    const normalizedPkg = pkg.toLowerCase().trim();
    const timestamp = new Date().toISOString();

    // ---- Build payload ----
    const payload = {
      stack: normalizedStack,
      level: normalizedLevel,
      package: normalizedPkg,
      message: message.trim(),
    };

    // ---- Console output (always) ----
    consoleLog(normalizedLevel, normalizedPkg, message.trim(), timestamp);

    // ---- Remote dispatch (async, non-blocking) ----
    sendToApi(payload).catch(() => {
      // Swallow — logging must never crash the app
    });
  } catch (_err) {
    // Ultimate safety net — logging must NEVER throw
    console.error("[Logger] Unexpected internal error:", _err.message);
  }
}

module.exports = { Log, setToken };
