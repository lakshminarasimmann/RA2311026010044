/**
 * @module logging-middleware
 * @description Public entry point for the reusable logging middleware package.
 *
 * Usage:
 *   const { Log, setToken } = require("../logging_middleware");
 *   setToken(process.env.ACCESS_TOKEN);
 *   await Log("backend", "info", "route", "Server started");
 */

"use strict";

const { Log, setToken } = require("./logger");
const {
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES,
} = require("./constants");

module.exports = {
  Log,
  setToken,
  ALLOWED_STACKS,
  ALLOWED_LEVELS,
  ALLOWED_PACKAGES,
};
