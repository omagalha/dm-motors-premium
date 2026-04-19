// Mock insights data for the DM Motors management dashboard.
// In production, this would come from analytics/Lovable Cloud.

import { allCars } from "./cars";

export interface DailyActivity {
  day: string; // short label, e.g. "Seg"
  date: string; // ISO date
  whatsapp: number;
  views: number;
  leads: number;
}

export interface CarInsight {
  carId: string;
  views: number;
  whatsappClicks: number;
}

// Deterministic pseudo-random so numbers stay stable between renders.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getLast7DaysActivity(): DailyActivity[] {
  const rand = seeded(42);
  const today = new Date();
  const out: DailyActivity[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const base = 80 + Math.floor(rand() * 120);
    out.push({
      day: dayLabels[d.getDay()],
      date: d.toISOString().slice(0, 10),
      views: base + Math.floor(rand() * 80),
      whatsapp: 18 + Math.floor(rand() * 45),
      leads: 4 + Math.floor(rand() * 14),
    });
  }
  return out;
}

export function getCarInsights(): Record<string, CarInsight> {
  const rand = seeded(7);
  const map: Record<string, CarInsight> = {};
  for (const c of allCars) {
    map[c.id] = {
      carId: c.id,
      views: 120 + Math.floor(rand() * 880),
      whatsappClicks: 8 + Math.floor(rand() * 90),
    };
  }
  return map;
}

export function getTotals() {
  const days = getLast7DaysActivity();
  return days.reduce(
    (acc, d) => ({
      whatsapp: acc.whatsapp + d.whatsapp,
      views: acc.views + d.views,
      leads: acc.leads + d.leads,
    }),
    { whatsapp: 0, views: 0, leads: 0 },
  );
}
