"use client";

import type { DaySeries } from "@/lib/operational/metrics";
import { ChartRhythmPlaceholder } from "@/components/analytics/ChartRhythmPlaceholder";
import { useTranslations } from "@/lib/i18n";

export function SoftSparkline({
  series,
  ariaLabel,
  emptyMessage
}: {
  series: DaySeries;
  ariaLabel?: string;
  emptyMessage?: string;
}) {
  const { t } = useTranslations("insights.patterns");
  const hasData = series.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <ChartRhythmPlaceholder className="min-h-[3.5rem]">
        {emptyMessage ?? t("chartPlaceholderFocus")}
      </ChartRhythmPlaceholder>
    );
  }

  const w = 280;
  const h = 56;
  const pad = 6;
  const max = Math.max(1, ...series.map((d) => d.value));
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;

  const points = series.map((d, i) => {
    const x = pad + i * step;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, value: d.value };
  });

  const line =
    points.length > 0
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")
      : "";

  const area =
    points.length > 1
      ? `${line} L ${points[points.length - 1]!.x.toFixed(1)} ${h - pad} L ${points[0]!.x.toFixed(1)} ${h - pad} Z`
      : "";

  const baselineY = h - pad;

  return (
    <div className="rounded-lg bg-lifeos-muted/15 px-1 py-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-w-md text-lifeos-accent"
        role="img"
        aria-label={ariaLabel ?? t("energyTrendAria")}
      >
        <line
          x1={pad}
          y1={baselineY}
          x2={w - pad}
          y2={baselineY}
          stroke="currentColor"
          strokeWidth="1"
          className="text-lifeos-border/80"
        />
        {area ? <path d={area} fill="currentColor" className="text-lifeos-accent/18" /> : null}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-lifeos-accent/85"
          />
        ) : null}
        {points
          .filter((p) => p.value > 0)
          .map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="currentColor"
              className="text-lifeos-accent/90"
            />
          ))}
      </svg>
    </div>
  );
}
