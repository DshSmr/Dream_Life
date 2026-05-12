import type { EventItem } from "@/lib/api";

/**
 * Single entry point for "events we show in analytics and activity views".
 * Filters out ephemeral types that would skew counts or clutter timelines.
 *
 * Keep this list in sync with product decisions (if backend adds more noise types, drop them here too).
 */
export function normalizeAnalyticsEvents(
  rawItems: Array<Omit<EventItem, "type"> & { type: string }>
): EventItem[] {
  return rawItems.filter((item) => item.type !== "task_in_progress") as EventItem[];
}
