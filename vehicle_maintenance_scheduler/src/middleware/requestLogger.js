/**
 * @module requestLogger
 * @description Express middleware that logs every incoming HTTP request.
 */

"use strict";

const { Log } = require("../../../logging_middleware");

/**
 * Logs method, URL, and response time for every request.
 */
function requestLogger(req, res, next) {
  const start = Date.now();

  // Capture the original end to compute response time
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} — ${res.statusCode} (${duration}ms)`;

    if (res.statusCode >= 500) {
      Log("backend", "error", "middleware", message);
    } else if (res.statusCode >= 400) {
      Log("backend", "warn", "middleware", message);
    } else {
      Log("backend", "info", "middleware", message);
    }

    originalEnd.apply(res, args);
  };

  next();
}

module.exports = requestLogger;
