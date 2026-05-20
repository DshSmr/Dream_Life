import type { LifeFlowDayPart } from "@/lib/timeline/types";

const PART_LABELS: Record<LifeFlowDayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night"
};

const PART_ORDER: LifeFlowDayPart[] = ["morning", "afternoon", "evening", "night"];

export function dayPartFromHour(hour: number): LifeFlowDayPart {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

export function dayPartFromMs(atMs: number): LifeFlowDayPart {
  const d = new Date(atMs);
  return dayPartFromHour(d.getHours());
}

export function dayPartLabel(part: LifeFlowDayPart): string {
  return PART_LABELS[part];
}

export function compareDayParts(a: LifeFlowDayPart, b: LifeFlowDayPart): number {
  return PART_ORDER.indexOf(a) - PART_ORDER.indexOf(b);
}
