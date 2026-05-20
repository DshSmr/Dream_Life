import type { CleaningZone, EventItem } from "@/lib/api";
import type { HomeHealthLevel, HomeHealthScore } from "@/lib/cleaningHealth";
import { formatCleaningWhen } from "@/lib/cleaning/display";
import {
  buildDaySeries,
  cleaningCountByDay,
  cleaningDoneThisWeek,
  cleaningZoneCounts,
  lastNDayKeys,
  type DaySeries
} from "@/lib/operational/metrics";

/** Home Health page copy (life.homeHealth). */
export type HomeHealthT = (key: string, values?: Record<string, string | number>) => string;

/** Cleaning zone care lines (life.cleaning). */
export type CleaningT = (key: string, values?: Record<string, string | number>) => string;

export type RecentCareRow = {
  id: string;
  primary: string;
  whenLabel: string;
};

export type HomeSnapshotMetrics = {
  recentlyCared: string;
  recentlyCaredHint?: string;
  dueSoon: string;
  dueSoonHint?: string;
  comfortRhythm: string;
  spacesTracked: string;
  spacesTrackedHint?: string;
};

export type HomeOverviewModel = {
  lead: string;
  footnote: string;
  metrics: HomeSnapshotMetrics;
  weekSeries: DaySeries;
  attentionZones: CleaningZone[];
  settledZones: CleaningZone[];
  recentRows: RecentCareRow[];
};

const MOMENT_KEYS = [
  "momentRefreshed",
  "momentCaredFor",
  "momentReset",
  "momentTidied",
  "momentTidyAgain",
  "momentRecently"
] as const;

type MomentKey = (typeof MOMENT_KEYS)[number];

export function homeOverviewLead(score: HomeHealthScore, t: HomeHealthT): string {
  if (score.level === "healthy") return t("leadStable");
  if (score.level === "needs_attention") return t("leadMostlyCalm");
  return t("leadNeedsCare");
}

export function homeOverviewFootnote(t: HomeHealthT): string {
  return t("footnoteRhythm");
}

export function comfortRhythmLabel(level: HomeHealthLevel, t: HomeHealthT): string {
  if (level === "healthy") return t("rhythmSettled");
  if (level === "needs_attention") return t("rhythmBalanced");
  return t("rhythmNeedsTending");
}

function zonesCaredInLastDays(zones: CleaningZone[], now: Date, days: number): CleaningZone[] {
  const cutoff = now.getTime() - days * 86_400_000;
  return zones.filter((z) => {
    if (!z.last_cleaned_at) return false;
    return new Date(z.last_cleaned_at).getTime() >= cutoff;
  });
}

export function buildHomeSnapshotMetrics(
  zones: CleaningZone[],
  events: EventItem[],
  homeHealth: HomeHealthScore,
  t: HomeHealthT,
  now: Date
): HomeSnapshotMetrics {
  const counts = cleaningZoneCounts(zones);
  const weekDone = cleaningDoneThisWeek(events, now);
  const recentZones = zonesCaredInLastDays(zones, now, 14);

  let recentlyCared = t("metricRecentlyQuiet");
  let recentlyCaredHint: string | undefined;

  if (recentZones.length > 0) {
    recentlyCared = String(recentZones.length);
    const names = recentZones
      .slice(0, 3)
      .map((z) => z.name)
      .join(", ");
    recentlyCaredHint =
      recentZones.length > 3
        ? t("metricRecentlyHintMore", { names, count: recentZones.length - 3 })
        : names;
  } else if (weekDone > 0) {
    recentlyCared = String(weekDone);
    recentlyCaredHint = t("metricRecentlyWeek", { count: weekDone });
  }

  let dueSoon = counts.soon > 0 ? String(counts.soon) : t("metricDueSoonClear");
  let dueSoonHint: string | undefined;
  if (counts.overdue > 0) {
    dueSoonHint = t("metricDueSoonOverdue", { count: counts.overdue });
  } else if (counts.soon > 0) {
    dueSoonHint = t("metricDueSoonUpcoming");
  }

  return {
    recentlyCared,
    recentlyCaredHint,
    dueSoon,
    dueSoonHint,
    comfortRhythm: comfortRhythmLabel(homeHealth.level, t),
    spacesTracked: String(counts.total),
    spacesTrackedHint: t("metricSpacesHint")
  };
}

