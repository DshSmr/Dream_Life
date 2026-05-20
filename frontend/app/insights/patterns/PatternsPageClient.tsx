"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, EventItem } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { buildPatternAnalytics, type PatternSpan } from "@/lib/analytics/visual";
import { BalanceStrip } from "@/components/analytics/BalanceStrip";
import { CalmBarTrend } from "@/components/analytics/CalmBarTrend";
import { ContributionGrid } from "@/components/analytics/ContributionGrid";
import { PatternsCard } from "@/components/analytics/PatternsCard";
import { PatternsDayStatPills } from "@/components/analytics/PatternsDayStatPills";
import { PatternsQuietEmpty } from "@/components/analytics/PatternsQuietEmpty";
import { PatternsStreaksCompact } from "@/components/analytics/PatternsStreaksCompact";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { MutedText, PageTitle } from "@/components/ui/typography";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

const SPAN_OPTIONS: PatternSpan[] = [7, 14, 28];

export default function PatternsPageClient() {
  const { t } = useTranslations("insights.patterns");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [span, setSpan] = useState<PatternSpan>(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
      if (!res.ok) throw new Error("events");
      const raw = (await res.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
      setEvents(normalizeAnalyticsEvents(raw));
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    void load();
  }, [realtimeEpoch, load]);

  const patterns = useMemo(() => buildPatternAnalytics(events, span), [events, span]);

  const hasSignal = useMemo(
    () => patterns.activityHeatmap.some((w) => w.cells.some((c) => c.level > 0)),
    [patterns]
  );

  const hasFocusData = useMemo(
    () => patterns.focusMinutesSeries.some((d) => d.value > 0),
    [patterns]
  );

  const hasSpendData = useMemo(() => patterns.spendSeries.some((d) => d.value > 0), [patterns]);

  const hasHomeData = useMemo(() => patterns.cleaningSeries.some((d) => d.value > 0), [patterns]);

  const hasBalanceData = useMemo(() => {
    const b = patterns.weeklyBalance;
    return b.work + b.home + b.finance > 0;
  }, [patterns.weeklyBalance]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-ds-6 py-ds-1">
      <header className="space-y-ds-2">
        <PageTitle>{t("pageTitle")}</PageTitle>
        <MutedText className={ds.typography.proseMax}>{t("pageDescription")}</MutedText>
      </header>

      <div className="flex flex-wrap items-center gap-ds-2">
        <span className={cn(ds.typography.uiLabel, "mr-ds-1 text-lifeos-fg-muted")}>{t("range")}</span>
        {SPAN_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setSpan(n)}
            className={cn(
              "rounded-full px-ds-3 py-ds-1.5 text-sm transition-colors",
              span === n
                ? "bg-lifeos-accent/12 font-medium text-lifeos-fg"
                : "text-lifeos-fg-muted hover:bg-lifeos-muted/40 hover:text-lifeos-fg-secondary"
            )}
          >
            {t("daysOption", { days: n })}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-lifeos-danger">{error}</p> : null}
      {loading ? <PageSectionSkeleton /> : null}

      {!loading && !error ? (
        <div className="space-y-ds-6">
          {!hasSignal ? (
            <PatternsQuietEmpty className="rounded-ds-card bg-lifeos-muted/12 px-ds-4 py-ds-4 ring-1 ring-lifeos-border/15">
              {t("pageEmptyHint")}
            </PatternsQuietEmpty>
          ) : null}

          <PatternsCard title={t("lifeRhythm")} hint={t("lifeRhythmHint")} hero>
            <ContributionGrid
              weeks={patterns.activityHeatmap}
              variant="hero"
              quietEmpty
            />
            {hasSignal ? (
              <PatternsDayStatPills
                counts={patterns.dayLoadCounts}
                busiestDayLabel={patterns.busiestDayLabel}
                className="mt-ds-6"
              />
            ) : null}
          </PatternsCard>

          <div className="grid gap-ds-4 md:grid-cols-2">
            <PatternsCard title={t("focusRhythm")} hint={t("focusRhythmHint")}>
              {hasFocusData ? (
                <CalmBarTrend
                  series={patterns.focusMinutesSeries}
                  unit=" min"
                  tone="accent"
                  height={48}
                  showLabels={false}
                  ariaLabel={t("focusByDay")}
                  quietEmpty
                />
              ) : (
                <PatternsQuietEmpty>{t("chartPlaceholderFocus")}</PatternsQuietEmpty>
              )}
            </PatternsCard>

            <PatternsCard title={t("weekdayRhythm")} hint={t("weekdayRhythmHint")}>
              {patterns.weeklyFocusRhythm.some((d) => d.value > 0) ? (
                <CalmBarTrend
                  series={patterns.weeklyFocusRhythm}
                  unit=" min"
                  tone="accent"
                  height={44}
                  showLabels
                  ariaLabel={t("focusByWeekday")}
                  quietEmpty
                />
              ) : (
                <PatternsQuietEmpty>{t("chartPlaceholderFocus")}</PatternsQuietEmpty>
              )}
            </PatternsCard>
          </div>

          <div className="grid gap-ds-4 md:grid-cols-2">
            <PatternsCard title={t("spendingRhythm")} hint={t("spendingRhythmHint")}>
              {hasSpendData ? (
                <CalmBarTrend
                  series={patterns.spendSeries}
                  unit="€"
                  tone="warm"
                  height={44}
                  showLabels={false}
                  ariaLabel={t("spendingByDay")}
                  quietEmpty
                />
              ) : (
                <PatternsQuietEmpty>{t("chartPlaceholderSpend")}</PatternsQuietEmpty>
              )}
            </PatternsCard>

            <PatternsCard title={t("homeCadence")} hint={t("homeCadenceHint")}>
              {hasHomeData ? (
                <CalmBarTrend
                  series={patterns.cleaningSeries}
                  unit=""
                  tone="calm"
                  height={44}
                  showLabels={false}
                  ariaLabel={t("cleaningByDay")}
                  quietEmpty
                />
              ) : (
                <PatternsQuietEmpty>{t("chartPlaceholderHome")}</PatternsQuietEmpty>
              )}
            </PatternsCard>
          </div>

          <PatternsCard title={t("streaks")} hint={t("streaksHint")}>
            {hasBalanceData ? (
              <div className="space-y-ds-3">
                <p className="text-xs text-lifeos-fg-muted">{t("energyBalance")}</p>
                <BalanceStrip balance={patterns.weeklyBalance} quietEmpty />
              </div>
            ) : (
              <PatternsQuietEmpty className="mb-ds-4">{t("chartPlaceholderBalance")}</PatternsQuietEmpty>
            )}
            <PatternsStreaksCompact
              dayKeys={patterns.dayKeys}
              focusDays={patterns.streaks.focus}
              cleaningDays={patterns.streaks.cleaning}
              taskDays={patterns.streaks.tasks}
              focusActive={patterns.focusActiveDays}
              cleaningActive={patterns.cleaningActiveDays}
              taskActive={patterns.taskActiveDays}
              className={hasBalanceData ? "mt-ds-5" : undefined}
            />
          </PatternsCard>
        </div>
      ) : null}

      {!loading ? <MutedText className="text-lifeos-caption">{t("footnote")}</MutedText> : null}
    </div>
  );
}
