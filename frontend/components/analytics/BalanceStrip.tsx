"use client";

import type { ActivityBalance } from "@/lib/analytics/visual/types";
import { ChartRhythmPlaceholder } from "@/components/analytics/ChartRhythmPlaceholder";
import { PatternsQuietEmpty } from "@/components/analytics/PatternsQuietEmpty";
import { useTranslations } from "@/lib/i18n";

const SEGMENT_KEYS = [
  { key: "work" as const, className: "bg-lifeos-accent/60" },
  { key: "home" as const, className: "bg-lifeos-success/50" },
  { key: "finance" as const, className: "bg-lifeos-warning/48" }
] as const;

export function BalanceStrip({
  balance,
  quietEmpty = false
}: {
  balance: ActivityBalance;
  quietEmpty?: boolean;
}) {
  const { t } = useTranslations("insights.patterns");
  const total = balance.work + balance.home + balance.finance;
  const empty = total === 0;

  const segments = SEGMENT_KEYS.map((seg) => ({
    ...seg,
    label: seg.key === "work" ? t("work") : seg.key === "home" ? t("home") : t("money")
  }));

  if (empty) {
    if (quietEmpty) return <PatternsQuietEmpty>{t("chartPlaceholderBalance")}</PatternsQuietEmpty>;
    return <ChartRhythmPlaceholder>{t("chartPlaceholderBalance")}</ChartRhythmPlaceholder>;
  }

  return (
    <div className="space-y-ds-3">
      <div
        className="flex h-3.5 overflow-hidden rounded-full bg-lifeos-muted/35"
        role="img"
        aria-label={t("activityBalance", {
          work: balance.work,
          home: balance.home,
          money: balance.finance
        })}
      >
        {segments.map((seg) => {
          const pct = balance[seg.key];
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className={`h-full ${seg.className}`}
              style={{ width: `${pct}%` }}
              title={`${seg.label} ${pct}%`}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-ds-5 gap-y-ds-2 text-sm text-lifeos-fg-secondary">
        {segments.map((seg) => (
          <li key={seg.key} className="flex items-center gap-ds-2">
            <span className={`size-2.5 rounded-full ${seg.className}`} aria-hidden />
            {seg.label}
            <span className="tabular-nums text-lifeos-fg-muted">{`${balance[seg.key]}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
