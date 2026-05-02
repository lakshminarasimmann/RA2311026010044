/**
 * @module maintenanceController
 * @description Request handler layer for Maintenance endpoints.
 *              Validates input, delegates to service, formats response.
 */

"use strict";

const { Log } = require("../../../logging_middleware");
const maintenanceService = require("../services/maintenanceService");

/**
 * POST /maintenance — Schedule a new maintenance entry.
 */
async function scheduleMaintenance(req, res, next) {
  try {
    Log("backend", "info", "handler", "Schedule maintenance handler invoked");

    const { vehicleId, serviceType, scheduledDate } = req.body;

    // Input validation
    if (!vehicleId || typeof vehicleId !== "string") {
      Log("backend", "error", "handler", "Validation failed — vehicleId is required");
      return res.status(400).json({
        success: false,
        error: "vehicleId is required and must be a string",
      });
    }

    if (!serviceType || typeof serviceType !== "string" || serviceType.trim().length === 0) {
      Log("backend", "error", "handler", "Validation failed — serviceType is required");
      return res.status(400).json({
        success: false,
        error: "serviceType is required and must be a non-empty string",
      });
    }

    if (!scheduledDate || isNaN(Date.parse(scheduledDate))) {
      Log("backend", "error", "handler", "Validation failed — invalid scheduledDate");
      return res.status(400).json({
        success: false,
        error: "scheduledDate is required and must be a valid ISO date string",
      });
    }

    const result = maintenanceService.scheduleMaintenance({
      vehicleId: vehicleId.trim(),
      serviceType: serviceType.trim(),
      scheduledDate: new Date(scheduledDate).toISOString(),
    });

    if (!result.success) {
      Log("backend", "error", "handler", `Schedule maintenance failed: ${result.error}`);
      return res.status(404).json({
        success: false,
        error: result.error,
      });
    }

    Log("backend", "info", "handler", `Maintenance scheduled: ${result.data.id}`);

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    Log("backend", "error", "handler", `Schedule maintenance failed: ${error.message}`);
    next(error);
  }
}

/**
 * GET /maintenance/upcoming — Get upcoming maintenance records.
 */
async function getUpcomingMaintenance(req, res, next) {
  try {
    Log("backend", "info", "handler", "Get upcoming maintenance handler invoked");

    const records = maintenanceService.getUpcomingMaintenance();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    Log("backend", "error", "handler", `Get upcoming maintenance failed: ${error.message}`);
    next(error);
  }
}

/**
 * PUT /maintenance/:id/complete — Mark maintenance as completed.
 */
async function completeMaintenance(req, res, next) {
  try {
    const { id } = req.params;
    Log("backend", "info", "handler", `Complete maintenance handler invoked for ID: ${id}`);

    if (!id || typeof id !== "string") {
      Log("backend", "error", "handler", "Invalid maintenance ID provided");
      return res.status(400).json({
        success: false,
        error: "Maintenance ID is required",
      });
    }

    const result = maintenanceService.completeMaintenance(id);

    if (!result.success) {
      Log("backend", "error", "handler", `Complete maintenance failed: ${result.error}`);
      const status = result.error.includes("not found") ? 404 : 409;
      return res.status(status).json({
        success: false,
        error: result.error,
      });
    }

    Log("backend", "info", "handler", `Maintenance completed: ${id}`);

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    Log("backend", "error", "handler", `Complete maintenance failed: ${error.message}`);
    next(error);
  }
}

module.exports = { scheduleMaintenance, getUpcomingMaintenance, completeMaintenance };
