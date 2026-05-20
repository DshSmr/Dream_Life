export type { Goal, GoalCategory, GoalCreatePayload, GoalPeriod, GoalStatus, GoalUnit } from "@/lib/goals/types";
export { createGoal, deleteGoal, fetchGoalsForPeriod } from "@/lib/goals/api";
export { explainGoalStatus } from "@/lib/goals/explainStatus";
export {
  formatGoalProgress,
  formatGoalUnitLabel,
  formatGoalValue,
  goalCategoryLabel,
  goalProgressRatio,
  type GoalProgressT
} from "@/lib/goals/progressFormat";
