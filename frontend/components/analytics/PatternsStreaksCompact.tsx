"use client";

import { PatternsStatCard } from "@/components/analytics/PatternsStatCard";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function streakLabel(days: number, t: (key: string, v?: Record<string, number>) => string): string {
  if (days === 0) return t("noStreak");
  if (days === 1) return t("oneDayStreak");
  return t("daysStreak", { count: days });
}

export function PatternsStreaksCompact({
  dayKeys,
  focusDays,
  cleaningDays,
  taskDays,
  focusActive,
  cleaningActive,
  taskActive,
  className
}: {
  dayKeys: string[];
  focusDays: number;
  cleaningDays: number;
  taskDays: number;
  focusActive: Set<string>;
  cleaningActive: Set<string>;
  taskActive: Set<string>;
  className?: string;
}) {
  const { t } = useTranslations("insights.patterns");

  const rows = [
    { key: "focus", label: t("streakFocus"), days: focusDays, active: focusActive },
    { key: "cleaning", label: t("streakCleaning"), days: cleaningDays, active: cleaningActive },
    { key: "tasks", label: t("streakTasks"), days: taskDays, active: taskActive }
  ] as const;

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {rows.map((row) => (
        <div key={row.key} className="min-w-0">
          <PatternsStatCard label={row.label} value={streakLabel(row.days, t)} />
          <div className="mt-ds-2.5 flex flex-wrap gap-0.5 px-1" aria-hidden>
            {dayKeys.map((key) => {
              const on = row.active.has(key);
              return (
                <span
                  key={key}
                  className={cn(
                    "size-2 rounded-full",
                    on ? "bg-lifeos-accent/70" : "bg-lifeos-muted/55"
                  )}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
