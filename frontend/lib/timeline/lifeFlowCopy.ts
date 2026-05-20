import type { EventItem } from "@/lib/api";
import { translate } from "@/lib/i18n/translate";
import type { Locale, TranslationKey } from "@/lib/i18n/types";
import { isNoiseLabel, shouldIncludeEventInLifeFlow } from "@/lib/timeline/flowNoise";

export type LifeFlowT = (key: string, values?: Record<string, string | number>) => string;

function formatTemplate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}

export function createLifeFlowT(locale: Locale = "en"): LifeFlowT {
  return (key, values) => {
    const fullKey = `insights.lifeFlow.${key}` as TranslationKey;
    return formatTemplate(translate(locale, fullKey), values);
  };
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function formatEur(n: unknown): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return `€${x.toFixed(2)}`;
}

const CLEANING_KEYS = ["flowCleaningRefreshed", "flowCleaningCared", "flowCleaningReset"] as const;
const FOCUS_START_KEYS = ["flowFocusQuiet", "flowFocusMorning", "flowFocusStarted"] as const;
const TASK_SUBLINE_KEYS = ["flowTaskCompleted", "flowTaskWrapped", "flowTaskFinished"] as const;

function pickVariant<T extends string>(keys: readonly T[], seed: number): T {
  return keys[seed % keys.length];
}

function cleaningCopy(zone: string, index: number, t: LifeFlowT): { text: string; subline: string | null } {
  if (!zone) return { text: t("flowCleaningHome"), subline: t("flowSublineHome") };
  const key = pickVariant(CLEANING_KEYS, [...zone].reduce((h, c) => h + c.charCodeAt(0), 0) + index);
  return { text: t(key, { zone }), subline: t("flowSublineHome") };
}

function expenseCopy(category: string, amount: string, index: number, t: LifeFlowT): { text: string; subline: string | null } {
  const cat = category.toLowerCase();
  if (cat.includes("groc") || cat.includes("food") || cat.includes("market")) {
    return { text: t("flowExpenseGroceries"), subline: amount || null };
  }
  if (cat.includes("coffee") || cat.includes("cafe")) {
    return { text: t("flowExpenseTreat"), subline: amount || null };
  }
  if (category) {
    return { text: t("flowExpenseCategory", { category }), subline: amount || null };
  }
  return { text: pickVariant(["flowExpenseNoted", "flowExpenseQuiet"] as const, index), subline: amount || null };
}

export function mapEventToLifeFlowCopy(
  event: EventItem,
  index: number,
  t: LifeFlowT
): { text: string; subline: string | null; category: import("@/lib/timeline/types").LifeFlowCategory } | null {
  if (!shouldIncludeEventInLifeFlow(event)) return null;

  const p = event.payload as Record<string, unknown>;

  switch (event.type) {
    case "task_completed": {
      const title = str(p.title);
      if (!title || isNoiseLabel(title)) {
        return { text: t("flowTaskDone"), subline: t("flowTaskCompleted"), category: "task" };
      }
      const subKey = pickVariant(TASK_SUBLINE_KEYS, index + title.length);
      return { text: title, subline: t(subKey), category: "task" };
    }
    case "focus_started": {
      const task = str(p.task_title);
      const label = str(p.label);
      const name = task || label;
      if (name) {
        return { text: t("flowFocusNamed", { name }), subline: t("flowSublineFocus"), category: "focus" };
      }
      const key = pickVariant(FOCUS_START_KEYS, index);
      return { text: t(key), subline: null, category: "focus" };
    }
    case "focus_session_completed": {
      const mins = Math.round(Number(p.duration_minutes ?? 0)) || Math.round(Number(p.duration_seconds ?? 0) / 60);
      const task = str(p.task_title);
      const label = str(p.label);
      const name = task || label;
      if (name && mins > 0) {
        return {
          text: t("flowFocusBlockNamed", { name }),
          subline: t("flowFocusBlockMinutes", { minutes: mins }),
          category: "focus"
        };
      }
      if (mins > 0) {
        return {
          text: t("flowFocusBlockMinutes", { minutes: mins }),
          subline: t("flowSublineFocus"),
          category: "focus"
        };
      }
      return { text: t("flowFocusBlockEnded"), subline: null, category: "focus" };
    }
    case "pomodoro_completed": {
      const task = str(p.task_title);
      const label = str(p.label);
      const name = task || label;
      return {
        text: name ? t("flowPomodoroNamed", { name }) : t("flowPomodoroDone"),
        subline: t("flowSublineFocusCycle"),
        category: "pomodoro"
      };
    }
    case "income_added": {
      const amount = formatEur(p.amount);
      const cat = str(p.category);
      return {
        text: cat ? t("flowIncomeNamed", { category: cat }) : t("flowIncome"),
        subline: amount || null,
        category: "finance"
      };
    }
    case "expense_added": {
      const amount = formatEur(p.amount);
      const cat = str(p.category);
      const { text, subline } = expenseCopy(cat, amount, index, t);
      return { text, subline, category: "finance" };
    }
    case "cleaning_done": {
      const zone = str(p.zone_name);
      if (isNoiseLabel(zone)) {
        return { text: t("flowCleaningHome"), subline: t("flowSublineHome"), category: "cleaning" };
      }
      const { text, subline } = cleaningCopy(zone, index, t);
      return { text, subline, category: "cleaning" };
    }
    default:
      return null;
  }
}

/** Legacy headline/detail for AI context */
export function mapEventToTimelineCopy(event: EventItem, t: LifeFlowT): { headline: string; detail: string | null } {
  const mapped = mapEventToLifeFlowCopy(event, 0, t);
  if (mapped) return { headline: mapped.text, detail: mapped.subline };
  return { headline: t("flowMomentGeneric"), detail: null };
}
