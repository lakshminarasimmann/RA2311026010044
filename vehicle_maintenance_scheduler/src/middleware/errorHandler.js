/**
 * @module errorHandler
 * @description Global Express error handling middleware.
 *              Catches unhandled errors, logs them, and returns a
 *              consistent JSON error response.
 */

"use strict";

const { Log } = require("../../../logging_middleware");

/**
 * Global error handler — must have 4 parameters for Express to recognise it.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  Log(
    "backend",
    statusCode >= 500 ? "fatal" : "error",
    "middleware",
    `Unhandled error on ${req.method} ${req.originalUrl}: ${message}`
  );

  // Don't leak stack traces in production
  const response = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
