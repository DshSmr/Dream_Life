"use client";

import type { DayLoadCell, DayLoadKind } from "@/lib/analytics/visual/types";
import { ChartRhythmPlaceholder } from "@/components/analytics/ChartRhythmPlaceholder";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LOAD_CLASS: Record<DayLoadKind, string> = {
  quiet: "bg-lifeos-muted/50 ring-1 ring-lifeos-border/30",
  balanced: "bg-lifeos-accent/42 ring-1 ring-lifeos-accent/15",
  full: "bg-lifeos-accent/68 ring-1 ring-lifeos-accent/25"
};

export function DayLoadStrip({
  cells,
  counts
}: {
  cells: DayLoadCell[];
  counts: { quiet: number; balanced: number; full: number };
}) {
  const { t } = useTranslations("insights.patterns");
  const hasData = cells.length > 0;

  if (!hasData) {
    return <ChartRhythmPlaceholder>{t("chartPlaceholderDayRhythm")}</ChartRhythmPlaceholder>;
  }

  return (
    <div className="space-y-ds-3">
      <div
        className="flex flex-wrap gap-1"
        role="img"
        aria-label={t("dayRhythm", {
          quiet: counts.quiet,
          balanced: counts.balanced,
          full: counts.full
        })}
      >
        {cells.map((cell) => (
          <span
            key={cell.dayKey}
            title={cell.title}
            className={cn("h-3 min-w-[7px] max-w-5 flex-1 rounded-sm", LOAD_CLASS[cell.kind])}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-ds-5 gap-y-ds-1 text-sm text-lifeos-fg-secondary">
        <li className="flex items-center gap-ds-2">
          <span className={cn("size-2.5 rounded-sm", LOAD_CLASS.quiet)} aria-hidden />
          {t("legendCalm")} · {counts.quiet}
        </li>
        <li className="flex items-center gap-ds-2">
          <span className={cn("size-2.5 rounded-sm", LOAD_CLASS.balanced)} aria-hidden />
          {t("legendSteady")} · {counts.balanced}
        </li>
        <li className="flex items-center gap-ds-2">
          <span className={cn("size-2.5 rounded-sm", LOAD_CLASS.full)} aria-hidden />
          {t("legendActive")} · {counts.full}
        </li>
      </ul>
    </div>
  );
}
