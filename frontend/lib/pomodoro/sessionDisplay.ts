import type { PomodoroSession, TaskItem } from "@/lib/api";
import { formatTimeLocalHm } from "@/lib/datetime";
import { taskTitleForSession } from "@/lib/focus/sessionDisplay";

const FALLBACK_KEYS = ["fallbackSprint", "fallbackBlock", "fallbackTimed", "fallbackShort"] as const;

type PomodoroT = (key: string, values?: Record<string, string | number>) => string;

function stableFallbackIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % 2147483647;
  return h % FALLBACK_KEYS.length;
}

export function pomodoroPrimaryTitle(session: PomodoroSession, tasks: TaskItem[], t: PomodoroT): string {
  const label = session.label?.trim();
  if (label) return label;
  const taskTitle = taskTitleForSession(session.task_id, tasks);
  if (taskTitle) return t("cycleFor", { name: taskTitle });
  return t(FALLBACK_KEYS[stableFallbackIndex(session.id)]);
}

/** When a custom label is set, show which task the cycle is tied to. */
export function pomodoroTaskLine(session: PomodoroSession, tasks: TaskItem[], t: PomodoroT): string | null {
  if (!session.label?.trim()) return null;
  const taskTitle = taskTitleForSession(session.task_id, tasks);
  if (!taskTitle) return null;
  return t("cycleOn", { name: taskTitle });
}

export function formatWorkBreakLine(work: number, breakMin: number, t: PomodoroT): string {
  return t("workBreakLine", { work, break: breakMin });
}

export function formatCalmWhen(
  iso: string,
  now: Date,
  locale: string,
  t: PomodoroT
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const localeTag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((nowDay.getTime() - day.getTime()) / 86_400_000);

  if (dayDiff === 0) return t("todayAt", { time: formatTimeLocalHm(d) });
  if (dayDiff === 1) return t("yesterday");
  return d.toLocaleDateString(localeTag, { day: "numeric", month: "short" });
}

export function pomodoroSecondaryParts(
  session: PomodoroSession,
  tasks: TaskItem[],
  now: Date,
  locale: string,
  t: PomodoroT
): string[] {
  const parts: string[] = [formatWorkBreakLine(session.work_minutes, session.break_minutes, t)];
  const taskLine = pomodoroTaskLine(session, tasks, t);
  if (taskLine) parts.push(taskLine);
  if (session.status === "running") parts.push(t("statusRunning"));
  else parts.push(t("statusFinished"));
  parts.push(formatCalmWhen(session.started_at, now, locale, t));
  return parts;
}
