/**
 * @module vehicleRoutes
 * @description Express router for Vehicle endpoints.
 */

"use strict";

const { Router } = require("express");
const { Log } = require("../../../logging_middleware");
const vehicleController = require("../controllers/vehicleController");

const router = Router();

// POST /vehicles — Create a new vehicle
router.post("/", (req, res, next) => {
  Log("backend", "info", "route", "POST /vehicles — Create vehicle API called");
  vehicleController.createVehicle(req, res, next);
});

// GET /vehicles — List all vehicles
router.get("/", (req, res, next) => {
  Log("backend", "info", "route", "GET /vehicles — List vehicles API called");
  vehicleController.getAllVehicles(req, res, next);
});

module.exports = router;
