/** Public surface for event analytics — import from `@/lib/analytics` in app code. */
export type { DailyStats, EventCountsByType, ProductivityScoreResult, WeeklyStats } from "@/lib/analytics/types";
export { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
export {
  computeDailyStats,
  computeEventCountsByType,
  computeMonthlyStats,
  computeProductivityScore,
  computeWeeklyStats,
  countEventsByTypesInRange,
  countEventsOnLocalDay,
  filterEventsInRange,
  filterEventsOnLocalDay,
  mostProductiveLocalDay,
  sumFocusMinutes,
  sumFocusMinutesInRange
} from "@/lib/analytics/fromEvents";
export type { MostProductiveLocalDay } from "@/lib/analytics/fromEvents";
export { fetchNormalizedEvents } from "@/lib/analytics/fetch";
export {
  getDailyStats,
  getEventCountsByType,
  getMonthlyStats,
  getProductivityScore,
  getWeeklyStats,
  type GetDailyStatsOptions,
  type GetEventCountsByTypeOptions,
  type GetMonthlyStatsOptions,
  type GetProductivityScoreOptions,
  type GetWeeklyStatsOptions
} from "@/lib/analytics/engine";
