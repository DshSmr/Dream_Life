export type LifeFlowCategory =
  | "task"
  | "focus"
  | "pomodoro"
  | "cleaning"
  | "finance"
  | "insight"
  | "review"
  | "dream"
  | "reflection";

export type LifeFlowKind = "moment" | "reflection";

export type LifeFlowDayPart = "morning" | "afternoon" | "evening" | "night";

/** One readable beat in the life stream */
export type LifeFlowMoment = {
  id: string;
  atMs: number;
  dayKey: string;
  dayPart: LifeFlowDayPart;
  kind: LifeFlowKind;
  category: LifeFlowCategory;
  /** Primary line — short, natural language */
  text: string;
  /** Optional quieter second line */
  subline?: string | null;
};

export type LifeFlowDayPartGroup = {
  dayPart: LifeFlowDayPart;
  label: string;
  moments: LifeFlowMoment[];
};

export type LifeFlowDayBucket = "today" | "yesterday" | "earlier";

export type LifeFlowDayGroup = {
  dayKey: string;
  /** Today | Yesterday | weekday date for earlier days */
  heading: string;
  bucket: LifeFlowDayBucket;
  isToday: boolean;
  /** All moments for the day, chronological */
  moments: LifeFlowMoment[];
  /** @deprecated Prefer `moments` — kept for legacy callers */
  parts: LifeFlowDayPartGroup[];
};

/** @deprecated Use LifeFlowMoment — kept for AI context builder */
export type TimelineRow = {
  id: string;
  atMs: number;
  timeLabel: string;
  headline: string;
  detail: string | null;
};
