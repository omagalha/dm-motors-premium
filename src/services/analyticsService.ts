import { apiFetch, isApiConfigured } from "./apiClient";

export type VehicleTrackingSource = "home" | "listing" | "detail" | "featured";

export interface VehicleTrackingOptions {
  source?: VehicleTrackingSource | string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
}

export interface VehicleAnalyticsActivity {
  day: string;
  date: string;
  views: number;
  whatsappClicks: number;
}

export interface VehicleAnalyticsOverview {
  totals: {
    views: number;
    whatsappClicks: number;
    vehiclesWithEngagement: number;
  };
  activity: VehicleAnalyticsActivity[];
}

function buildTrackingPayload(options: VehicleTrackingOptions = {}) {
  const search =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : undefined;

  const campaign = options.campaign ?? search?.get("campaign") ?? search?.get("utm_campaign") ?? "";
  const utmSource = options.utmSource ?? search?.get("utm_source") ?? "";
  const utmMedium = options.utmMedium ?? search?.get("utm_medium") ?? "";

  return {
    ...(options.source ? { source: options.source } : {}),
    ...(campaign ? { campaign } : {}),
    ...(utmSource ? { utm_source: utmSource } : {}),
    ...(utmMedium ? { utm_medium: utmMedium } : {}),
  };
}

async function postTracking(path: string, options: VehicleTrackingOptions = {}) {
  if (!isApiConfigured) return;

  try {
    await apiFetch<void>(path, {
      method: "POST",
      skipAuth: true,
      keepalive: true,
      body: JSON.stringify(buildTrackingPayload(options)),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[analyticsService] Tracking request failed:", error);
    }
  }
}

export async function trackVehicleView(vehicleId: string, options: VehicleTrackingOptions = {}) {
  return postTracking(`/vehicles/${encodeURIComponent(vehicleId)}/view`, options);
}

export async function trackVehicleWhatsappClick(
  vehicleId: string,
  options: VehicleTrackingOptions = {},
) {
  return postTracking(`/vehicles/${encodeURIComponent(vehicleId)}/whatsapp-click`, options);
}

export async function getVehicleAnalyticsOverview(days = 7): Promise<VehicleAnalyticsOverview> {
  if (!isApiConfigured) {
    return {
      totals: {
        views: 0,
        whatsappClicks: 0,
        vehiclesWithEngagement: 0,
      },
      activity: [],
    };
  }

  return apiFetch<VehicleAnalyticsOverview>(
    `/vehicles/analytics/overview?days=${encodeURIComponent(String(days))}`,
  );
}
