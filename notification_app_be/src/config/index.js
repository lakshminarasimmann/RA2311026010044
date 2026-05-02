/**
 * @module config
 * @description Centralised configuration for notification_app_be.
 */

"use strict";

const config = {
  // Registration fields
  registration: {
    email: process.env.REG_EMAIL || "",
    name: process.env.REG_NAME || "",
    mobileNo: process.env.REG_MOBILE || "",
    githubUsername: process.env.REG_GITHUB || "",
    rollNo: process.env.REG_ROLL || "",
    accessCode: process.env.REG_ACCESS_CODE || "",
  },

  // Auth credentials (obtained after registration)
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",

  // Token (obtained after auth)
  accessToken: process.env.ACCESS_TOKEN || "",

  // API base
  apiHost: "20.207.122.201",
  apiBasePath: "/evaluation-service",
};

module.exports = config;
