import type { EventItem, EventType } from "@/lib/api";
import { computeDailyStats } from "@/lib/analytics/fromEvents";
import {
  activeLocalDaysForEventTypes,
  computeConsistencyStreaks
} from "@/lib/consistency/streaks";
import { localDateKeyFromIso } from "@/lib/datetime";
import type {
  DayLoadCell,
  DayLoadKind,
  PatternAnalytics,
  PatternSpan,
  HeatmapCell,
  HeatmapWeek
} from "@/lib/analytics/visual/types";
import {
  buildDaySeries,
  cleaningCountByDay,
  lastNDayKeys,
  taskCompletedByDay,
  type DaySeries
} from "@/lib/operational/metrics";
import { sumFocusMinutes, filterEventsOnLocalDay } from "@/lib/analytics/fromEvents";
import { dayPartFromMs } from "@/lib/timeline/dayParts";
import type { LifeFlowDayPart } from "@/lib/timeline/types";

const FOCUS_TYPES: ReadonlySet<EventType> = new Set([
  "focus_started",
  "focus_ended",
  "focus_session_completed",
  "pomodoro_completed"
]);
const CLEANING_TYPES: ReadonlySet<EventType> = new Set(["cleaning_done"]);
const TASK_TYPES: ReadonlySet<EventType> = new Set(["task_completed"]);

function shortDayLabel(dayKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return dayKey;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function dayLoadKind(level: 0 | 1 | 2 | 3 | 4): DayLoadKind {
  if (level === 0) return "quiet";
  if (level >= 3) return "full";
  return "balanced";
}

function activityLevel(events: EventItem[], dayKey: string): 0 | 1 | 2 | 3 | 4 {
  const stats = computeDailyStats(events, dayKey);
  const score =
    stats.tasksCompleted * 2 +
    stats.focusMinutes / 8 +
    stats.cleaningActions * 3 +
    (stats.expensesTotal > 0 ? 1.5 : 0);
  if (score <= 0) return 0;
  if (score < 2) return 1;
  if (score < 5) return 2;
  if (score < 10) return 3;
  return 4;
}

function focusMinutesByDay(events: EventItem[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) {
    map.set(key, sumFocusMinutes(filterEventsOnLocalDay(events, key)));
  }
  return map;
}

function expenseByDay(events: EventItem[], dayKeys: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const key of dayKeys) map.set(key, 0);
  for (const e of events) {
    if (e.type !== "expense_added") continue;
    const key = localDateKeyFromIso(e.created_at);
    if (!key || !map.has(key)) continue;
    const amt = Number((e.payload as Record<string, unknown>).amount ?? 0);
    if (Number.isFinite(amt) && amt > 0) map.set(key, (map.get(key) ?? 0) + amt);
  }
  return map;
}

function buildHeatmap(events: EventItem[], dayKeys: string[]): HeatmapWeek[] {
  const weeks: HeatmapWeek[] = [];
  for (let i = 0; i < dayKeys.length; i += 7) {
    const chunk = dayKeys.slice(i, i + 7);
    weeks.push({
      weekIndex: Math.floor(i / 7),
      cells: chunk.map((dayKey) => {
        const level = activityLevel(events, dayKey);
        const stats = computeDailyStats(events, dayKey);
        const title =
          level === 0
            ? `${shortDayLabel(dayKey)}, quiet`
            : `${shortDayLabel(dayKey)}, ${stats.tasksCompleted} tasks, ${stats.focusMinutes} min focus`;
        return { dayKey, level, title };
      })
    });
  }
  return weeks;
}

function weeklyActivityBalance(events: EventItem[], dayKeys: string[]): {
  work: number;
  home: number;
  finance: number;
} {
  let work = 0;
  let home = 0;
  let finance = 0;
  for (const key of dayKeys) {
    const day = filterEventsOnLocalDay(events, key);
    for (const e of day) {
      if (TASK_TYPES.has(e.type) || FOCUS_TYPES.has(e.type)) work += 1;
      if (CLEANING_TYPES.has(e.type)) home += 1;
      if (e.type === "expense_added" || e.type === "income_added") finance += 1;
    }
  }
  const total = work + home + finance || 1;
  return {
    work: Math.round((work / total) * 100),
    home: Math.round((home / total) * 100),
    finance: Math.round((finance / total) * 100)
  };
}

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

function weekdayIndex(dayKey: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return 0;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (d.getDay() + 6) % 7;
}

function buildWeeklyFocusRhythm(events: EventItem[], dayKeys: string[]): DaySeries {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const key of dayKeys) {
    const mins = sumFocusMinutes(filterEventsOnLocalDay(events, key));
    if (mins <= 0) continue;
    const i = weekdayIndex(key);
    totals[i] += mins;
    counts[i] += 1;
  }
  return WEEKDAY_LABELS.map((label, i) => ({
    dayKey: `weekday-${i}`,
    label,
    value: counts[i] > 0 ? Math.round(totals[i]! / counts[i]!) : 0
  }));
}

