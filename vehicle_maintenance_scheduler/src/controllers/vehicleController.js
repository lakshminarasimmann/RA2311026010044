/**
 * @module vehicleController
 * @description Request handler layer for Vehicle endpoints.
 *              Validates input, delegates to service, formats response.
 */

"use strict";

const { Log } = require("../../../logging_middleware");
const vehicleService = require("../services/vehicleService");

/**
 * POST /vehicles — Create a new vehicle.
 */
async function createVehicle(req, res, next) {
  try {
    Log("backend", "info", "handler", "Create vehicle handler invoked");

    const { name, model, lastServiceDate } = req.body;

    // Input validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      Log("backend", "error", "handler", "Validation failed — name is required");
      return res.status(400).json({
        success: false,
        error: "Vehicle name is required and must be a non-empty string",
      });
    }

    if (!model || typeof model !== "string" || model.trim().length === 0) {
      Log("backend", "error", "handler", "Validation failed — model is required");
      return res.status(400).json({
        success: false,
        error: "Vehicle model is required and must be a non-empty string",
      });
    }

    if (lastServiceDate && isNaN(Date.parse(lastServiceDate))) {
      Log("backend", "error", "handler", "Validation failed — invalid lastServiceDate format");
      return res.status(400).json({
        success: false,
        error: "lastServiceDate must be a valid ISO date string",
      });
    }

    const vehicle = vehicleService.createVehicle({
      name: name.trim(),
      model: model.trim(),
      lastServiceDate: lastServiceDate || null,
    });

    Log("backend", "info", "handler", `Vehicle created: ${vehicle.id}`);

    return res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    Log("backend", "error", "handler", `Create vehicle failed: ${error.message}`);
    next(error);
  }
}

/**
 * GET /vehicles — List all vehicles.
 */
async function getAllVehicles(req, res, next) {
  try {
    Log("backend", "info", "handler", "Get all vehicles handler invoked");

    const vehicles = vehicleService.getAllVehicles();

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    Log("backend", "error", "handler", `Get all vehicles failed: ${error.message}`);
    next(error);
  }
}

module.exports = { createVehicle, getAllVehicles };
