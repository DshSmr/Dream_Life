"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL, CleaningZone, EventItem } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { zoneCareLine } from "@/lib/cleaning/display";
import { buildHomeOverviewModel } from "@/lib/cleaning/homeOverview";
import { computeHomeHealthScore } from "@/lib/cleaningHealth";
import { homeHealthLevelClass } from "@/lib/semanticTone";
import { localCalendarDayKeyFromDate } from "@/lib/datetime";
import {
  ActivityRow,
  OperationalMetricBand,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalTwoColumn,
  RecentActivityBlock,
  WeeklyActivityRhythm
} from "@/components/operational/OperationalPrimitives";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui";
import { useTranslations } from "@/lib/i18n";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

export default function HomeHealthPageClient() {
  const { t, locale } = useTranslations("life.homeHealth");
  const { t: tCleaning } = useTranslations("life.cleaning");
  const { t: tCommon } = useTranslations();
  const [zones, setZones] = useState<CleaningZone[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const realtimeEpoch = useLifeOsRealtimeEpoch();
  const todayKey = localCalendarDayKeyFromDate(now);

  const loadZones = useCallback(async () => {
    const response = await fetch(`${API_URL}/cleaning/zones`, { cache: "no-store" });
    if (!response.ok) throw new Error("zones");
    setZones(await response.json());
  }, []);

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
    if (!response.ok) throw new Error("events");
    const raw = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    setEvents(normalizeAnalyticsEvents(raw));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadZones(), loadEvents()]);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [loadZones, loadEvents, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    void load();
  }, [realtimeEpoch, load]);

  const homeHealth = useMemo(() => computeHomeHealthScore(zones), [zones]);

  const overview = useMemo(
    () =>
      buildHomeOverviewModel(zones, events, homeHealth, {
        t,
        tCleaning,
        locale,
        now
      }),
    [zones, events, homeHealth, t, tCleaning, locale, now]
  );

  const weekdayShort = useCallback(
    (dayKey: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
      if (!m) return dayKey;
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      const tag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
      return d.toLocaleDateString(tag, { weekday: "short" }).slice(0, 2);
    },
    [locale]
  );

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
          trailing={
            <Link
              href="/life/cleaning"
              className={cn(buttonVariants({ variant: "secondary", size: "md" }), "inline-flex shrink-0")}
            >
              {tCommon("common.openCleaning")}
            </Link>
          }
        />

        {error ? <p className="text-sm text-lifeos-danger">{error}</p> : null}
        {loading ? <PageSectionSkeleton /> : null}

        {!loading && !error && zones.length === 0 ? (
          <CalmEmptyState
            tone="cleaning"
            size="comfortable"
            title={tCommon("empty.homeHealth.title")}
            description={tCommon("empty.homeHealth.description")}
          >
            <Link
              href="/life/cleaning"
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "inline-flex")}
            >
              {tCommon("common.openCleaning")}
            </Link>
          </CalmEmptyState>
        ) : null}

        {!loading && !error && overview ? (
          <>
            <div className="rounded-ds-card bg-gradient-to-br from-lifeos-muted/30 via-lifeos-card/90 to-lifeos-inset/25 px-ds-5 py-ds-5 ring-1 ring-lifeos-border/25 shadow-inner">
              <p className="text-xl font-medium leading-relaxed text-lifeos-fg md:text-[1.35rem]">
                {overview.lead}
              </p>
              <p className="mt-ds-2 text-sm leading-relaxed text-lifeos-fg-muted">{overview.footnote}</p>
              <WeeklyActivityRhythm
                series={overview.weekSeries}
                ariaLabel={t("weekRhythmAria")}
                dayTitle={(d) => `${d.label}: ${d.value}`}
                weekdayShort={weekdayShort}
                todayKey={todayKey}
              />
            </div>

            <OperationalMetricBand>
              <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-4">
                <OperationalMetricCell
                  label={t("metricRecentlyCared")}
                  value={overview.metrics.recentlyCared}
                  hint={overview.metrics.recentlyCaredHint}
                />
                <OperationalMetricCell
                  label={t("metricDueSoon")}
                  value={overview.metrics.dueSoon}
                  hint={overview.metrics.dueSoonHint}
                  valueClassName={
                    overview.metrics.dueSoon !== t("metricDueSoonClear")
                      ? "text-lifeos-warning"
                      : undefined
                  }
                />
                <OperationalMetricCell
                  label={t("metricComfortRhythm")}
                  value={overview.metrics.comfortRhythm}
                  valueClassName={homeHealth ? homeHealthLevelClass(homeHealth.level) : undefined}
                />
                <OperationalMetricCell
                  label={t("metricSpacesTracked")}
                  value={overview.metrics.spacesTracked}
                  hint={overview.metrics.spacesTrackedHint}
                />
              </div>
            </OperationalMetricBand>

            <OperationalTwoColumn
              main={
                <>
                  {overview.attentionZones.length > 0 ? (
                    <RecentActivityBlock title={t("areasNeedingAttention")}>
                      {overview.attentionZones.map((z) => (
                        <ActivityRow
                          key={z.id}
                          primary={z.name}
                          secondary={zoneCareLine(z, tCleaning)}
                        />
                      ))}
                    </RecentActivityBlock>
                  ) : null}

                  {overview.attentionZones.length === 0 && overview.settledZones.length > 0 ? (
                    <RecentActivityBlock title={t("spacesSettled")}>
                      {overview.settledZones.map((z) => (
                        <ActivityRow
                          key={z.id}
                          primary={z.name}
                          secondary={zoneCareLine(z, tCleaning)}
                        />
                      ))}
                    </RecentActivityBlock>
                  ) : null}

                  {overview.attentionZones.length > 0 && overview.settledZones.length > 0 ? (
                    <RecentActivityBlock title={t("spacesSettled")}>
                      {overview.settledZones.slice(0, 4).map((z) => (
                        <ActivityRow
                          key={z.id}
                          primary={z.name}
                          secondary={zoneCareLine(z, tCleaning)}
                        />
                      ))}
                    </RecentActivityBlock>
                  ) : null}

                  {overview.attentionZones.length === 0 && overview.settledZones.length === 0 ? (
                    <p className="text-sm leading-relaxed text-lifeos-fg-muted">{t("allSteady")}</p>
                  ) : null}
                </>
              }
              aside={
                <RecentActivityBlock
                  title={t("recentHomeCare")}
                  empty={
                    overview.recentRows.length === 0 ? (
                      <p className="text-sm leading-relaxed text-lifeos-fg-muted">{t("noRecent")}</p>
                    ) : undefined
                  }
                >
                  {overview.recentRows.map((row) => (
                    <ActivityRow key={row.id} primary={row.primary} secondary={row.whenLabel} />
                  ))}
                </RecentActivityBlock>
              }
            />
          </>
        ) : null}
      </section>
    </div>
  );
}
