"use client";

import { useMemo } from "react";
import type { LifeFlowCategory, LifeFlowDayBucket, LifeFlowDayGroup, LifeFlowMoment } from "@/lib/timeline/types";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Brain,
  ClipboardList,
  Home,
  LineChart,
  NotebookPen,
  Sparkles,
  Timer,
  Wallet,
  Wind
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_ICON: Record<LifeFlowCategory, LucideIcon> = {
  task: ClipboardList,
  focus: Brain,
  pomodoro: Timer,
  cleaning: Home,
  finance: Wallet,
  insight: LineChart,
  review: NotebookPen,
  dream: Sparkles,
  reflection: Wind
};

const BUCKET_ORDER: LifeFlowDayBucket[] = ["today", "yesterday", "earlier"];

function FlowMomentRow({ moment }: { moment: LifeFlowMoment }) {
  const Icon = CATEGORY_ICON[moment.category];
  const isReflection = moment.kind === "reflection";

  return (
    <li className="relative flex gap-ds-3 py-ds-2 pl-ds-1">
      <span
        className={cn(
          "mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          isReflection ? "text-lifeos-fg-muted/60" : "text-lifeos-fg-muted"
        )}
        aria-hidden
      >
        <Icon className="size-3.5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1 border-l border-lifeos-border/30 pl-ds-4">
        <p
          className={cn(
            "text-sm leading-relaxed",
            isReflection ? "text-lifeos-fg-secondary" : "text-lifeos-fg"
          )}
        >
          {moment.text}
        </p>
        {moment.subline ? (
          <p className="mt-0.5 text-sm leading-relaxed text-lifeos-fg-muted">{moment.subline}</p>
        ) : null}
      </div>
    </li>
  );
}

function DayBlock({ day }: { day: LifeFlowDayGroup }) {
  const showDateLabel = day.bucket === "earlier";

  return (
    <article className="mt-ds-6 first:mt-ds-4">
      {showDateLabel ? (
        <h3 className="mb-ds-2 text-sm font-medium text-lifeos-fg-secondary">{day.heading}</h3>
      ) : null}
      <ul>
        {day.moments.map((m) => (
          <FlowMomentRow key={m.id} moment={m} />
        ))}
      </ul>
    </article>
  );
}

export function LifeFlowStream({ days }: { days: LifeFlowDayGroup[] }) {
  const { t } = useTranslations("insights.lifeFlow");
  const bucketLabel = useMemo(
    () =>
      ({
        today: t("bucketToday"),
        yesterday: t("bucketYesterday"),
        earlier: t("bucketEarlier")
      }) satisfies Record<LifeFlowDayBucket, string>,
    [t]
  );
  const byBucket = new Map<LifeFlowDayBucket, LifeFlowDayGroup[]>();
  for (const bucket of BUCKET_ORDER) {
    byBucket.set(bucket, []);
  }
  for (const day of days) {
    const list = byBucket.get(day.bucket) ?? [];
    list.push(day);
    byBucket.set(day.bucket, list);
  }

  return (
    <div className="space-y-ds-10">
      {BUCKET_ORDER.map((bucket) => {
        const bucketDays = byBucket.get(bucket) ?? [];
        if (!bucketDays.length) return null;

        return (
          <section key={bucket} aria-labelledby={`flow-bucket-${bucket}`}>
            <h2
              id={`flow-bucket-${bucket}`}
              className="text-base font-semibold tracking-tight text-lifeos-fg"
            >
              {bucketLabel[bucket]}
            </h2>
            {bucketDays.map((day) => (
              <DayBlock key={day.dayKey} day={day} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
