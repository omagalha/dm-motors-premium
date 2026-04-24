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
      } else {
        console.error("[vehicleService] API unreachable:", err);
        throw err;
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
      } else {
        console.error("[vehicleService] API unreachable:", err);
        throw err;
      }
    }
  }

  return localStore.getCarById(id);
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const payload = normalizeVehicleRecord(input);

  if (isApiConfigured) {
    const created = await apiFetch<ApiVehicle>("/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const normalized = normalizeVehicleRecord(created);
    localStore.addCar(normalized);
    return normalized;
  }

  return localStore.addCar(payload);
}

export async function updateVehicle(
  id: string,
  patch: VehicleUpdateInput,
): Promise<Vehicle | undefined> {
  if (isApiConfigured) {
    const updated = await apiFetch<ApiVehicle>(`/vehicles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    const normalized = normalizeVehicleRecord(updated);
    localStore.updateCar(id, normalized);
    return normalized;
  }

  return localStore.updateCar(id, patch);
}

export async function deleteVehicle(id: string): Promise<void> {
  if (isApiConfigured) {
    await apiFetch<void>(`/vehicles/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  localStore.deleteCar(id);
}
