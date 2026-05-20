import type { CleaningZone, EventItem, EventType, FinanceTransaction, FocusSession, PomodoroSession, TaskItem } from "@/lib/api";
import { activeLocalDaysForEventTypes, computeDayStreak } from "@/lib/consistency/streaks";
import {
  getLocalDayRangeIso,
  getLocalLastNDaysRangeIso,
  getLocalWeekRangeIso,
  localCalendarDayKeyFromDate,
  localDateKeyFromIso
} from "@/lib/datetime";

const FOCUS_EVENT_TYPES = new Set([
  "focus_started",
  "focus_ended",
  "focus_session_completed",
  "pomodoro_completed"
] as const);
const CLEANING_EVENT_TYPES = new Set(["cleaning_done"] as const);
const TASK_EVENT_TYPES = new Set(["task_completed"] as const);

export type DaySeries = { dayKey: string; label: string; value: number }[];

export function lastNDayKeys(n: number, ref: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - i);
    keys.push(localCalendarDayKeyFromDate(d));
  }
  return keys;
}

function shortDayLabel(dayKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return dayKey;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2);
}

export function buildDaySeries(keys: string[], valuesByDay: Map<string, number>): DaySeries {
  return keys.map((dayKey) => ({
    dayKey,
    label: shortDayLabel(dayKey),
    value: valuesByDay.get(dayKey) ?? 0
  }));
}

function isInHalfOpenRange(iso: string, from: string, to: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(from).getTime() && t < new Date(to).getTime();
}

export function focusMinutesToday(sessions: FocusSession[], now: Date = new Date()): number {
  const { from, to } = getLocalDayRangeIso(now);
  let total = 0;
  for (const s of sessions) {
    if (!isInHalfOpenRange(s.started_at, from, to) && !(s.ended_at && isInHalfOpenRange(s.ended_at, from, to))) {
      if (!s.ended_at) {
        const started = new Date(s.started_at).getTime();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        if (started >= dayStart && started < dayEnd) {
          total += Math.max(0, Math.floor((now.getTime() - started) / 1000));
        }
      }
      continue;
    }
    if (s.duration_seconds != null) total += s.duration_seconds;
    else if (!s.ended_at) {
      total += Math.max(0, Math.floor((now.getTime() - new Date(s.started_at).getTime()) / 1000));
    }
  }
  return Math.round(total / 60);
}

export function focusMinutesByDay(sessions: FocusSession[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const s of sessions) {
    const key = localDateKeyFromIso(s.ended_at ?? s.started_at);
    if (!key || !map.has(key)) continue;
    const sec = s.duration_seconds ?? 0;
    if (sec > 0) map.set(key, (map.get(key) ?? 0) + Math.round(sec / 60));
  }
  return map;
}

export function pomodoroStats(sessions: PomodoroSession[], now: Date = new Date()) {
  const { from: todayFrom, to: todayTo } = getLocalDayRangeIso(now);
  const { from: weekFrom, to: weekTo } = getLocalWeekRangeIso(now);
  const completed = sessions.filter((s) => s.status === "completed" || s.ended_at);
  const todayDone = completed.filter((s) => isInHalfOpenRange(s.ended_at ?? s.started_at, todayFrom, todayTo)).length;
  const weekDone = completed.filter((s) => isInHalfOpenRange(s.ended_at ?? s.started_at, weekFrom, weekTo)).length;
  const running = sessions.find((s) => s.status === "running") ?? null;
  return { todayDone, weekDone, running };
}

export function pomodoroCountByDay(sessions: PomodoroSession[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const s of sessions) {
    if (s.status !== "completed" && !s.ended_at) continue;
    const key = localDateKeyFromIso(s.ended_at ?? s.started_at);
    if (!key || !map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function cleaningZoneCounts(zones: CleaningZone[]) {
  return {
    overdue: zones.filter((z) => z.status === "overdue").length,
    soon: zones.filter((z) => z.status === "soon").length,
    ok: zones.filter((z) => z.status === "ok").length,
    total: zones.length
  };
}

export function cleaningDoneThisWeek(events: EventItem[], now: Date = new Date()): number {
  const { from, to } = getLocalWeekRangeIso(now);
  return events.filter((e) => e.type === "cleaning_done" && isInHalfOpenRange(e.created_at, from, to)).length;
}

export function cleaningCountByDay(events: EventItem[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const e of events) {
    if (e.type !== "cleaning_done") continue;
    const key = localDateKeyFromIso(e.created_at);
    if (!key || !map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function financeTodaySpend(transactions: FinanceTransaction[], now: Date = new Date()): number {
  const { from, to } = getLocalDayRangeIso(now);
  return transactions
    .filter((t) => t.kind === "expense" && isInHalfOpenRange(t.created_at, from, to))
    .reduce((sum, t) => sum + t.amount, 0);
}

export function financeExpenseByDay(transactions: FinanceTransaction[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const key = localDateKeyFromIso(t.created_at);
    if (!key || !map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return map;
}

export function topCategoriesLast7Days(transactions: FinanceTransaction[], now: Date = new Date(), limit = 3) {
  const { from, to } = getLocalLastNDaysRangeIso(7, now);
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense" || !isInHalfOpenRange(t.created_at, from, to)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, total]) => ({ category, total }));
}

export function largestExpenseToday(transactions: FinanceTransaction[], now: Date = new Date()) {
  const { from, to } = getLocalDayRangeIso(now);
  const today = transactions.filter((t) => t.kind === "expense" && isInHalfOpenRange(t.created_at, from, to));
  if (!today.length) return null;
  return today.reduce((a, b) => (b.amount > a.amount ? b : a));
}

export function taskOperationalStats(tasks: TaskItem[], events: EventItem[], now: Date = new Date()) {
  const { from: todayFrom, to: todayTo } = getLocalDayRangeIso(now);
  const { from: weekFrom, to: weekTo } = getLocalWeekRangeIso(now);
  const active = tasks.filter((t) => t.status !== "done");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const doneToday = events.filter((e) => e.type === "task_completed" && isInHalfOpenRange(e.created_at, todayFrom, todayTo)).length;
  const doneWeek = events.filter((e) => e.type === "task_completed" && isInHalfOpenRange(e.created_at, weekFrom, weekTo)).length;
  const taskStreak = computeDayStreak(activeLocalDaysForEventTypes(events, TASK_EVENT_TYPES), now);
  return { active: active.length, inProgress: inProgress.length, doneToday, doneWeek, taskStreak };
}

export function taskCompletedByDay(events: EventItem[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const e of events) {
    if (e.type !== "task_completed") continue;
    const key = localDateKeyFromIso(e.created_at);
    if (!key || !map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function focusStreakFromEvents(events: EventItem[], now: Date = new Date()): number {
  return computeDayStreak(activeLocalDaysForEventTypes(events, FOCUS_EVENT_TYPES), now);
}

export function eventCountByDay(
  events: EventItem[],
  types: ReadonlySet<EventType>,
  dayKeys: string[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const e of events) {
    if (!types.has(e.type)) continue;
    const key = localDateKeyFromIso(e.created_at);
    if (!key || !map.has(key)) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function cleaningStreakFromEvents(events: EventItem[], now: Date = new Date()): number {
  return computeDayStreak(activeLocalDaysForEventTypes(events, CLEANING_EVENT_TYPES), now);
}
