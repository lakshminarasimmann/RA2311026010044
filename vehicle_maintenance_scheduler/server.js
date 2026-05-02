/**
 * @module server
 * @description Entry point for the Vehicle Maintenance Scheduler service.
 *              Loads environment, initializes the logger token, and starts the HTTP server.
 */

"use strict";

// Load environment variables FIRST
require("dotenv").config();

const app = require("./app");
const config = require("./src/config");
const { Log, setToken } = require("../logging_middleware");

/* ------------------------------------------------------------------ */
/*  Initialize logger                                                 */
/* ------------------------------------------------------------------ */

if (config.accessToken) {
  setToken(config.accessToken);
  Log("backend", "info", "config", "Logger initialized with access token");
} else {
  console.warn("[Server] ACCESS_TOKEN not set — remote logging disabled. Logs will appear in console only.");
}

/* ------------------------------------------------------------------ */
/*  Start server                                                      */
/* ------------------------------------------------------------------ */

const server = app.listen(config.port, () => {
  Log("backend", "info", "config", `Vehicle Maintenance Scheduler running on port ${config.port}`);
  console.log(`\n  🚗  Vehicle Maintenance Scheduler`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Environment : ${config.env}`);
  console.log(`  Port        : ${config.port}`);
  console.log(`  Health      : http://localhost:${config.port}/health`);
  console.log(`  Vehicles    : http://localhost:${config.port}/vehicles`);
  console.log(`  Maintenance : http://localhost:${config.port}/maintenance`);
  console.log();
});

/* ------------------------------------------------------------------ */
/*  Graceful shutdown                                                 */
/* ------------------------------------------------------------------ */

function gracefulShutdown(signal) {
  Log("backend", "warn", "config", `${signal} received — shutting down gracefully`);
  console.log(`\n[Server] ${signal} received. Closing HTTP server...`);

  server.close(() => {
    Log("backend", "info", "config", "HTTP server closed");
    console.log("[Server] HTTP server closed.");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    Log("backend", "fatal", "config", "Forced shutdown — timed out waiting for connections to close");
    console.error("[Server] Forced shutdown.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  Log("backend", "fatal", "config", `Uncaught exception: ${err.message}`);
  console.error("[Server] Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  Log("backend", "fatal", "config", `Unhandled rejection: ${reason}`);
  console.error("[Server] Unhandled rejection:", reason);
  process.exit(1);
});
