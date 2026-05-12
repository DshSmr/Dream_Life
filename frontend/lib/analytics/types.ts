/**
 * Shared result types for the event analytics layer.
 *
 * All day/week boundaries use the user's local timezone (see `@/lib/datetime`).
 * These types intentionally stay free of React or fetch — keep aggregations testable and portable.
 */

export type DailyStats = {
  /** Count of `task_completed` events on that local calendar day. */
  tasksCompleted: number;
  /** Rounded total minutes from `focus_ended` and `focus_session_completed` on that day. */
  focusMinutes: number;
  /** Count of `cleaning_done` events on that day. */
  cleaningActions: number;
  /** Sum of positive `amount` in `expense_added` payloads on that day (matches finance event shape from API). */
  expensesTotal: number;
};

/** Same shape as daily; window is the caller's responsibility (typically Mon–Sun from `getLocalWeekRangeIso`). */
export type WeeklyStats = DailyStats;

/**
 * Histogram of raw event types. Sparse by design: omitted keys imply zero occurrences
 * in the chosen slice (simpler to merge and display than a fixed enum map).
 */
export type EventCountsByType = Record<string, number>;

export type ProductivityScoreResult = {
  /** MVP composite; can go negative if many zones are overdue. */
  score: number;
  completedTasks: number;
  focusMinutes: number;
  overdueCleaningZones: number;
};
