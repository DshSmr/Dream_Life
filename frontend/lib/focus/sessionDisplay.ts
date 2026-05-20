import type { FocusSession, TaskItem } from "@/lib/api";

const FALLBACK_KEYS = ["fallbackQuiet", "fallbackDeep", "fallbackBlock", "fallbackWork"] as const;

type FocusT = (key: string, values?: Record<string, string | number>) => string;

function stableFallbackIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % 2147483647;
  return h % FALLBACK_KEYS.length;
}

export function taskTitleForSession(taskId: string | null, tasks: TaskItem[]): string | null {
  if (!taskId) return null;
  const task = tasks.find((t) => t.id === taskId);
  const title = task?.title?.trim();
  return title || null;
}

/** Primary line: custom label, task-linked title, or calm fallback. */
export function focusSessionPrimaryTitle(session: FocusSession, tasks: TaskItem[], t: FocusT): string {
  const label = session.label?.trim();
  if (label) return label;
  const taskTitle = taskTitleForSession(session.task_id, tasks);
  if (taskTitle) return t("workingOn", { name: taskTitle });
  return t(FALLBACK_KEYS[stableFallbackIndex(session.id)]);
}

/** Secondary context when a task is linked (esp. when a custom label is set). */
export function focusSessionFocusedOnLine(session: FocusSession, tasks: TaskItem[], t: FocusT): string | null {
  const taskTitle = taskTitleForSession(session.task_id, tasks);
  if (!taskTitle) return null;
  return t("focusedOn", { name: taskTitle });
}

export function formatStartedRelative(startedAt: string, now: Date, t: FocusT): string {
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime())) return t("startedJustNow");

  const ms = now.getTime() - start.getTime();
  if (ms < 60_000) return t("startedJustNow");

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sameCalendarDay = startDay.getTime() === nowDay.getTime();

  if (sameCalendarDay && start.getHours() < 12 && now.getHours() >= 12) {
    return t("startedThisMorning");
  }

  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return t("startedMinutesAgo", { count: mins });

  const hours = Math.floor(mins / 60);
  if (sameCalendarDay && hours < 12) return t("startedHoursAgo", { count: hours });

  const yesterday = new Date(nowDay);
  yesterday.setDate(yesterday.getDate() - 1);
  if (startDay.getTime() === yesterday.getTime()) return t("startedYesterday");

  return t("startedMinutesAgo", { count: mins });
}

export function formatFocusDurationLine(session: FocusSession, _now: Date, t: FocusT, minSuffix: string): string | null {
  if (!session.ended_at) return null;

  const sec = session.duration_seconds ?? 0;
  const mins = Math.round(sec / 60);
  if (mins < 1) return t("lessThanOneMin");
  return `${mins}${minSuffix}`;
}

export function formatTodayFocusMinutes(minutes: number, t: FocusT, minSuffix: string): string {
  if (minutes <= 0) return t("todayNotYet");
  if (minutes < 1) return t("lessThanOneMin");
  return `${minutes}${minSuffix}`;
}

export function formatWeekFocusMinutes(minutes: number, t: FocusT, minSuffix: string): string {
  if (minutes <= 0) return t("todayNotYet");
  if (minutes < 1) return t("lessThanOneMin");
  return `${minutes}${minSuffix}`;
}
