import type { EventItem } from "@/lib/api";
import { API_URL } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";

/**
 * Loads a capped slice of the event log for client-side aggregation.
 *
 * Important: analytics that scan this list cannot see events older than the newest `limit` rows.
 * If we need full history, add server-side rollups or paginate here.
 */
export async function fetchNormalizedEvents(
  limit = 500,
  baseUrl: string = API_URL
): Promise<EventItem[]> {
  const response = await fetch(`${baseUrl}/events?limit=${limit}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch events");
  const rawItems = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
  return normalizeAnalyticsEvents(rawItems);
}
