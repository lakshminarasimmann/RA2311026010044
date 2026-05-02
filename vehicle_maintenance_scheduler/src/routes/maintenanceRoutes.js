/**
 * @module maintenanceRoutes
 * @description Express router for Maintenance endpoints.
 */

"use strict";

const { Router } = require("express");
const { Log } = require("../../../logging_middleware");
const maintenanceController = require("../controllers/maintenanceController");

const router = Router();

// POST /maintenance — Schedule maintenance
router.post("/", (req, res, next) => {
  Log("backend", "info", "route", "POST /maintenance — Schedule maintenance API called");
  maintenanceController.scheduleMaintenance(req, res, next);
});

// GET /maintenance/upcoming — Get upcoming services
router.get("/upcoming", (req, res, next) => {
  Log("backend", "info", "route", "GET /maintenance/upcoming — Get upcoming services API called");
  maintenanceController.getUpcomingMaintenance(req, res, next);
});

// PUT /maintenance/:id/complete — Mark service completed
router.put("/:id/complete", (req, res, next) => {
  Log("backend", "info", "route", `PUT /maintenance/${req.params.id}/complete — Complete service API called`);
  maintenanceController.completeMaintenance(req, res, next);
});

module.exports = router;
