"use client";

import type { HeatmapCell } from "@/lib/analytics/visual/types";
import { HEATMAP_GLANCE_LEVEL_CLASS } from "@/lib/analytics/visual/heatmapLevels";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Fixed cells — contribution-style rhythm grid with room to breathe. */
const CELL = "size-[17px] shrink-0 rounded-[5px] sm:size-[18px]";

/** Last 14 days as a fixed 7×2 rhythm grid for dashboard glance. */
export function RhythmHeatmapPreview({ cells, className }: { cells: HeatmapCell[]; className?: string }) {
  const { t } = useTranslations("dashboard.patternsGlance");
  const last14 = cells.slice(-14);
  const padded: HeatmapCell[] =
    last14.length >= 14
      ? last14
      : [
          ...Array.from({ length: 14 - last14.length }, (_, i) => ({
            dayKey: `pad-${i}`,
            level: 0 as const,
            title: ""
          })),
          ...last14
        ];

  const rowA = padded.slice(0, 7);
  const rowB = padded.slice(7, 14);

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="inline-grid grid-rows-2 gap-1.5"
        role="img"
        aria-label={t("heatmapAria")}
      >
        {[rowA, rowB].map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-2">
            {row.map((cell) => (
              <span
                key={cell.dayKey}
                title={cell.title || undefined}
                className={cn(
                  CELL,
                  "ring-1 ring-inset ring-lifeos-border/15",
                  HEATMAP_GLANCE_LEVEL_CLASS[cell.level]
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-ds-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className="text-[11px] text-lifeos-fg-muted">{t("legendCalm")}</span>
        <span className={cn(CELL, HEATMAP_GLANCE_LEVEL_CLASS[0])} aria-hidden />
        <span className="text-[11px] text-lifeos-fg-muted">{t("legendBalanced")}</span>
        <span className={cn(CELL, HEATMAP_GLANCE_LEVEL_CLASS[2])} aria-hidden />
        <span className="text-[11px] text-lifeos-fg-muted">{t("legendActive")}</span>
        <span className={cn(CELL, HEATMAP_GLANCE_LEVEL_CLASS[4])} aria-hidden />
      </div>
    </div>
  );
}
