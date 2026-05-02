/**
 * @module config
 * @description Centralised configuration loaded from environment variables.
 */

"use strict";

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  accessToken: process.env.ACCESS_TOKEN || "",
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
  env: process.env.NODE_ENV || "development",
};

module.exports = config;
