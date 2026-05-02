/**
 * @module idGenerator
 * @description Generates unique IDs without external dependencies.
 *              Uses a combination of timestamp, random hex, and a counter
 *              to guarantee uniqueness within a single process.
 */

"use strict";

const crypto = require("crypto");

let _counter = 0;

/**
 * Generate a unique identifier string.
 * Format: `<timestamp_hex>-<random_hex>-<counter_hex>`
 * @returns {string} A unique ID
 */
function generateId() {
  _counter += 1;
  const timestamp = Date.now().toString(16);
  const random = crypto.randomBytes(4).toString("hex");
  const counter = _counter.toString(16).padStart(4, "0");
  return `${timestamp}-${random}-${counter}`;
}

module.exports = { generateId };
