import { apiFetch, ApiError, isApiConfigured } from "./apiClient";
import * as localStore from "@/data/carsStore";
import { normalizeVehicleRecord } from "@/lib/vehicles";
import type { Vehicle, VehicleInput, VehicleUpdateInput } from "@/types/vehicle";

type ApiVehicle = Vehicle & { _id?: string };

export async function getVehicles(): Promise<Vehicle[]> {
  if (isApiConfigured) {
    try {
      const remote = await apiFetch<ApiVehicle[]>("/vehicles");
      if (Array.isArray(remote)) {
        const normalized = remote.map(normalizeVehicleRecord);
        localStore.replaceCars(normalized);
        return normalized;
      }
    } catch (err) {
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
      const remote = await apiFetch<ApiVehicle>(`/vehicles/${encodeURIComponent(id)}`);
      const normalized = normalizeVehicleRecord(remote);
      localStore.addCar(normalized);
      return normalized;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      if (import.meta.env.DEV) {
        console.warn("[vehicleService] API unreachable, using local data:", err);
      }
    }
  }

  return localStore.getCarById(id);
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const payload = normalizeVehicleRecord(input);

  if (isApiConfigured) {
    try {
      const created = await apiFetch<ApiVehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const normalized = normalizeVehicleRecord(created);
      localStore.addCar(normalized);
      return normalized;
    } catch (err) {
      if (import.meta.env.DEV) console.warn("[vehicleService] create fallback:", err);
    }
  }

  return localStore.addCar(payload);
}

export async function updateVehicle(
  id: string,
  patch: VehicleUpdateInput,
): Promise<Vehicle | undefined> {
  if (isApiConfigured) {
    try {
      const updated = await apiFetch<ApiVehicle>(`/vehicles/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      const normalized = normalizeVehicleRecord(updated);
      localStore.updateCar(id, normalized);
      return normalized;
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
