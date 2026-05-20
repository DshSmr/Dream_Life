"use client";

import type { DetectedHabit, HabitSupportAction } from "@/lib/api";
import {
  habitActionLabel,
  habitCategoryLabel,
  habitConfidenceTone,
  habitFrequency,
  habitMessage,
  type HabitConfidenceTone
} from "@/lib/consistency/habitDisplay";
import { ActivityRow } from "@/components/operational/OperationalPrimitives";
import { Button } from "@/components/ui/button";
import { ds } from "@/styles/design-system";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";

type ConsistencyT = (key: string, values?: Record<string, string | number>) => string;

function confidenceLabel(tone: HabitConfidenceTone, t: ConsistencyT): string {
  if (tone === "steady") return t("confidenceSteady");
  if (tone === "growing") return t("confidenceGrowing");
  return t("confidenceGentle");
}

function GentlePatternCard({
  habit,
  t,
  busyAction,
  onAction
}: {
  habit: DetectedHabit;
  t: ConsistencyT;
  busyAction: string | null;
  onAction: (habit: DetectedHabit, action: HabitSupportAction) => void;
}) {
  const tone = habitConfidenceTone(habit.confidence);
  const actions = habit.suggestedActions ?? [];

  return (
    <li className="space-y-ds-2">
      <ActivityRow
        primary={habitMessage(habit, t)}
        secondary={
          <>
            <span className="block">{habitFrequency(habit, t)}</span>
            <span className="mt-0.5 block text-xs text-lifeos-fg-muted">
              {habitCategoryLabel(habit.category, t)}
            </span>
          </>
        }
        action={
          <span className="shrink-0 rounded-md bg-lifeos-muted/40 px-2 py-0.5 text-xs font-medium text-lifeos-fg-secondary ring-1 ring-lifeos-border/30">
            {confidenceLabel(tone, t)}
          </span>
        }
      />
      {actions.length > 0 ? (
        <div className="flex flex-col gap-ds-2 sm:flex-row sm:flex-wrap sm:items-center">
          {actions.map((action) => {
            const busy = busyAction === `${habit.id}:${action.id}`;
            return (
              <Button
                key={action.id}
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-9 w-full justify-center text-sm sm:w-auto"
                disabled={busy}
                onClick={() => onAction(habit, action)}
              >
                {busy ? "…" : habitActionLabel(action, habit, t)}
              </Button>
            );
          })}
        </div>
      ) : null}
    </li>
  );
}

export function GentlePatternsList({
  habits,
  t,
  title,
  hint,
  empty,
  busyAction,
  onAction,
  className
}: {
  habits: DetectedHabit[] | null;
  t: ConsistencyT;
  title: string;
  hint: string;
  empty: string;
  busyAction: string | null;
  onAction: (habit: DetectedHabit, action: HabitSupportAction) => void;
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className={cn(ds.typography.sectionTitle, "text-lifeos-fg")}>{title}</h2>
      <p className={cn(ui.pageHint, "mt-ds-2")}>{hint}</p>

      {habits && habits.length === 0 ? (
        <p className={cn("mt-ds-3 text-sm leading-relaxed", ui.mutedText)}>{empty}</p>
      ) : null}

      {habits && habits.length > 0 ? (
        <ul className="mt-ds-3 space-y-ds-2">
          {habits.map((h) => (
            <GentlePatternCard
              key={h.id}
              habit={h}
              t={t}
              busyAction={busyAction}
              onAction={onAction}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
