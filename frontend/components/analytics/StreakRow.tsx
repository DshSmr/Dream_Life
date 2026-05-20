"use client";

import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StreakRow({
  label,
  days,
  dayKeys,
  activeDays
}: {
  label: string;
  days: number;
  dayKeys: string[];
  activeDays: Set<string>;
}) {
  const { t } = useTranslations("insights.patterns");

  return (
    <div className="flex flex-col gap-ds-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-lifeos-fg">{label}</p>
        <p className="text-sm text-lifeos-fg-muted">
          {days === 0 ? t("noStreak") : days === 1 ? t("oneDayStreak") : t("daysStreak", { count: days })}
        </p>
      </div>
      <div className="flex gap-1" aria-hidden>
        {dayKeys.map((key) => {
          const on = activeDays.has(key);
          return (
            <span
              key={key}
              className={cn(
                "size-2.5 rounded-full transition-colors",
                on ? "bg-lifeos-accent/75 ring-2 ring-lifeos-accent/25" : "bg-lifeos-muted/55"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
