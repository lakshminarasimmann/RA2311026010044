/**
 * @module maintenanceService
 * @description Business logic layer for Maintenance operations.
 */

"use strict";

const { Log } = require("../../../logging_middleware");
const maintenanceRepo = require("../repositories/maintenanceRepository");
const vehicleRepo = require("../repositories/vehicleRepository");
const { generateId } = require("../utils/idGenerator");

/**
 * Schedule a new maintenance entry.
 * @param {{ vehicleId: string, serviceType: string, scheduledDate: string }} data
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function scheduleMaintenance(data) {
  Log("backend", "info", "service", `Scheduling maintenance for vehicle: ${data.vehicleId}`);

  // Verify vehicle exists
  const vehicle = vehicleRepo.findById(data.vehicleId);
  if (!vehicle) {
    Log("backend", "error", "service", `Cannot schedule maintenance — vehicle not found: ${data.vehicleId}`);
    return { success: false, error: "Vehicle not found" };
  }

  const record = {
    id: generateId(),
    vehicleId: data.vehicleId,
    serviceType: data.serviceType,
    scheduledDate: data.scheduledDate,
    status: "scheduled",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  const saved = maintenanceRepo.create(record);
  Log("backend", "info", "service", `Maintenance scheduled successfully: ${saved.id}`);
  return { success: true, data: saved };
}

/**
 * Retrieve upcoming (scheduled) maintenance records.
 * @returns {object[]}
 */
function getUpcomingMaintenance() {
  Log("backend", "info", "service", "Fetching upcoming maintenance records");
  return maintenanceRepo.findUpcoming();
}

/**
 * Mark a maintenance record as completed.
 * Also updates the vehicle's lastServiceDate.
 * @param {string} id - Maintenance record ID.
 * @returns {{ success: boolean, data?: object, error?: string }}
 */
function completeMaintenance(id) {
  Log("backend", "info", "service", `Completing maintenance: ${id}`);

  const record = maintenanceRepo.findById(id);
  if (!record) {
    Log("backend", "error", "service", `Cannot complete — maintenance record not found: ${id}`);
    return { success: false, error: "Maintenance record not found" };
  }

  if (record.status === "completed") {
    Log("backend", "warn", "service", `Maintenance already completed: ${id}`);
    return { success: false, error: "Maintenance is already marked as completed" };
  }

  const now = new Date().toISOString();

  // Update maintenance record
  const updated = maintenanceRepo.update(id, {
    status: "completed",
    completedAt: now,
  });

  // Update vehicle's last service date
  vehicleRepo.update(record.vehicleId, { lastServiceDate: now });
  Log("backend", "info", "service", `Maintenance completed and vehicle ${record.vehicleId} lastServiceDate updated`);

  return { success: true, data: updated };
}

module.exports = { scheduleMaintenance, getUpcomingMaintenance, completeMaintenance };
