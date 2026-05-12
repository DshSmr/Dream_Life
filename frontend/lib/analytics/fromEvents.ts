/**
 * Pure analytics over `EventItem[]` — no I/O, no React.
 *
 * Time windows are half-open in UTC milliseconds: [fromMs, toMs), consistent with backend finance ranges.
 * "Local day" grouping uses `localDateKeyFromIso` (browser local wall clock).
 */
import type { CleaningZone, EventItem } from "@/lib/api";
import { localDateKeyFromIso } from "@/lib/datetime";
import type { DailyStats, EventCountsByType, ProductivityScoreResult, WeeklyStats } from "@/lib/analytics/types";

export function eventTimestampMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/** Events whose `created_at` falls in [fromMs, toMs). Invalid timestamps are excluded. */
export function filterEventsInRange(events: EventItem[], fromMs: number, toMs: number): EventItem[] {
  return events.filter((e) => {
    const t = eventTimestampMs(e.created_at);
    return !Number.isNaN(t) && t >= fromMs && t < toMs;
  });
}

/** `dayKey` format: YYYY-MM-DD in local time (see `localCalendarDayKeyFromDate`). */
export function filterEventsOnLocalDay(events: EventItem[], dayKey: string): EventItem[] {
  return events.filter((e) => localDateKeyFromIso(e.created_at) === dayKey);
}

export function countEventsOnLocalDay(events: EventItem[], dayKey: string): number {
  return filterEventsOnLocalDay(events, dayKey).length;
}

/**
 * Backend emits slightly different payload shapes for completed sessions vs legacy `focus_ended`.
 * Prefer `duration_seconds`; fall back to `duration_minutes` only on `focus_session_completed`.
 */
function focusSecondsFromPayload(item: EventItem): number {
  const p = item.payload as Record<string, unknown>;
  if (item.type === "focus_session_completed") {
    const sec = Number(p.duration_seconds ?? 0);
    if (Number.isFinite(sec) && sec > 0) return sec;
    return Number(p.duration_minutes ?? 0) * 60;
  }
  if (item.type === "focus_ended") {
    return Number(p.duration_seconds ?? 0);
  }
  return 0;
}

/** Sum focus duration in whole minutes for already-filtered events. */
export function sumFocusMinutes(events: EventItem[]): number {
  let seconds = 0;
  for (const e of events) {
    if (e.type !== "focus_ended" && e.type !== "focus_session_completed") continue;
    const sec = focusSecondsFromPayload(e);
    if (Number.isFinite(sec) && sec > 0) seconds += sec;
  }
  return Math.max(0, Math.round(seconds / 60));
}

export function sumFocusMinutesInRange(events: EventItem[], fromMs: number, toMs: number): number {
  return sumFocusMinutes(filterEventsInRange(events, fromMs, toMs));
}

/** Convenience for weekly review and streak-style filters over multiple event types. */
export function countEventsByTypesInRange(
  events: EventItem[],
  types: readonly string[],
  fromMs: number,
  toMs: number
): number {
  const set = new Set(types);
  return filterEventsInRange(events, fromMs, toMs).filter((e) => set.has(e.type)).length;
}

/**
 * Rolls up a single local calendar day. O(n) over `events`; callers should pass a bounded list
 * (e.g. last 500 from API) — older history outside that window is invisible.
 */
export function computeDailyStats(events: EventItem[], dayKey: string): DailyStats {
  const dayEvents = filterEventsOnLocalDay(events, dayKey);
  let tasksCompleted = 0;
  let cleaningActions = 0;
  let expensesTotal = 0;
  for (const e of dayEvents) {
    if (e.type === "task_completed") tasksCompleted += 1;
    if (e.type === "cleaning_done") cleaningActions += 1;
    if (e.type === "expense_added") {
      const p = e.payload as Record<string, unknown>;
      const amt = Number(p.amount ?? 0);
      if (Number.isFinite(amt) && amt > 0) expensesTotal += amt;
    }
  }
  const focusMinutes = sumFocusMinutes(dayEvents);
  return { tasksCompleted, focusMinutes, cleaningActions, expensesTotal };
}

