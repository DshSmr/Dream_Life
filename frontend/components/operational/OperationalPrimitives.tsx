"use client";

import type { ReactNode } from "react";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { MetricLabel, MetricValue, MutedText, PageTitle } from "@/components/ui/typography";
import type { DaySeries } from "@/lib/operational/metrics";

export function OperationalPageHeader({
  title,
  description,
  trailing
}: {
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-ds-3">
      <div>
        <PageTitle className="text-lifeos-section md:text-lifeos-card-title">{title}</PageTitle>
        <MutedText className="mt-ds-2 max-w-[62ch]">{description}</MutedText>
      </div>
      {trailing}
    </div>
  );
}

export function OperationalMetricBand({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(ds.surfaces.metricBand, className)}>{children}</div>;
}

export function OperationalMetricCell({
  label,
  value,
  hint,
  valueClassName
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 space-y-ds-1">
      <MetricLabel>{label}</MetricLabel>
      <MetricValue className={cn("text-xl md:text-2xl", valueClassName)}>{value}</MetricValue>
      {hint ? <p className={cn(ds.typography.caption, "text-lifeos-fg-muted")}>{hint}</p> : null}
    </div>
  );
}

export function OperationalStatePanel({
  title = "Current state",
  children,
  tone = "default"
}: {
  title?: string;
  children: ReactNode;
  tone?: "default" | "active" | "caution";
}) {
  const shell =
    tone === "active"
      ? "bg-lifeos-warning-muted/12 ring-1 ring-lifeos-warning/30"
      : tone === "caution"
        ? "bg-lifeos-danger-muted/10 ring-1 ring-lifeos-status-risk-border/40"
        : "bg-lifeos-card/60 ring-1 ring-lifeos-domain-ai-border/40";
  return (
    <div className={cn("rounded-ds-card px-ds-4 py-ds-4 shadow-inner", shell)}>
      <p className={ds.typography.sectionEyebrow}>{title}</p>
      <div className="mt-ds-3">{children}</div>
    </div>
  );
}

/** Seven-day completion rhythm — full-width strip; hidden when the week is empty. */
export function WeeklyActivityRhythm({
  series,
  ariaLabel,
  dayTitle,
  weekdayShort,
  todayKey
}: {
  series: DaySeries;
  ariaLabel: string;
  dayTitle: (day: DaySeries[number]) => string;
  weekdayShort: (dayKey: string) => string;
  todayKey: string;
}) {
  if (!series.some((d) => d.value > 0)) return null;

  return (
    <div
      className="mt-ds-4 w-full rounded-ds-input bg-lifeos-inset/40 px-ds-2 py-ds-2.5 sm:px-ds-3"
      role="img"
      aria-label={ariaLabel}
    >
      <div className="grid grid-cols-7 gap-0.5">
        {series.map((d) => {
          const isToday = d.dayKey === todayKey;
          const active = d.value > 0;
          return (
            <div
              key={d.dayKey}
              className="flex min-w-0 flex-col items-center gap-1"
              title={dayTitle(d)}
            >
              <div className="flex h-4 w-full items-end justify-center">
                <span
                  className={cn(
                    "block w-[6px] max-w-full rounded-full sm:w-[7px]",
                    active ? "h-3 bg-lifeos-accent/45" : "h-px w-4 max-w-none bg-lifeos-border/35",
                    isToday && active && "bg-lifeos-accent/65",
                    isToday && !active && "bg-lifeos-border/50"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none text-lifeos-fg-muted/60",
                  isToday && "text-lifeos-fg-secondary"
                )}
              >
                {weekdayShort(d.dayKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniDayTrend({ series, unit = "" }: { series: DaySeries; unit?: string }) {
  const max = Math.max(1, ...series.map((d) => d.value));
  return (
    <div className="mt-ds-3">
      <div className="flex h-10 items-end gap-1" role="img" aria-label="Last 7 days trend">
        {series.map((d) => (
          <div
            key={d.dayKey}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
            title={`${d.label}: ${d.value}${unit}`}
          >
            <div
              className="w-full min-h-[3px] rounded-sm bg-lifeos-accent/70"
              style={{ height: `${Math.max(12, Math.round((d.value / max) * 100))}%` }}
            />
            <span className="text-[10px] font-medium text-lifeos-fg-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecentActivityBlock({
  title,
  children,
  empty
}: {
  title: string;
  children: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h2 className={ds.typography.sectionTitle}>{title}</h2>
      <div className="mt-ds-3 space-y-ds-2">{children}</div>
      {empty}
    </div>
  );
}

export function ActivityRow({
  primary,
  secondary,
  action
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-ds-4 gap-y-ds-2 rounded-ds-input bg-lifeos-muted/25 px-ds-3 py-ds-2.5 shadow-inner">
      <div className="min-w-0">
        <p className="font-medium text-lifeos-fg">{primary}</p>
        {secondary ? <p className="mt-0.5 text-sm text-lifeos-fg-muted">{secondary}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CollapsibleQuickForm({
  label,
  children,
  defaultOpen = false,
  hideExpandGlyph = false
}: {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** When true, omit the trailing +/− so the summary is a plain text label. */
  hideExpandGlyph?: boolean;
}) {
  return (
    <details className={cn(ds.card.secondary, "!mt-0 group")} open={defaultOpen || undefined}>
      <summary className="cursor-pointer list-none text-sm font-medium text-lifeos-fg-secondary [&::-webkit-details-marker]:hidden">
        <span className="text-lifeos-accent group-open:text-lifeos-fg">{label}</span>
        {hideExpandGlyph ? null : (
          <>
            <span className="ml-ds-2 text-lifeos-fg-muted group-open:hidden">+</span>
            <span className="ml-ds-2 hidden text-lifeos-fg-muted group-open:inline">−</span>
          </>
        )}
      </summary>
      <div className="mt-ds-4 border-t border-lifeos-border-subtle/20 pt-ds-4">{children}</div>
    </details>
  );
}

export function OperationalTwoColumn({
  main,
  aside,
  className
}: {
  main: ReactNode;
  aside: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-ds-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,32%)] lg:items-start", className)}>
      <div className="min-w-0 space-y-ds-5">{main}</div>
      <aside className="min-w-0 space-y-ds-3 lg:sticky lg:top-4">{aside}</aside>
    </div>
  );
}
