import type { DaySeries } from "@/lib/operational/metrics";
import type { LifeFlowDayPart } from "@/lib/timeline/types";

export type PatternSpan = 7 | 14 | 28;

export type HeatmapCell = {
  dayKey: string;
  level: 0 | 1 | 2 | 3 | 4;
  title: string;
};

export type HeatmapWeek = {
  weekIndex: number;
  cells: HeatmapCell[];
};

export type ActivityBalance = {
  work: number;
  home: number;
  finance: number;
};

export type DayLoadKind = "quiet" | "balanced" | "full";

export type DayLoadCell = {
  dayKey: string;
  kind: DayLoadKind;
  title: string;
};

export type PatternAnalytics = {
  span: PatternSpan;
  dayKeys: string[];
  activityHeatmap: HeatmapWeek[];
  focusSeries: DaySeries;
  spendSeries: DaySeries;
  cleaningSeries: DaySeries;
  taskSeries: DaySeries;
  focusMinutesSeries: DaySeries;
  /** Average focus minutes by weekday (Mon–Sun) */
  weeklyFocusRhythm: DaySeries;
  weeklyBalance: ActivityBalance;
  dayLoad: DayLoadCell[];
  dayLoadCounts: { quiet: number; balanced: number; full: number };
  streaks: { focus: number; cleaning: number; tasks: number };
  focusActiveDays: Set<string>;
  cleaningActiveDays: Set<string>;
  taskActiveDays: Set<string>;
  calmestDayLabel: string | null;
  busiestDayLabel: string | null;
  /** Dominant time-of-day for focus events in the window, when clear enough. */
  dominantFocusDayPart: LifeFlowDayPart | null;
};