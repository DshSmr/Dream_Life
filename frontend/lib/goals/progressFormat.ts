/**
 * Presentation helpers only — business rules for status live on the server (`app/services/goals/progress.py`).
 */
import type { Goal, GoalUnit } from "@/lib/goals/types";

export type GoalProgressT = (
  key: string,
  values?: Record<string, string | number>
) => string;

function fmtNum(value: number): string {
  if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 0.01) {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

export function goalProgressRatio(goal: Goal): number {
  if (goal.targetValue <= 0) return 0;
  return Math.min(1, goal.currentValue / goal.targetValue);
}

export function formatGoalValue(value: number, unit: GoalUnit): string {
  if (unit === "eur") return `€${fmtNum(value)}`;
  if (unit === "percent") return `${fmtNum(value)}%`;
  if (unit === "minutes") return `${fmtNum(value)} min`;
  return `${fmtNum(value)}`;
}

export function formatGoalUnitLabel(unit: GoalUnit): string {
  if (unit === "eur") return "€";
  if (unit === "percent") return "%";
  if (unit === "minutes") return "minutes";
  return "tasks";
}

/** Human progress line, e.g. "8 of 12 tasks done" or "€240 saved of €300". */
export function formatGoalProgress(goal: Goal, t: GoalProgressT): string {
  const current = fmtNum(goal.currentValue);
  const target = fmtNum(goal.targetValue);
  if (goal.unit === "eur") {
    return t("progressSaved", { current, target });
  }
  if (goal.unit === "percent") {
    return t("progressHome", { current, target });
  }
  if (goal.unit === "minutes") {
    return t("progressMinutes", { current, target });
  }
  return t("progressTasks", { current, target });
}

export function goalCategoryLabel(category: Goal["category"], t: GoalProgressT): string {
  if (category === "finance") return t("categoryFinance");
  if (category === "home") return t("categoryHome");
  return t("categoryWork");
}
