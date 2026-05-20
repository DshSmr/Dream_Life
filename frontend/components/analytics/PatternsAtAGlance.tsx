"use client";

import type { PatternAnalytics } from "@/lib/analytics/visual/types";
import { buildPatternsGlanceInsights } from "@/lib/analytics/visual/patternsGlanceInsights";
import { RhythmHeatmapPreview } from "@/components/analytics/RhythmHeatmapPreview";
import { PatternsFocusGlance } from "@/components/analytics/PatternsFocusGlance";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PatternsStatCard } from "@/components/analytics/PatternsStatCard";
import type { LifeFlowDayPart } from "@/lib/timeline/types";

const BLOCK_SHELL =
  "rounded-ds-input bg-lifeos-muted/22 ring-1 ring-lifeos-border/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

function focusPartMessage(t: (key: string) => string, part: LifeFlowDayPart): string {
  if (part === "morning") return t("focusPartMorning");
  if (part === "afternoon") return t("focusPartAfternoon");
  if (part === "evening") return t("focusPartEvening");
  return t("focusPartNight");
}

function PatternsGlanceInsights({
  calmDays,
  busiestWeekday,
  focusDayPart,
  t
}: {
  calmDays: number;
  busiestWeekday: string | null;
  focusDayPart: LifeFlowDayPart | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const cards: { label: string; value: string }[] = [
    { label: t("calmDays"), value: String(calmDays) }
  ];
  if (busiestWeekday) {
    cards.push({ label: t("mostActiveDay"), value: busiestWeekday });
  }
  if (focusDayPart) {
    cards.push({ label: t("focusTiming"), value: focusPartMessage(t, focusDayPart) });
  }

  return (
    <div className="flex w-full min-w-[10.5rem] flex-col gap-3 md:min-w-0">
      {cards.map((card) => (
        <PatternsStatCard key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}

export function PatternsAtAGlance({
  patterns,
  className
}: {
  patterns: PatternAnalytics;
  className?: string;
}) {
  const { t, locale } = useTranslations("dashboard.patternsGlance");
  const insights = buildPatternsGlanceInsights(patterns, locale);
  const heatmapCells = patterns.activityHeatmap.flatMap((w) => w.cells);

  if (!insights.hasActivity) {
    return (
      <div className={cn("mx-auto w-full max-w-2xl px-ds-1", className)}>
        <div
          className={cn(
            BLOCK_SHELL,
            "px-ds-5 py-ds-6 text-center text-sm leading-relaxed text-lifeos-fg-muted"
          )}
        >
          {t("willAppear")}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-ds-1", className)}>
      <div className={cn(BLOCK_SHELL, "px-ds-5 py-ds-5 md:px-ds-6 md:py-ds-6")}>
        <div className="flex items-start justify-between gap-ds-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-lifeos-fg-secondary">
            {t("rhythm14")}
          </p>
          <Link
            href="/insights/patterns"
            className="shrink-0 text-xs font-medium text-lifeos-fg-muted underline-offset-2 transition-colors hover:text-lifeos-accent hover:underline"
          >
            {t("seePatterns")}
          </Link>
        </div>

        <div className="mt-ds-5 grid grid-cols-1 items-start gap-ds-6 md:grid-cols-[minmax(0,1.65fr)_minmax(11.5rem,1.2fr)] md:gap-ds-8">
          {/* Left: rhythm + focus */}
          <div className="min-w-0 space-y-ds-6">
            <RhythmHeatmapPreview cells={heatmapCells} />

            <div className="space-y-ds-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-lifeos-fg-secondary">
                {t("focusLately")}
              </p>
              <PatternsFocusGlance
                series={patterns.focusMinutesSeries}
                emptyMessage={t("focusEmpty")}
              />
            </div>
          </div>

          {/* Right: insight summaries */}
          <PatternsGlanceInsights
            calmDays={insights.calmDays}
            busiestWeekday={insights.busiestWeekday}
            focusDayPart={insights.focusDayPart}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
