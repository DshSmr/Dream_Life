import type { GoalProgressT } from "@/lib/goals/progressFormat";
import type { Goal } from "@/lib/goals/types";

/** Short note under a goal card — calm, no percentages. */
export function explainGoalStatus(goal: Goal, t: GoalProgressT): string {
  const period = goal.period === "monthly" ? t("periodMonth") : t("periodWeek");

  if (goal.status === "completed") {
    return t("explainDone", { period });
  }
  if (goal.status === "at_risk") {
    return t("explainAtRisk", { period });
  }
  return t("explainOnTrack", { period });
}