function buildDayLoad(events: EventItem[], dayKeys: string[]): DayLoadCell[] {
  return dayKeys.map((dayKey) => {
    const level = activityLevel(events, dayKey);
    const kind = dayLoadKind(level);
    const quietTitle = `${shortDayLabel(dayKey)}, quieter`;
    const fullTitle = `${shortDayLabel(dayKey)}, fuller`;
    const balancedTitle = `${shortDayLabel(dayKey)}, balanced`;
    return {
      dayKey,
      kind,
      title: kind === "quiet" ? quietTitle : kind === "full" ? fullTitle : balancedTitle
    };
  });
}

function buildDominantFocusDayPart(events: EventItem[], dayKeys: string[]): LifeFlowDayPart | null {
  const keySet = new Set(dayKeys);
  const buckets: Record<LifeFlowDayPart, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  };

  for (const e of events) {
    if (!FOCUS_TYPES.has(e.type) || !e.created_at) continue;
    const key = localDateKeyFromIso(e.created_at);
    if (!key || !keySet.has(key)) continue;
    buckets[dayPartFromMs(new Date(e.created_at).getTime())] += 1;
  }

  const total = buckets.morning + buckets.afternoon + buckets.evening + buckets.night;
  if (total < 3) return null;

  let best: LifeFlowDayPart = "morning";
  let peak = 0;
  for (const part of Object.keys(buckets) as LifeFlowDayPart[]) {
    if (buckets[part] > peak) {
      peak = buckets[part];
      best = part;
    }
  }
  if (peak / total < 0.38) return null;
  return best;
}

function findCalmAndBusyDays(events: EventItem[], dayKeys: string[]): {
  calmest: string | null;
  busiest: string | null;
} {
  let calmKey: string | null = null;
  let busyKey: string | null = null;
  let calmScore = Infinity;
  let busyScore = -1;

  for (const key of dayKeys) {
    const stats = computeDailyStats(events, key);
    const score = stats.tasksCompleted + stats.focusMinutes + stats.cleaningActions;
    if (score > 0 && score < calmScore) {
      calmScore = score;
      calmKey = key;
    }
    if (score > busyScore) {
      busyScore = score;
      busyKey = key;
    }
  }
  return {
    calmest: calmKey ? shortDayLabel(calmKey) : null,
    busiest: busyKey && busyScore > 0 ? shortDayLabel(busyKey) : null
  };
}

export function buildPatternAnalytics(
  events: EventItem[],
  span: PatternSpan,
  now: Date = new Date()
): PatternAnalytics {
  const dayKeys = lastNDayKeys(span, now);
  const focusActive = activeLocalDaysForEventTypes(events, FOCUS_TYPES);
  const cleaningActive = activeLocalDaysForEventTypes(events, CLEANING_TYPES);
  const taskActive = activeLocalDaysForEventTypes(events, TASK_TYPES);
  const streaks = computeConsistencyStreaks(events, now);
  const { calmest, busiest } = findCalmAndBusyDays(events, dayKeys);
  const dayLoad = buildDayLoad(events, dayKeys);
  const dayLoadCounts = dayLoad.reduce(
    (acc, cell) => {
      acc[cell.kind] += 1;
      return acc;
    },
    { quiet: 0, balanced: 0, full: 0 }
  );

  return {
    span,
    dayKeys,
    activityHeatmap: buildHeatmap(events, dayKeys),
    focusSeries: buildDaySeries(dayKeys, focusMinutesByDay(events, dayKeys)),
    spendSeries: buildDaySeries(dayKeys, expenseByDay(events, dayKeys)),
    cleaningSeries: buildDaySeries(dayKeys, cleaningCountByDay(events, dayKeys)),
    taskSeries: buildDaySeries(dayKeys, taskCompletedByDay(events, dayKeys)),
    focusMinutesSeries: buildDaySeries(dayKeys, focusMinutesByDay(events, dayKeys)),
    weeklyFocusRhythm: buildWeeklyFocusRhythm(events, dayKeys),
    weeklyBalance: weeklyActivityBalance(events, dayKeys),
    dayLoad,
    dayLoadCounts,
    streaks: {
      focus: streaks.focusDays,
      cleaning: streaks.cleaningDays,
      tasks: streaks.taskDays
    },
    focusActiveDays: focusActive,
    cleaningActiveDays: cleaningActive,
    taskActiveDays: taskActive,
    calmestDayLabel: calmest,
    busiestDayLabel: busiest,
    dominantFocusDayPart: buildDominantFocusDayPart(events, dayKeys)
  };
}
