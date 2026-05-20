"use client";

import type { DaySeries } from "@/lib/operational/metrics";
import { ChartRhythmPlaceholder } from "@/components/analytics/ChartRhythmPlaceholder";
import { PatternsQuietEmpty } from "@/components/analytics/PatternsQuietEmpty";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  accent: "bg-lifeos-accent/70",
  warm: "bg-lifeos-warning/55",
  calm: "bg-lifeos-success/50",
  muted: "bg-lifeos-fg-muted/45"
} as const;

export function CalmBarTrend({
  series,
  unit = "",
  tone = "accent",
  height = 52,
  showLabels = true,
  ariaLabel,
  emptyMessage,
  quietEmpty = false
}: {
  series: DaySeries;
  unit?: string;
  tone?: keyof typeof TONE_CLASS;
  height?: number;
  showLabels?: boolean;
  ariaLabel?: string;
  emptyMessage?: string;
  quietEmpty?: boolean;
}) {
  const { t } = useTranslations("insights.patterns");
  const max = Math.max(1, ...series.map((d) => d.value));
  const hasData = series.some((d) => d.value > 0);

  if (!hasData) {
    const msg = emptyMessage ?? t("chartPlaceholder");
    if (quietEmpty) return <PatternsQuietEmpty>{msg}</PatternsQuietEmpty>;
    return <ChartRhythmPlaceholder>{msg}</ChartRhythmPlaceholder>;
  }

  return (
    <div className="w-full" role="img" aria-label={ariaLabel ?? t("trendOverDays", { days: series.length })}>
      <div
        className="flex items-end gap-1 rounded-lg bg-lifeos-muted/22 px-1.5 pb-1.5 pt-2 ring-1 ring-inset ring-lifeos-border/10"
        style={{ height: height + 8 }}
      >
        {series.map((d) => {
          const pct = d.value <= 0 ? 6 : Math.max(14, Math.round((d.value / max) * 100));
          return (
            <div
              key={d.dayKey}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${d.value}${unit}`}
            >
              <div
                className={cn("w-full max-w-[2.25rem] rounded-t-md transition-all", TONE_CLASS[tone])}
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? 8 : 4, opacity: d.value > 0 ? 1 : 0.4 }}
              />
              {showLabels ? (
                <span className="text-[10px] font-medium text-lifeos-fg-muted">{d.label}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
