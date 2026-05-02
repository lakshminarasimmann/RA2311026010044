/**
 * @module testLogger
 * @description Minimal test script to validate the logging middleware
 *              against the external evaluation API.
 *
 * Usage:
 *   npm install axios   (if not already installed)
 *   node testLogger.js
 */

"use strict";

const axios = require("axios");

// ─── Configuration ───────────────────────────────────────────────
const API_URL = "http://20.207.122.201/evaluation-service/logs";
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsczY3MjZAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwMDI3MSwiaWF0IjoxNzc3Njk5MzcxLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiOGM3ZWZjM2YtOWIxNC00YzViLThhZWYtYjAxODY0MDg3NjNmIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibGFrc2htaSBuYXJhc2ltbWFuIiwic3ViIjoiYjFjY2EwZGEtZjkwMy00MDczLTg4ODgtYjU3MDRmMWE5OTg5In0sImVtYWlsIjoibHM2NzI2QHNybWlzdC5lZHUuaW4iLCJuYW1lIjoibGFrc2htaSBuYXJhc2ltbWFuIiwicm9sbE5vIjoicmEyMzExMDI2MDEwMDQ0IiwiYWNjZXNzQ29kZSI6IlFrYnB4SCIsImNsaWVudElEIjoiYjFjY2EwZGEtZjkwMy00MDczLTg4ODgtYjU3MDRmMWE5OTg5IiwiY2xpZW50U2VjcmV0IjoiYm1jRktyblJyTk5IakhLSCJ9.YMCxuRDrSUoqvImTwhpNGukX24QxOVZwzkz_vloqQ2I";

// ─── Test Cases ──────────────────────────────────────────────────
const testCases = [
  {
    name: "INFO log — route",
    payload: {
      stack: "backend",
      level: "info",
      package: "route",
      message: "Health check endpoint triggered",
    },
  },
  {
    name: "ERROR log — handler",
    payload: {
      stack: "backend",
      level: "error",
      package: "handler",
      message: "Invalid input: expected number, received string",
    },
  },
  {
    name: "FATAL log — repository",
    payload: {
      stack: "backend",
      level: "fatal",
      package: "repository",
      message: "Database connection timeout after 5 seconds",
    },
  },
];

// ─── Send a single log request ──────────────────────────────────
async function sendLog(testCase) {
  const separator = "─".repeat(50);
  console.log(`\n${separator}`);
  console.log(`📤  Test: ${testCase.name}`);
  console.log(`    Payload: ${JSON.stringify(testCase.payload)}`);

  try {
    const response = await axios.post(API_URL, testCase.payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      timeout: 10000,
    });

    console.log(`✅  Status : ${response.status}`);
    console.log(`    Response: ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (error.response) {
      // Server responded with a non-2xx status
      console.log(`❌  Status : ${error.response.status}`);
      console.log(`    Error  : ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // No response received
      console.log(`❌  No response received`);
      console.log(`    Error  : ${error.message}`);
    } else {
      // Request setup error
      console.log(`❌  Request failed`);
      console.log(`    Error  : ${error.message}`);
    }
  }
}

// ─── Run all tests sequentially ─────────────────────────────────
async function runTests() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║   Logging API Validation — Test Suite            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nAPI URL : ${API_URL}`);
  console.log(`Token   : ${ACCESS_TOKEN.substring(0, 20)}...`);
  console.log(`Tests   : ${testCases.length}`);

  for (const tc of testCases) {
    await sendLog(tc);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log("✔  All test cases executed.\n");
}

runTests();
