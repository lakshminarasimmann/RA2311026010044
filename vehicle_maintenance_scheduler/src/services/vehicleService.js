/**
 * @module vehicleService
 * @description Business logic layer for Vehicle operations.
 */

"use strict";

const { Log } = require("../../../logging_middleware");
const vehicleRepo = require("../repositories/vehicleRepository");
const { generateId } = require("../utils/idGenerator");

/**
 * Create a new vehicle.
 * @param {{ name: string, model: string, lastServiceDate?: string }} data
 * @returns {object} The created vehicle.
 */
function createVehicle(data) {
  Log("backend", "info", "service", `Creating vehicle: ${data.name} (${data.model})`);

  const vehicle = {
    id: generateId(),
    name: data.name,
    model: data.model,
    lastServiceDate: data.lastServiceDate || null,
    createdAt: new Date().toISOString(),
  };

  const saved = vehicleRepo.create(vehicle);
  Log("backend", "info", "service", `Vehicle created successfully: ${saved.id}`);
  return saved;
}

/**
 * List all vehicles.
 * @returns {object[]}
 */
function getAllVehicles() {
  Log("backend", "info", "service", "Fetching all vehicles");
  return vehicleRepo.findAll();
}

/**
 * Get a vehicle by ID.
 * @param {string} id
 * @returns {object|null}
 */
function getVehicleById(id) {
  Log("backend", "info", "service", `Fetching vehicle by ID: ${id}`);
  return vehicleRepo.findById(id);
}

module.exports = { createVehicle, getAllVehicles, getVehicleById };
