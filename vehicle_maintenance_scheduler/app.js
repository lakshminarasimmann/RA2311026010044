/**
 * @module app
 * @description Express application setup — mounts routes, middleware,
 *              and error handlers. Exported for testability.
 */

"use strict";

const express = require("express");
const { Log } = require("../logging_middleware");
const requestLogger = require("./src/middleware/requestLogger");
const errorHandler = require("./src/middleware/errorHandler");
const vehicleRoutes = require("./src/routes/vehicleRoutes");
const maintenanceRoutes = require("./src/routes/maintenanceRoutes");

const app = express();

/* ------------------------------------------------------------------ */
/*  Core middleware                                                    */
/* ------------------------------------------------------------------ */

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Log every incoming request
app.use(requestLogger);

/* ------------------------------------------------------------------ */
/*  Health check                                                      */
/* ------------------------------------------------------------------ */

app.get("/health", (req, res) => {
  Log("backend", "debug", "route", "Health check called");
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ------------------------------------------------------------------ */
/*  API routes                                                        */
/* ------------------------------------------------------------------ */

app.use("/vehicles", vehicleRoutes);
app.use("/maintenance", maintenanceRoutes);

/* ------------------------------------------------------------------ */
/*  404 handler                                                       */
/* ------------------------------------------------------------------ */

app.use((req, res) => {
  Log("backend", "warn", "middleware", `Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

/* ------------------------------------------------------------------ */
/*  Global error handler (must be last)                               */
/* ------------------------------------------------------------------ */

app.use(errorHandler);

module.exports = app;
