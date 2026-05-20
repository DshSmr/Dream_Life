"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  API_URL,
  EventItem,
  type DetectedHabit,
  type HabitSupportAction,
  fetchDetectedHabits
} from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { computeConsistencyStreaks } from "@/lib/consistency";
import { streakValueClass } from "@/lib/semanticTone";
import { detectClientHabits } from "@/lib/consistency/detectClientHabits";
import { habitPlanItemTitle } from "@/lib/consistency/habitDisplay";
import { GentlePatternsList } from "@/components/consistency/GentlePatternsList";
import {
  appendExtraDailyPlanItem,
  type DailyPlanCategory,
  type DailyPlanPriority
} from "@/lib/dailyPlan";
import { logHabitSupportActionDone } from "@/lib/habits/logSupport";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  OperationalMetricBand,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalStatePanel
} from "@/components/operational/OperationalPrimitives";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

export default function ConsistencyPage() {
  const { t } = useTranslations("life.consistency");
  const router = useRouter();
  const streakDaysPhrase = (days: number) => (days === 1 ? t("oneDay") : t("daysCount", { count: days }));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<DetectedHabit[] | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const loadRhythmData = useCallback(async () => {
    setError(null);
    const res = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
    if (!res.ok) throw new Error("events");
    const rawItems = (await res.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    const normalized = normalizeAnalyticsEvents(rawItems);
    setEvents(normalized);

    try {
      const rows = await fetchDetectedHabits(45);
      setHabits(rows.map((r) => ({ ...r, suggestedActions: r.suggestedActions ?? [] })));
    } catch {
      setHabits(detectClientHabits(normalized, 45));
    }
  }, []);

  useEffect(() => {
    loadRhythmData().catch(() => setError(t("eventsError")));
  }, [loadRhythmData, t]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    loadRhythmData().catch(() => setError(t("eventsError")));
  }, [realtimeEpoch, loadRhythmData, t]);

  const consistencyStreaks = useMemo(() => computeConsistencyStreaks(events, new Date()), [events]);

  const streakSummary = useMemo(() => {
    const rows = [
      { id: "focus" as const, label: t("streakFocus"), days: consistencyStreaks.focusDays },
      { id: "cleaning" as const, label: t("streakCleaning"), days: consistencyStreaks.cleaningDays },
      { id: "tasks" as const, label: t("streakTasks"), days: consistencyStreaks.taskDays }
    ];
    const sorted = [...rows].sort((a, b) => b.days - a.days);
    return { steadiest: sorted[0], gentleCare: sorted[sorted.length - 1], rows };
  }, [consistencyStreaks, t]);

  const runSupportAction = useCallback(
    async (habit: DetectedHabit, action: HabitSupportAction) => {
      const busyKey = `${habit.id}:${action.id}`;
      setBusyAction(busyKey);
      try {
        if (action.type === "navigate" && action.target) {
          await logHabitSupportActionDone(habit.id, action.id, "navigate");
          router.push(action.target as Route);
          toast.success(t("opening"));
        } else if (action.type === "mutation" && action.target === "focus_session_start") {
          const label =
            typeof action.payload?.label === "string" ? action.payload.label : t("defaultFocusLabel");
          const res = await fetch(`${API_URL}/focus/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, task_id: null })
          });
          if (!res.ok) throw new Error("focus");
          await logHabitSupportActionDone(habit.id, action.id, "mutation");
          toast.success(t("focusStarted"));
          router.push("/work/focus" as Route);
        } else if (action.type === "plan_item" && action.payload && typeof action.payload === "object") {
          const p = action.payload as Record<string, unknown>;
          const planItemId = typeof p.planItemId === "string" ? p.planItemId : undefined;
          const title = habitPlanItemTitle(p, habit, t);
          const category = typeof p.category === "string" ? (p.category as DailyPlanCategory) : "task";
          const priority = typeof p.priority === "string" ? (p.priority as DailyPlanPriority) : "medium";
          if (!planItemId) throw new Error("plan_item");
          const added = appendExtraDailyPlanItem(new Date(), {
            id: planItemId,
            title,
            category,
            priority
          });
          await logHabitSupportActionDone(habit.id, action.id, "plan_item");
          toast.success(added ? t("addedToPlan") : t("alreadyOnPlan"));
        }
      } catch {
        toast.error(t("actionFailed"));
      } finally {
        setBusyAction(null);
      }
    },
    [router, t]
  );

  const allStreaksZero = streakSummary.rows.every((r) => r.days === 0);

  return (
    <div className={cn(ui.contentClass, "space-y-ds-5 md:space-y-ds-6")}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("pageTitle")} description={t("pageDescription")} />
        {error && <p className="text-sm text-lifeos-danger">{error}</p>}

        <OperationalStatePanel title={t("yourRhythm")} tone={allStreaksZero ? "default" : "active"}>
          {allStreaksZero ? (
            <p className="text-sm leading-relaxed text-lifeos-fg-secondary">{t("noStreaks")}</p>
          ) : (
            <div className="space-y-ds-2 text-sm leading-relaxed text-lifeos-fg">
              <p>
                <span className="font-medium text-lifeos-fg">{t("steadiest")}</span>{" "}
                {streakSummary.steadiest.label}, {streakDaysPhrase(streakSummary.steadiest.days)}
              </p>
              <p className="text-lifeos-fg-secondary">
                <span className="font-medium text-lifeos-fg">{t("gentleCare")}</span>{" "}
                {streakSummary.gentleCare.label}, {streakDaysPhrase(streakSummary.gentleCare.days)}
              </p>
            </div>
          )}
        </OperationalStatePanel>

        <OperationalMetricBand>
          <div className="grid gap-ds-4 sm:grid-cols-3">
            <OperationalMetricCell
              label={t("focusStreak")}
              value={streakDaysPhrase(consistencyStreaks.focusDays)}
              hint={t("focusStreakHint")}
              valueClassName={streakValueClass(consistencyStreaks.focusDays, "focus")}
            />
            <OperationalMetricCell
              label={t("cleaningStreak")}
              value={streakDaysPhrase(consistencyStreaks.cleaningDays)}
              hint={t("cleaningStreakHint")}
              valueClassName={streakValueClass(consistencyStreaks.cleaningDays, "cleaning")}
            />
            <OperationalMetricCell
              label={t("tasksStreak")}
              value={streakDaysPhrase(consistencyStreaks.taskDays)}
              hint={t("tasksStreakHint")}
              valueClassName={streakValueClass(consistencyStreaks.taskDays, "tasks")}
            />
          </div>
        </OperationalMetricBand>
      </section>

      <section className={ui.panelClass}>
        <GentlePatternsList
          habits={habits}
          t={t}
          title={t("patternsTitle")}
          hint={t("patternsHint")}
          empty={t("patternsEmpty")}
          busyAction={busyAction}
          onAction={(habit, action) => void runSupportAction(habit, action)}
        />
      </section>
    </div>
  );
}
