/**
 * @module constants
 * @description Whitelisted values for structured logging fields.
 *              Any value outside these sets will be rejected by the logger.
 */

"use strict";

const ALLOWED_STACKS = Object.freeze(["backend"]);

const ALLOWED_LEVELS = Object.freeze([
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

const ALLOWED_PACKAGES = Object.freeze([
  "handler",
  "repository",
  "route",
  "service",
  "auth",
  "config",
  "middleware",
  "utils",
]);

/**
 * Validates that a value is present in an allowed set.
 * @param {string} value    - The value to validate.
 * @param {string[]} allowed - The set of allowed values.
 * @param {string} fieldName - Human-readable field name for error messages.
 * @returns {{ valid: boolean, error?: string }}
 */
function validate(value, allowed, fieldName) {
  if (!value || typeof value !== "string") {
    return { valid: false, error: `${fieldName} is required and must be a string` };
  }
  const normalized = value.toLowerCase().trim();
  if (!allowed.includes(normalized)) {
    return {
      valid: false,
      error: `Invalid ${fieldName}: "${value}". Allowed: [${allowed.join(", ")}]`,
    };
  }
  return { valid: true };
}

module.exports = {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES,
  validate,
};
