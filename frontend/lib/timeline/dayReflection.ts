import type { DailyReview } from "@/lib/api";
import { computeDailyStats } from "@/lib/analytics/fromEvents";
import type { EventItem } from "@/lib/api";
import type { LifeFlowT } from "@/lib/timeline/lifeFlowCopy";

function daySeed(dayKey: string): number {
  return [...dayKey].reduce((h, c) => h + c.charCodeAt(0), 0);
}

/** Human closing line for a day — never raw review API dumps. */
export function buildDayClosingReflection(
  dayKey: string,
  dayEvents: EventItem[],
  t: LifeFlowT,
  storedReview?: DailyReview | null
): { text: string; subline: string | null } | null {
  const stats = computeDailyStats(dayEvents, dayKey);
  const { tasksCompleted: tasks, focusMinutes: focus, cleaningActions: cleaning, expensesTotal: spent } = stats;

  const hasActivity = tasks > 0 || focus > 0 || cleaning > 0 || spent > 0;
  if (!hasActivity && !storedReview) return null;

  const seed = daySeed(dayKey);

  if (!hasActivity) {
    return {
      text: t("reflectionQuietDay"),
      subline: t("reflectionQuietDaySub")
    };
  }

  if (tasks === 0 && focus === 0 && cleaning > 0) {
    return { text: t("reflectionHomeDay"), subline: pickSub(seed, ["reflectionHomeSub1", "reflectionHomeSub2"], t) };
  }

  if (focus > 0 && cleaning > 0 && tasks === 0) {
    return { text: t("reflectionSteadyFocusHome"), subline: null };
  }

  if (tasks > 0 && cleaning > 0) {
    return { text: t("reflectionWorkHome"), subline: pickSub(seed, ["reflectionWorkHomeSub1", "reflectionWorkHomeSub2"], t) };
  }

  if (focus >= 45 && tasks > 0) {
    return { text: t("reflectionSteadyFocusTasks"), subline: null };
  }

  if (tasks > 0 && focus === 0 && cleaning === 0) {
    const key = seed % 2 === 0 ? "reflectionFewCompleted" : "reflectionQuietProgress";
    return { text: t(key), subline: t("reflectionFewCompletedSub") };
  }

  if (focus > 0) {
    return { text: t("reflectionFocusDay"), subline: pickSub(seed, ["reflectionFocusSub1", "reflectionFocusSub2"], t) };
  }

  if (spent > 0 && tasks === 0 && focus === 0) {
    return { text: t("reflectionMoneyMoved"), subline: null };
  }

  return {
    text: t("reflectionGentleDay"),
    subline: pickSub(seed, ["reflectionGentleSub1", "reflectionGentleSub2"], t)
  };
}

function pickSub(seed: number, keys: string[], t: LifeFlowT): string | null {
  const key = keys[seed % keys.length];
  if (!key) return null;
  return t(key);
}
