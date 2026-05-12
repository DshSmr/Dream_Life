/**
 * Async façade over pure functions in `fromEvents.ts`.
 *
 * Use this from hooks, scripts, or tests when you want one-call analytics with optional dependency injection
 * (`events` / `zones` preloaded). Otherwise each getter fetches normalized events (500 cap).
 */
import type { CleaningZone, EventItem } from "@/lib/api";
import { API_URL } from "@/lib/api";
import {
  computeDailyStats,
  computeEventCountsByType,
  computeMonthlyStats,
  computeProductivityScore,
  computeWeeklyStats
} from "@/lib/analytics/fromEvents";
import { fetchNormalizedEvents } from "@/lib/analytics/fetch";
import type { DailyStats, EventCountsByType, ProductivityScoreResult, WeeklyStats } from "@/lib/analytics/types";
import { getLocalMonthRangeIso, getLocalWeekRangeIso, localCalendarDayKeyFromDate } from "@/lib/datetime";

const DEFAULT_EVENT_LIMIT = 500;

export type GetDailyStatsOptions = {
  /** Defaults to today (local). */
  date?: Date;
  /** If set, skips network. */
  events?: EventItem[];
  apiBaseUrl?: string;
};

/** Fetches events unless `options.events` is provided; stats are for the local calendar day of `options.date`. */
export async function getDailyStats(options: GetDailyStatsOptions = {}): Promise<DailyStats> {
  const events =
    options.events ?? (await fetchNormalizedEvents(DEFAULT_EVENT_LIMIT, options.apiBaseUrl ?? API_URL));
  const ref = options.date ?? new Date();
  const dayKey = localCalendarDayKeyFromDate(ref);
  return computeDailyStats(events, dayKey);
}

export type GetWeeklyStatsOptions = {
  weekAnchor?: Date;
  events?: EventItem[];
  apiBaseUrl?: string;
};

/** Week = Monday 00:00 → next Monday 00:00 in local time (`getLocalWeekRangeIso`). */
export async function getWeeklyStats(options: GetWeeklyStatsOptions = {}): Promise<WeeklyStats> {
  const anchor = options.weekAnchor ?? new Date();
  const { from, to } = getLocalWeekRangeIso(anchor);
  const weekFromMs = new Date(from).getTime();
  const weekToMs = new Date(to).getTime();
  const events =
    options.events ?? (await fetchNormalizedEvents(DEFAULT_EVENT_LIMIT, options.apiBaseUrl ?? API_URL));
  return computeWeeklyStats(events, weekFromMs, weekToMs);
}

export type GetMonthlyStatsOptions = {
  monthAnchor?: Date;
  events?: EventItem[];
  apiBaseUrl?: string;
};

/** Calendar month in local time (`getLocalMonthRangeIso`). */
export async function getMonthlyStats(options: GetMonthlyStatsOptions = {}): Promise<WeeklyStats> {
  const anchor = options.monthAnchor ?? new Date();
  const { from, to } = getLocalMonthRangeIso(anchor);
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const events =
    options.events ?? (await fetchNormalizedEvents(DEFAULT_EVENT_LIMIT, options.apiBaseUrl ?? API_URL));
  return computeMonthlyStats(events, fromMs, toMs);
}

export type GetEventCountsByTypeOptions = {
  /** Half-open window; if either is omitted, counts over all provided events. */
  fromMs?: number;
  toMs?: number;
  events?: EventItem[];
  apiBaseUrl?: string;
};

/** Returns a sparse histogram; pass both `fromMs` and `toMs` to scope to a week or day. */
export async function getEventCountsByType(
  options: GetEventCountsByTypeOptions = {}
): Promise<EventCountsByType> {
  const events =
    options.events ?? (await fetchNormalizedEvents(DEFAULT_EVENT_LIMIT, options.apiBaseUrl ?? API_URL));
  return computeEventCountsByType(events, options.fromMs, options.toMs);
}

export type GetProductivityScoreOptions = {
  weekAnchor?: Date;
  events?: EventItem[];
  zones?: CleaningZone[];
  apiBaseUrl?: string;
};

async function fetchCleaningZones(baseUrl: string): Promise<CleaningZone[]> {
  const response = await fetch(`${baseUrl}/cleaning/zones`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to fetch cleaning zones");
  return response.json();
}

/** Needs cleaning zones for the overdue term; fetches `/cleaning/zones` when `options.zones` omitted. */
export async function getProductivityScore(
  options: GetProductivityScoreOptions = {}
): Promise<ProductivityScoreResult> {
  const base = options.apiBaseUrl ?? API_URL;
  const anchor = options.weekAnchor ?? new Date();
  const { from, to } = getLocalWeekRangeIso(anchor);
  const weekFromMs = new Date(from).getTime();
  const weekToMs = new Date(to).getTime();
  const events = options.events ?? (await fetchNormalizedEvents(DEFAULT_EVENT_LIMIT, base));
  const zones = options.zones ?? (await fetchCleaningZones(base));
  return computeProductivityScore(events, zones, weekFromMs, weekToMs);
}
