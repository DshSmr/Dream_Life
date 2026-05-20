"use client";

import type { HeatmapWeek } from "@/lib/analytics/visual/types";
import { ChartRhythmPlaceholder } from "@/components/analytics/ChartRhythmPlaceholder";
import { PatternsQuietEmpty } from "@/components/analytics/PatternsQuietEmpty";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  HEATMAP_GLANCE_LEVEL_CLASS,
  HEATMAP_LEVEL_CLASS
} from "@/lib/analytics/visual/heatmapLevels";

export function ContributionGrid({
  weeks,
  variant = "default",
  quietEmpty = false
}: {
  weeks: HeatmapWeek[];
  variant?: "default" | "hero";
  quietEmpty?: boolean;
}) {
  const { t } = useTranslations("insights.patterns");
  const hasData = weeks.some((w) => w.cells.some((c) => c.level > 0));
  const isHero = variant === "hero";
  const levelClass = isHero ? HEATMAP_GLANCE_LEVEL_CLASS : HEATMAP_LEVEL_CLASS;
  const cellClass = isHero
    ? "size-[18px] rounded-[5px] sm:size-5"
    : "size-4 rounded-[4px] sm:size-[1.125rem]";
  const gapClass = isHero ? "gap-2" : "gap-1.5";

  if (!hasData) {
    if (quietEmpty) {
      return <PatternsQuietEmpty>{t("chartPlaceholder")}</PatternsQuietEmpty>;
    }
    return <ChartRhythmPlaceholder>{t("chartPlaceholder")}</ChartRhythmPlaceholder>;
  }

  return (
    <div className={cn("space-y-ds-3", isHero && "space-y-ds-4")}>
      <div className={cn("flex", gapClass)} role="img" aria-label={t("heatmapAria")}>
        {weeks.map((week) => (
          <div key={week.weekIndex} className={cn("flex flex-col", gapClass)}>
            {week.cells.map((cell) => (
              <span
                key={cell.dayKey}
                title={cell.title}
                className={cn(
                  cellClass,
                  "shrink-0 ring-1 ring-inset ring-lifeos-border/15",
                  levelClass[cell.level]
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-lifeos-fg-muted">
        <span>{t("legendLower")}</span>
        <div className="flex gap-1">
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span
              key={l}
              className={cn(isHero ? "size-3.5 rounded-[4px]" : "size-3 rounded-[3px]", levelClass[l])}
              aria-hidden
            />
          ))}
        </div>
        <span>{t("legendHigher")}</span>
      </div>
    </div>
  );
}
