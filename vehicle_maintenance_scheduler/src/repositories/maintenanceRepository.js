/**
 * @module maintenanceRepository
 * @description Data access layer for Maintenance entities.
 *              Uses an in-memory Map for zero-dependency storage.
 */

"use strict";

const { Log } = require("../../../logging_middleware");

/** @type {Map<string, object>} */
const records = new Map();

/**
 * Save a new maintenance record.
 * @param {object} record - Maintenance object (must include `id`).
 * @returns {object} The saved record.
 */
function create(record) {
  records.set(record.id, record);
  Log("backend", "info", "repository", `Maintenance record created: ${record.id} for vehicle ${record.vehicleId}`);
  return record;
}

/**
 * Retrieve all maintenance records.
 * @returns {object[]}
 */
function findAll() {
  Log("backend", "debug", "repository", `Fetching all maintenance records — count: ${records.size}`);
  return Array.from(records.values());
}

/**
 * Retrieve a single maintenance record by ID.
 * @param {string} id
 * @returns {object|null}
 */
function findById(id) {
  const record = records.get(id) || null;
  if (!record) {
    Log("backend", "warn", "repository", `Maintenance record not found: ${id}`);
  }
  return record;
}

/**
 * Retrieve upcoming (scheduled) maintenance records.
 * Returns records with status === "scheduled" and scheduledDate >= now.
 * @returns {object[]}
 */
function findUpcoming() {
  const now = new Date().toISOString();
  const upcoming = Array.from(records.values()).filter(
    (r) => r.status === "scheduled" && r.scheduledDate >= now
  );
  Log("backend", "debug", "repository", `Found ${upcoming.length} upcoming maintenance records`);
  return upcoming;
}

/**
 * Update a maintenance record.
 * @param {string} id      - Record ID.
 * @param {object} updates - Fields to merge.
 * @returns {object|null}
 */
function update(id, updates) {
  const record = records.get(id);
  if (!record) {
    Log("backend", "warn", "repository", `Cannot update — maintenance record not found: ${id}`);
    return null;
  }
  const updated = { ...record, ...updates };
  records.set(id, updated);
  Log("backend", "info", "repository", `Maintenance record updated: ${id}`);
  return updated;
}

/**
 * Delete a maintenance record.
 * @param {string} id
 * @returns {boolean}
 */
function remove(id) {
  const deleted = records.delete(id);
  Log("backend", "info", "repository", `Maintenance delete ${deleted ? "succeeded" : "failed — not found"}: ${id}`);
  return deleted;
}

module.exports = { create, findAll, findById, findUpcoming, update, remove };
