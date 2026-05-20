import type { Locale } from "@/lib/i18n/types";
import { localCalendarDayKeyFromDate } from "@/lib/datetime";
import type { LifeFlowDayBucket, LifeFlowMoment } from "@/lib/timeline/types";
import type { LifeFlowT } from "@/lib/timeline/lifeFlowCopy";

export function formatDayHeading(
  dayKey: string,
  t: LifeFlowT,
  locale: Locale = "en",
  now: Date = new Date()
): string {
  const [ys, ms, ds] = dayKey.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const day = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return dayKey;

  const dt = new Date(y, m - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dt.getTime() === today.getTime()) return t("bucketToday");
  if (dt.getTime() === yesterday.getTime()) return t("bucketYesterday");

  const localeTag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
  return dt.toLocaleDateString(localeTag, { weekday: "long", day: "numeric", month: "long" });
}

export function dayBucketForKey(dayKey: string, now: Date = new Date()): LifeFlowDayBucket {
  const todayKey = localCalendarDayKeyFromDate(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = localCalendarDayKeyFromDate(yesterday);
  if (dayKey === todayKey) return "today";
  if (dayKey === yesterdayKey) return "yesterday";
  return "earlier";
}

/** @deprecated Day closing reflections are built in `dayReflection.ts` */
export function buildReflectiveMoments(
  _dayKey: string,
  _moments: LifeFlowMoment[],
  _allEvents: unknown[],
  _spendingLimitEur: number
): LifeFlowMoment[] {
  return [];
}

export { dayPartLabel } from "@/lib/timeline/dayParts";
