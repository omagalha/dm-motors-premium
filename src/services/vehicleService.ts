// Vehicle service — single source of truth for the UI.
//
// Strategy:
//   1. If VITE_API_URL is configured, prefer the remote API (Node.js + MongoDB).
//   2. If the API call fails or returns nothing, fall back to the local store
//      (localStorage overrides + the static seed in data/cars.ts).
//
// This keeps the frontend usable in development and in demo, while being
// 100% ready to plug into the real backend by setting one env variable.

import { apiFetch, ApiError, isApiConfigured } from "./apiClient";
import * as localStore from "@/data/carsStore";
import type { Vehicle, VehicleInput } from "@/types/vehicle";

// ────────────────────────────────────────────────────────────────────────────
// Read

export async function getVehicles(): Promise<Vehicle[]> {
  if (isApiConfigured) {
    try {
      const remote = await apiFetch<Vehicle[]>("/vehicles");
      if (Array.isArray(remote) && remote.length) return remote;
    } catch (err) {
      // Fall through to local data; surface the error in dev only.
      if (import.meta.env.DEV) {
        console.warn("[vehicleService] API unreachable, using local data:", err);
      }
    }
  }
  return localStore.getCars();
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  if (isApiConfigured) {
    try {
      return await apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(id)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      if (import.meta.env.DEV) {
        console.warn("[vehicleService] API unreachable, using local data:", err);
      }
    }
  }
  return localStore.getCarById(id);
}

// ────────────────────────────────────────────────────────────────────────────
// Write — admin operations
// Until the backend is live these write to the local store. When the API is
// configured, we POST/PUT/DELETE there and mirror the result locally so the
// UI stays reactive.

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  if (isApiConfigured) {
    try {
      const created = await apiFetch<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(input),
      });
      // Mirror in local store for offline reactivity
      localStore.addCar(created);
      return created;
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[vehicleService] create fallback:", err);
    }
  }
  return localStore.addCar(input);
}

export async function updateVehicle(
  id: string,
  patch: Partial<VehicleInput>,
): Promise<Vehicle | undefined> {
  if (isApiConfigured) {
    try {
      const updated = await apiFetch<Vehicle>(`/vehicles/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      localStore.updateCar(id, updated);
      return updated;
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[vehicleService] update fallback:", err);
    }
  }
  return localStore.updateCar(id, patch);
}

export async function deleteVehicle(id: string): Promise<void> {
  if (isApiConfigured) {
    try {
      await apiFetch<void>(`/vehicles/${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[vehicleService] delete fallback:", err);
    }
  }
  localStore.deleteCar(id);
}
