import type { PatternAnalytics } from "@/lib/analytics/visual/types";
import type { LifeFlowDayPart } from "@/lib/timeline/types";

function weekdayIndex(dayKey: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!m) return 0;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (d.getDay() + 6) % 7;
}

function weekdayLabel(index: number, locale: string): string {
  const anchor = new Date(2024, 0, 1 + index);
  return anchor.toLocaleDateString(locale, { weekday: "long" });
}

export type PatternsGlanceInsights = {
  calmDays: number;
  busiestWeekday: string | null;
  focusDayPart: LifeFlowDayPart | null;
  hasActivity: boolean;
};

export function buildPatternsGlanceInsights(
  patterns: PatternAnalytics,
  locale: string
): PatternsGlanceInsights {
  const hasActivity = patterns.activityHeatmap.some((w) => w.cells.some((c) => c.level > 0));
  const totals = [0, 0, 0, 0, 0, 0, 0];

  for (const week of patterns.activityHeatmap) {
    for (const cell of week.cells) {
      totals[weekdayIndex(cell.dayKey)] += cell.level;
    }
  }

  let busiestWeekday: string | null = null;
  let peak = 0;
  for (let i = 0; i < 7; i += 1) {
    if (totals[i]! > peak) {
      peak = totals[i]!;
      busiestWeekday = weekdayLabel(i, locale);
    }
  }
  if (peak <= 0) busiestWeekday = null;

  return {
    calmDays: patterns.dayLoadCounts.quiet,
    busiestWeekday,
    focusDayPart: patterns.dominantFocusDayPart,
    hasActivity
  };
}
