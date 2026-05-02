/**
 * @module vehicleRepository
 * @description Data access layer for Vehicle entities.
 *              Uses an in-memory Map for zero-dependency storage.
 */

"use strict";

const { Log } = require("../../../logging_middleware");

/** @type {Map<string, object>} */
const vehicles = new Map();

/**
 * Save a new vehicle record.
 * @param {object} vehicle - Vehicle object (must include `id`).
 * @returns {object} The saved vehicle.
 */
function create(vehicle) {
  vehicles.set(vehicle.id, vehicle);
  Log("backend", "info", "repository", `Vehicle created: ${vehicle.id}`);
  return vehicle;
}

/**
 * Retrieve all vehicles.
 * @returns {object[]} Array of vehicle objects.
 */
function findAll() {
  Log("backend", "debug", "repository", `Fetching all vehicles — count: ${vehicles.size}`);
  return Array.from(vehicles.values());
}

/**
 * Retrieve a single vehicle by ID.
 * @param {string} id - Vehicle ID.
 * @returns {object|null} The vehicle or null.
 */
function findById(id) {
  const vehicle = vehicles.get(id) || null;
  if (!vehicle) {
    Log("backend", "warn", "repository", `Vehicle not found: ${id}`);
  }
  return vehicle;
}

/**
 * Update a vehicle record.
 * @param {string} id      - Vehicle ID.
 * @param {object} updates - Fields to update.
 * @returns {object|null}  The updated vehicle or null.
 */
function update(id, updates) {
  const vehicle = vehicles.get(id);
  if (!vehicle) {
    Log("backend", "warn", "repository", `Cannot update — vehicle not found: ${id}`);
    return null;
  }
  const updated = { ...vehicle, ...updates };
  vehicles.set(id, updated);
  Log("backend", "info", "repository", `Vehicle updated: ${id}`);
  return updated;
}

/**
 * Delete a vehicle record.
 * @param {string} id - Vehicle ID.
 * @returns {boolean} True if deleted.
 */
function remove(id) {
  const deleted = vehicles.delete(id);
  Log("backend", "info", "repository", `Vehicle delete ${deleted ? "succeeded" : "failed — not found"}: ${id}`);
  return deleted;
}

module.exports = { create, findAll, findById, update, remove };
