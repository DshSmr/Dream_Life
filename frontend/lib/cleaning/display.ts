import type { CleaningZone } from "@/lib/api";
import type { HomeHealthLevel } from "@/lib/cleaningHealth";
import { formatTimeLocalHm } from "@/lib/datetime";

type CleaningT = (key: string, values?: Record<string, string | number>) => string;

export function zoneCareLine(zone: CleaningZone, t: CleaningT): string {
  if (zone.status === "ok") {
    if (zone.last_cleaned_at) return t("careOkRecent");
    return t("careInGoodShape");
  }
  if (zone.status === "soon") {
    return t("careNextInDays", { days: zone.frequency_days });
  }
  return t("careReadyForRefresh");
}

/** Today at HH:mm, Yesterday, or 15 May. */
export function formatCleaningWhen(iso: string, now: Date, locale: string, t: CleaningT): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const localeTag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((nowDay.getTime() - day.getTime()) / 86_400_000);

  if (dayDiff === 0) return t("todayAt", { time: formatTimeLocalHm(d) });
  if (dayDiff === 1) return t("yesterday");
  return d.toLocaleDateString(localeTag, { day: "numeric", month: "short" });
}

export function homeHealthSummary(level: HomeHealthLevel, t: CleaningT): string {
  if (level === "healthy") return t("healthComfortable");
  if (level === "needs_attention") return t("healthMostlyGood");
  return t("healthNeedsRefresh");
}
