"use client";

import type { DaySeries } from "@/lib/operational/metrics";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BAR_TONE = "bg-lifeos-accent/65";

export function PatternsFocusGlance({
  series,
  emptyMessage,
  className
}: {
  series: DaySeries;
  emptyMessage?: string;
  className?: string;
}) {
  const { t } = useTranslations("dashboard.patternsGlance");
  const last14 = series.slice(-14);
  const max = Math.max(1, ...last14.map((d) => d.value));
  const hasData = last14.some((d) => d.value > 0);

  if (!hasData) {
    const msg = emptyMessage ?? t("focusEmpty");
    return (
      <p className={cn("text-sm leading-relaxed text-lifeos-fg-muted", className)}>{msg}</p>
    );
  }

  return (
    <div
      className={cn(
        "flex h-14 items-end gap-1 rounded-lg bg-lifeos-muted/28 px-2 pb-1.5 pt-2 ring-1 ring-inset ring-lifeos-border/12",
        className
      )}
      role="img"
      aria-label={t("recentFocus")}
    >
      {last14.map((d) => {
        const h = d.value <= 0 ? 8 : Math.max(12, Math.round((d.value / max) * 100));
        return (
          <div
            key={d.dayKey}
            className="flex min-w-0 flex-1 items-end justify-center"
            title={`${d.label}: ${d.value}`}
          >
            <div
              className={cn("w-full max-w-[18px] rounded-[3px]", BAR_TONE)}
              style={{
                height: `${h}%`,
                minHeight: d.value > 0 ? 8 : 5,
                opacity: d.value > 0 ? 1 : 0.45
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
