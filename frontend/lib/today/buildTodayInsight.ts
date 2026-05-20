import type { DailySummary } from "@/lib/api";

export type TodayT = (key: string, values?: Record<string, string | number>) => string;

export type TodayDisplayCopy = {
  headline: string;
  reflection: string;
  detail: string | null;
};

function hasMeaningfulActivity(summary: DailySummary, focusMinutes: number): boolean {
  return (
    summary.tasks_completed > 0 ||
    summary.cleanings_done > 0 ||
    focusMinutes >= 15 ||
    summary.expense_total > 0 ||
    summary.income_total > 0
  );
}

function buildReflection(summary: DailySummary, focusMinutes: number, t: TodayT): string {
  const tasks = summary.tasks_completed;
  const home = summary.cleanings_done;
  const focus = focusMinutes;

  if (tasks > 0 && home > 0 && focus >= 15) {
    return t("reflectionTasksHomeFocus");
  }
  if (tasks > 0 && home > 0) {
    return t("reflectionTasksHome");
  }
  if (tasks > 0 && focus >= 15) {
    return t("reflectionTasksFocus");
  }
  if (tasks > 0) {
    return t("reflectionTasks");
  }
  if (home > 0 && focus >= 15) {
    return t("reflectionHomeFocus");
  }
  if (home > 0) {
    return t("reflectionHome");
  }
  if (focus >= 15) {
    return t("reflectionFocus");
  }
  if (summary.expense_total > 0 || summary.income_total > 0) {
    return t("reflectionMoney");
  }
  return t("reflectionGentle");
}

function buildDetailLine(summary: DailySummary, focusMinutes: number, t: TodayT): string | null {
  const parts: string[] = [];
  if (summary.tasks_completed > 0) {
    parts.push(t("detailTasks", { count: summary.tasks_completed }));
  }
  if (focusMinutes >= 15) {
    parts.push(t("detailFocus", { minutes: focusMinutes }));
  }
  if (summary.cleanings_done > 0) {
    parts.push(t("detailHome", { count: summary.cleanings_done }));
  }
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

export function buildTodayDisplayCopy(
  summary: DailySummary,
  focusMinutes: number,
  t: TodayT
): TodayDisplayCopy {
  if (!hasMeaningfulActivity(summary, focusMinutes)) {
    return {
      headline: t("headlineCalm"),
      reflection: t("reflectionQuietDay"),
      detail: null
    };
  }

  return {
    headline: t("headlineSmallSteps"),
    reflection: buildReflection(summary, focusMinutes, t),
    detail: buildDetailLine(summary, focusMinutes, t)
  };
}