function pickMomentKey(zoneName: string, index: number, prevKey: MomentKey | null): MomentKey {
  const seed = [...zoneName].reduce((h, c) => h + c.charCodeAt(0), 0) + index * 11;
  let idx = seed % MOMENT_KEYS.length;
  let key = MOMENT_KEYS[idx];
  if (key === prevKey) {
    idx = (idx + 1) % MOMENT_KEYS.length;
    key = MOMENT_KEYS[idx];
  }
  return key;
}

export function recentCareMomentLabel(
  zoneName: string | null | undefined,
  momentKey: MomentKey | "momentHomeCared",
  t: HomeHealthT
): string {
  if (!zoneName || momentKey === "momentHomeCared") return t("momentHomeCared");
  return t(momentKey, { zone: zoneName });
}

export function sortZonesNeedingAttention(zones: CleaningZone[]): CleaningZone[] {
  return [...zones]
    .filter((z) => z.status !== "ok")
    .sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (b.status === "overdue" && a.status !== "overdue") return 1;
      return a.name.localeCompare(b.name);
    });
}

export function sortSettledZones(zones: CleaningZone[], limit = 6): CleaningZone[] {
  return [...zones]
    .filter((z) => z.status === "ok")
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildHomeWeekSeries(events: EventItem[], now: Date): DaySeries {
  const keys = lastNDayKeys(7, now);
  return buildDaySeries(keys, cleaningCountByDay(events, keys));
}

export function buildRecentCareRows(
  events: EventItem[],
  zones: CleaningZone[],
  opts: { now: Date; locale: string; t: HomeHealthT; tCleaning: CleaningT; limit?: number }
): RecentCareRow[] {
  const { now, locale, t, tCleaning, limit = 8 } = opts;
  let prevKey: MomentKey | null = null;

  return events
    .filter((e) => e.type === "cleaning_done")
    .slice(0, limit)
    .map((e, index) => {
      const zoneName =
        typeof e.payload?.zone_name === "string"
          ? e.payload.zone_name
          : typeof e.payload?.zone_id === "string"
            ? zones.find((z) => z.id === e.payload.zone_id)?.name
            : null;

      const momentKey: MomentKey | "momentHomeCared" = zoneName
        ? pickMomentKey(zoneName, index, prevKey)
        : "momentHomeCared";
      if (momentKey !== "momentHomeCared") prevKey = momentKey;

      return {
        id: e.id,
        primary: recentCareMomentLabel(zoneName, momentKey, t),
        whenLabel: formatCleaningWhen(e.created_at, now, locale, tCleaning)
      };
    });
}

/** Shared home overview model for Home Health (and future Cleaning embed). */
export function buildHomeOverviewModel(
  zones: CleaningZone[],
  events: EventItem[],
  homeHealth: HomeHealthScore | null,
  deps: { t: HomeHealthT; tCleaning: CleaningT; locale: string; now: Date }
): HomeOverviewModel | null {
  if (!homeHealth || zones.length === 0) return null;
  const { t, tCleaning, locale, now } = deps;
  return {
    lead: homeOverviewLead(homeHealth, t),
    footnote: homeOverviewFootnote(t),
    metrics: buildHomeSnapshotMetrics(zones, events, homeHealth, t, now),
    weekSeries: buildHomeWeekSeries(events, now),
    attentionZones: sortZonesNeedingAttention(zones),
    settledZones: sortSettledZones(zones),
    recentRows: buildRecentCareRows(events, zones, { now, locale, t, tCleaning })
  };
}
