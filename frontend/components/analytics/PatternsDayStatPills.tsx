"use client";

import { PatternsStatCard } from "@/components/analytics/PatternsStatCard";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function PatternsDayStatPills({
  counts,
  busiestDayLabel,
  className
}: {
  counts: { quiet: number; balanced: number; full: number };
  busiestDayLabel?: string | null;
  className?: string;
}) {
  const { t } = useTranslations("insights.patterns");

  const stats: { key: string; label: string; value: string }[] = [
    { key: "quiet", label: t("legendCalm"), value: String(counts.quiet) },
    { key: "balanced", label: t("legendSteady"), value: String(counts.balanced) },
    { key: "full", label: t("legendActive"), value: String(counts.full) }
  ];

  if (busiestDayLabel) {
    stats.push({ key: "busiest", label: t("pillBusiest"), value: busiestDayLabel });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
      role="list"
    >
      {stats.map((stat) => (
        <div key={stat.key} role="listitem" className="min-w-0">
          <PatternsStatCard label={stat.label} value={stat.value} />
        </div>
      ))}
    </div>
  );
}
