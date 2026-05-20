"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, type DailyReview, EventItem } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { LifeFlowStream } from "@/components/timeline/LifeFlowStream";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { MutedText, PageTitle } from "@/components/ui/typography";
import { buildLifeFlowStream } from "@/lib/timeline";
import { createLifeFlowT } from "@/lib/timeline/lifeFlowCopy";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";
import { useUserPreferencesEpoch } from "@/hooks/useUserPreferencesEpoch";

const FLOW_DAY_SPAN_OPTIONS = [7, 14, 30] as const;

export default function LifeFlowPage() {
  const { t, locale } = useTranslations("insights.lifeFlow");
  const { t: tEmpty } = useTranslations();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reviews, setReviews] = useState<DailyReview[]>([]);
  const [daySpan, setDaySpan] = useState<(typeof FLOW_DAY_SPAN_OPTIONS)[number]>(14);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const realtimeEpoch = useLifeOsRealtimeEpoch();
  const prefsEpoch = useUserPreferencesEpoch();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/events?limit=500`, { cache: "no-store" }),
        fetch(`${API_URL}/ai/reviews?limit=30`, { cache: "no-store" })
      ]);
      if (!eventsRes.ok) throw new Error("events");
      const raw = (await eventsRes.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
      setEvents(normalizeAnalyticsEvents(raw));
      if (reviewsRes.ok) {
        const rev = (await reviewsRes.json()) as DailyReview[];
        setReviews(Array.isArray(rev) ? rev : []);
      } else {
        setReviews([]);
      }
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

  const flowT = useMemo(() => createLifeFlowT(locale), [locale]);

  const days = useMemo(
    () => buildLifeFlowStream({ events, reviews, daySpan, locale, t: flowT }),
    [events, reviews, daySpan, prefsEpoch, flowT, locale]
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-ds-8 py-ds-2">
      <header className="space-y-ds-2">
        <PageTitle>{t("pageTitle")}</PageTitle>
        <MutedText className={ds.typography.proseMax}>{t("pageDescription")}</MutedText>
      </header>

      <div className="flex flex-wrap items-center gap-ds-2">
        <span className={cn(ds.typography.uiLabel, "mr-ds-1 text-lifeos-fg-muted")}>{t("showing")}</span>
        {FLOW_DAY_SPAN_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDaySpan(n)}
            className={cn(
              "rounded-full px-ds-3 py-ds-1.5 text-sm transition-colors",
              daySpan === n
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

      {!loading && !error && days.length === 0 ? (
          <CalmEmptyState
            tone="timeline"
            size="comfortable"
            title={tEmpty("empty.lifeFlow.title")}
            description={tEmpty("empty.lifeFlow.description")}
          />
      ) : null}

      {!loading && !error && days.length > 0 ? <LifeFlowStream days={days} /> : null}
    </div>
  );
}
