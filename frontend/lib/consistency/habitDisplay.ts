import type { DetectedHabit, HabitSupportAction } from "@/lib/api";

type ConsistencyT = (key: string, values?: Record<string, string | number>) => string;

export type HabitConfidenceTone = "steady" | "growing" | "gentle";

export function habitConfidenceTone(confidence: number): HabitConfidenceTone {
  if (confidence >= 0.78) return "steady";
  if (confidence >= 0.58) return "growing";
  return "gentle";
}

export function habitCategoryLabel(category: DetectedHabit["category"], t: ConsistencyT): string {
  if (category === "focus") return t("categoryFocus");
  if (category === "cleaning") return t("categoryCleaning");
  if (category === "finance") return t("categoryFinance");
  return t("categoryTasks");
}

function peakHourFromHabitId(id: string): number | null {
  const m = /^habit-task-hour-(\d{1,2})$/.exec(id);
  if (!m) return null;
  const h = Number(m[1]);
  return h >= 0 && h <= 23 ? h : null;
}

function timeOfDayKey(hour: number): "morning" | "afternoon" | "evening" | "late" {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 16) return "afternoon";
  if (hour >= 17 && hour <= 21) return "evening";
  return "late";
}

export function habitMessage(habit: DetectedHabit, t: ConsistencyT): string {
  if (habit.id === "habit-morning-focus") return t("patternMorningFocus");
  if (habit.id === "habit-cleaning-consistency") return t("patternCleaningSteady");
  if (habit.id.startsWith("habit-spend-")) {
    const slug = habit.id.replace(/^habit-spend-/, "");
    const category =
      slug.length > 0
        ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : t("categoryFinance");
    return t("patternSpending", { category });
  }
  const peak = peakHourFromHabitId(habit.id);
  if (peak != null) {
    const part = timeOfDayKey(peak);
    if (part === "morning") return t("patternTasksMorning");
    if (part === "afternoon") return t("patternTasksAfternoon");
    if (part === "evening") return t("patternTasksEvening");
    return t("patternTasksLate");
  }
  return habit.message;
}

export function habitFrequency(habit: DetectedHabit, t: ConsistencyT): string {
  if (habit.id === "habit-morning-focus") return t("freqMorningFocus");
  if (habit.id === "habit-cleaning-consistency") return t("freqCleaningSteady");
  if (habit.id.startsWith("habit-spend-")) return t("freqSpending");
  if (habit.id.startsWith("habit-task-hour-")) return t("freqTasksRhythm");
  return habit.frequency;
}

export function habitActionLabel(action: HabitSupportAction, habit: DetectedHabit, t: ConsistencyT): string {
  if (action.id.includes("start-focus")) return t("actionMorningFocus");
  if (action.id.includes("daily-plan-clean")) return t("actionCleaningPlan");
  if (action.id.includes("plan-before-window")) return t("actionTaskMorning");
  if (action.id.includes("review-expenses")) return t("actionReviewSpending");
  return action.label;
}

export function habitPlanItemTitle(
  payload: Record<string, unknown> | undefined,
  habit: DetectedHabit,
  t: ConsistencyT
): string {
  if (habit.id === "habit-cleaning-consistency") return t("planCleaningPass");
  if (habit.id.startsWith("habit-task-hour-")) return t("planMorningTask");
  if (typeof payload?.title === "string") return payload.title;
  return t("plannedItem");
}
