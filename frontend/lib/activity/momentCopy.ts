import type { EventItem, EventType } from "@/lib/api";
import { formatCleaningWhen } from "@/lib/cleaning/display";

type ActivityT = (key: string, values?: Record<string, string | number>) => string;

const HIDDEN_IN_ACTIVITY: Set<EventType> = new Set(["focus_ended", "work_started"]);

const CLEANING_KEYS = ["momentCleaningRefreshed", "momentCleaningCared", "momentCleaningReset"] as const;

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function formatEur(n: unknown): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return `€${x.toFixed(2)}`;
}

function cleaningMomentKey(zone: string, index: number): (typeof CLEANING_KEYS)[number] {
  const seed = [...zone].reduce((h, c) => h + c.charCodeAt(0), 0) + index;
  return CLEANING_KEYS[seed % CLEANING_KEYS.length];
}

export function shouldShowInActivityFeed(event: EventItem): boolean {
  if (HIDDEN_IN_ACTIVITY.has(event.type)) return false;
  const note = str((event.payload as Record<string, unknown>).note);
  if (note.startsWith("habit_support_action:")) return false;
  return true;
}

export type ActivityMoment = {
  headline: string;
  subline: string | null;
};

export function mapActivityMoment(event: EventItem, t: ActivityT, index = 0): ActivityMoment {
  const p = event.payload as Record<string, unknown>;

  switch (event.type) {
    case "task_completed": {
      const title = str(p.title);
      return {
        headline: title ? t("momentTaskNamed", { title }) : t("momentTaskDone"),
        subline: title ? t("sublineTask") : null
      };
    }
    case "focus_started": {
      const label = str(p.label);
      const task = str(p.task_title);
      const name = task || label;
      return {
        headline: name ? t("momentFocusStartedNamed", { name }) : t("momentFocusStarted"),
        subline: name ? t("sublineFocus") : null
      };
    }
    case "focus_session_completed": {
      const mins = Math.round(Number(p.duration_minutes ?? 0)) || Math.round(Number(p.duration_seconds ?? 0) / 60);
      const task = str(p.task_title);
      const label = str(p.label);
      const name = task || label;
      if (name && mins > 0) {
        return {
          headline: t("momentFocusSessionNamed", { name, minutes: mins }),
          subline: t("sublineFocusBlock", { minutes: mins })
        };
      }
      if (mins > 0) {
        return {
          headline: t("momentFocusSessionMinutes", { minutes: mins }),
          subline: t("sublineFocus")
        };
      }
      return { headline: t("momentFocusSession"), subline: t("sublineFocus") };
    }
    case "pomodoro_completed": {
      const task = str(p.task_title);
      const label = str(p.label);
      const name = task || label;
      return {
        headline: name ? t("momentPomodoroNamed", { name }) : t("momentPomodoro"),
        subline: t("sublinePomodoro")
      };
    }
    case "income_added": {
      const amount = formatEur(p.amount);
      const category = str(p.category);
      if (amount && category) {
        return { headline: t("momentIncomeNamed", { amount, category }), subline: t("sublineMoneyIn") };
      }
      return { headline: t("momentIncome"), subline: amount || category || null };
    }
    case "expense_added": {
      const amount = formatEur(p.amount);
      const category = str(p.category);
      if (amount && category) {
        return { headline: t("momentExpenseNamed", { amount, category }), subline: t("sublineMoneyOut") };
      }
      return { headline: t("momentExpense"), subline: amount || category || null };
    }
    case "cleaning_done": {
      const zone = str(p.zone_name);
      if (!zone) return { headline: t("momentCleaningHome"), subline: t("sublineHome") };
      const key = cleaningMomentKey(zone, index);
      return { headline: t(key, { zone }), subline: t("sublineHome") };
    }
    default:
      return { headline: t("momentGeneric"), subline: null };
  }
}

export function formatActivityMomentWhen(
  iso: string,
  now: Date,
  locale: string,
  t: ActivityT
): string {
  return formatCleaningWhen(iso, now, locale, t);
}

function payloadSearchValues(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const parts: string[] = [];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object") parts.push(payloadSearchValues(value));
    else parts.push(String(value));
  }
  return parts.join(" ");
}

/** Text used for search (no raw event type strings). */
export function activityMomentSearchText(event: EventItem, t: ActivityT): string {
  const moment = mapActivityMoment(event, t);
  const note = str((event.payload as Record<string, unknown>).note);
  const values = payloadSearchValues(event.payload);
  const safeNote = note.startsWith("habit_support_action:") ? "" : note;
  return [moment.headline, moment.subline, safeNote, values].filter(Boolean).join(" ").toLowerCase();
}

export type ActivityDetailRow = { label: string; value: string };

export function buildActivityMomentDetails(event: EventItem, t: ActivityT): ActivityDetailRow[] {
  const p = event.payload as Record<string, unknown>;
  const rows: ActivityDetailRow[] = [];

  const push = (labelKey: string, value: unknown) => {
    const v = str(value);
    if (v) rows.push({ label: t(labelKey), value: v });
  };

  switch (event.type) {
    case "task_completed":
      push("detailTask", p.title);
      break;
    case "focus_started":
      push("detailLabel", p.label);
      push("detailTask", p.task_title);
      break;
    case "focus_session_completed": {
      const mins = Math.round(Number(p.duration_minutes ?? 0)) || Math.round(Number(p.duration_seconds ?? 0) / 60);
      if (mins > 0) rows.push({ label: t("detailMinutes"), value: String(mins) });
      push("detailTask", p.task_title);
      push("detailLabel", p.label);
      break;
    }
    case "pomodoro_completed":
      push("detailTask", p.task_title);
      push("detailLabel", p.label);
      break;
    case "income_added":
    case "expense_added":
      push("detailCategory", p.category);
      {
        const amount = formatEur(p.amount);
        if (amount) rows.push({ label: t("detailAmount"), value: amount });
      }
      break;
    case "cleaning_done":
      push("detailZone", p.zone_name);
      break;
    default: {
      const note = str(p.note);
      if (note && !note.startsWith("habit_support_action:")) {
        rows.push({ label: t("detailNote"), value: note });
      }
    }
  }

  return rows;
}

export function activityLifeAreaLabel(type: EventType, t: ActivityT): string {
  switch (type) {
    case "task_completed":
    case "focus_started":
    case "focus_session_completed":
    case "pomodoro_completed":
      return t("areaWork");
    case "income_added":
    case "expense_added":
      return t("areaMoney");
    case "cleaning_done":
      return t("areaHome");
    default:
      return t("areaLife");
  }
}