/** Same metrics as `computeDailyStats`, but for an arbitrary UTC-ms week window (typically from `getLocalWeekRangeIso`). */
export function computeWeeklyStats(events: EventItem[], weekFromMs: number, weekToMs: number): WeeklyStats {
  const slice = filterEventsInRange(events, weekFromMs, weekToMs);
  let tasksCompleted = 0;
  let cleaningActions = 0;
  let expensesTotal = 0;
  for (const e of slice) {
    if (e.type === "task_completed") tasksCompleted += 1;
    if (e.type === "cleaning_done") cleaningActions += 1;
    if (e.type === "expense_added") {
      const p = e.payload as Record<string, unknown>;
      const amt = Number(p.amount ?? 0);
      if (Number.isFinite(amt) && amt > 0) expensesTotal += amt;
    }
  }
  const focusMinutes = sumFocusMinutes(slice);
  return { tasksCompleted, focusMinutes, cleaningActions, expensesTotal };
}

/** Same rollup as the week helper; pass bounds from `getLocalMonthRangeIso`. */
export function computeMonthlyStats(events: EventItem[], monthFromMs: number, monthToMs: number): WeeklyStats {
  return computeWeeklyStats(events, monthFromMs, monthToMs);
}

export type MostProductiveLocalDay = {
  dayKey: string;
  tasksCompleted: number;
  focusMinutes: number;
};

/**
 * Local calendar day in [fromMs, toMs) with the highest combined tasks + focus minutes.
 * Returns null when there is no task or focus signal in range.
 */
export function mostProductiveLocalDay(
  events: EventItem[],
  fromMs: number,
  toMs: number
): MostProductiveLocalDay | null {
  const slice = filterEventsInRange(events, fromMs, toMs);
  const byDay = new Map<string, { tasksCompleted: number; focusSeconds: number }>();
  for (const e of slice) {
    const key = localDateKeyFromIso(e.created_at);
    if (!key) continue;
    let cell = byDay.get(key);
    if (!cell) {
      cell = { tasksCompleted: 0, focusSeconds: 0 };
      byDay.set(key, cell);
    }
    if (e.type === "task_completed") cell.tasksCompleted += 1;
    if (e.type === "focus_ended" || e.type === "focus_session_completed") {
      const sec = focusSecondsFromPayload(e);
      if (Number.isFinite(sec) && sec > 0) cell.focusSeconds += sec;
    }
  }
  let best: MostProductiveLocalDay | null = null;
  let bestScore = -1;
  for (const [dayKey, v] of byDay) {
    const focusMinutes = Math.max(0, Math.round(v.focusSeconds / 60));
    const score = v.tasksCompleted + focusMinutes;
    if (score > bestScore) {
      bestScore = score;
      best = { dayKey, tasksCompleted: v.tasksCompleted, focusMinutes };
    }
  }
  return bestScore > 0 ? best : null;
}

/**
 * Counts every event type in the optional half-open window [fromMs, toMs).
 * When bounds are omitted, uses the full `events` array.
 */
export function computeEventCountsByType(
  events: EventItem[],
  fromMs?: number,
  toMs?: number
): EventCountsByType {
  const slice =
    fromMs !== undefined && toMs !== undefined
      ? filterEventsInRange(events, fromMs, toMs)
      : events;
  const out: EventCountsByType = {};
  for (const e of slice) {
    out[e.type] = (out[e.type] ?? 0) + 1;
  }
  return out;
}

/**
 * Lightweight health signal for weekly review — not normalized to 0–100.
 *
 * Overdue count is a snapshot of `CleaningZone.status` at call time, not derived from events,
 * so fixing zones in the UI immediately affects the score even if `events` is stale.
 */
export function computeProductivityScore(
  events: EventItem[],
  zones: CleaningZone[],
  weekFromMs: number,
  weekToMs: number
): ProductivityScoreResult {
  const slice = filterEventsInRange(events, weekFromMs, weekToMs);
  const completedTasks = slice.filter((e) => e.type === "task_completed").length;
  const focusMinutes = sumFocusMinutes(slice);
  const overdueCleaningZones = zones.filter((z) => z.status === "overdue").length;
  const score = completedTasks + focusMinutes - overdueCleaningZones;
  return { score, completedTasks, focusMinutes, overdueCleaningZones };
}
