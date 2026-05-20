"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, PomodoroSession, TaskItem } from "@/lib/api";
import { useUserPreferencesEpoch } from "@/hooks/useUserPreferencesEpoch";
import { getResolvedUserPreferences } from "@/services/preferences";
import { pomodoroStats } from "@/lib/operational/metrics";
import {
  formatWorkBreakLine,
  pomodoroPrimaryTitle,
  pomodoroSecondaryParts,
  pomodoroTaskLine
} from "@/lib/pomodoro/sessionDisplay";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { Button } from "@/components/ui/button";
import {
  ActivityRow,
  CollapsibleQuickForm,
  OperationalMetricBand,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalStatePanel,
  OperationalTwoColumn,
  RecentActivityBlock
} from "@/components/operational/OperationalPrimitives";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

export default function PomodoroPage() {
  const { t, locale } = useTranslations("work.pomodoro");
  const { t: tCommon } = useTranslations();
  const userPrefsEpoch = useUserPreferencesEpoch();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [label, setLabel] = useState("");
  const [pomodoroTaskId, setPomodoroTaskId] = useState("");
  const [workMinutes, setWorkMinutes] = useState("25");
  const [breakMinutes, setBreakMinutes] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const loadSessions = useCallback(async () => {
    const response = await fetch(`${API_URL}/pomodoro/sessions?limit=50`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch pomodoro sessions");
    setSessions(await response.json());
  }, []);

  const loadTasks = useCallback(async () => {
    const response = await fetch(`${API_URL}/tasks?limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    setTasks(await response.json());
  }, []);

  useEffect(() => {
    Promise.all([loadSessions(), loadTasks()]).catch((err: Error) => setError(err.message));
  }, [loadSessions, loadTasks]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    Promise.all([loadSessions(), loadTasks()]).catch((err: Error) => setError(err.message));
  }, [realtimeEpoch, loadSessions, loadTasks]);

  useEffect(() => {
    setWorkMinutes(String(getResolvedUserPreferences().focusLengthMinutes));
  }, [userPrefsEpoch]);

  const stats = useMemo(() => pomodoroStats(sessions), [sessions]);

  useEffect(() => {
    if (!stats.running) return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [stats.running?.id]);

  async function startSession() {
    setError(null);
    const work = Number(workMinutes);
    const brk = Number(breakMinutes);
    if (!Number.isInteger(work) || work < 10) {
      setError(t("workMinInvalid"));
      toast.error(t("workMinInvalid"));
      return;
    }
    if (!Number.isInteger(brk) || brk < 1) {
      setError(t("breakMinInvalid"));
      toast.error(t("breakMinInvalid"));
      return;
    }
    try {
      const response = await fetch(`${API_URL}/pomodoro/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || null,
          task_id: pomodoroTaskId || null,
          work_minutes: work,
          break_minutes: brk
        })
      });
      if (!response.ok) {
        setError(t("startFailed"));
        toast.error(t("startFailed"));
        return;
      }
      setLabel("");
      setPomodoroTaskId("");
      toast.success(t("started"));
      setNow(new Date());
      await loadSessions();
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }

  async function completeSession(sessionId: string) {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/pomodoro/sessions/${sessionId}/complete`, { method: "POST" });
      if (!response.ok) {
        setError(t("completeFailed"));
        toast.error(t("completeFailed"));
        return;
      }
      toast.success(t("completed"));
      await loadSessions();
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }

  function runningSecondary(session: PomodoroSession): string {
    const parts = [formatWorkBreakLine(session.work_minutes, session.break_minutes, t)];
    const taskLine = pomodoroTaskLine(session, tasks, t);
    if (taskLine) parts.push(taskLine);
    return parts.join(" · ");
  }

  const startForm = (
    <CollapsibleQuickForm label={t("startCycle")} hideExpandGlyph>
      <div className="grid gap-ds-2">
        <div className="grid gap-ds-1">
          <label className={ui.formLabel} htmlFor="pomo-task">
            {t("focusOn")}
          </label>
          <select
            id="pomo-task"
            className={ui.inputClass}
            value={pomodoroTaskId}
            onChange={(e) => setPomodoroTaskId(e.target.value)}
          >
            <option value="">{t("generalFocus")}</option>
            {tasks
              .filter((task) => task.status !== "done")
              .map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
          </select>
        </div>
        <div className="grid gap-ds-1">
          <label className={ui.formLabel} htmlFor="pomo-label">
            {t("labelOptional")}
          </label>
          <input
            id="pomo-label"
            className={ui.inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("labelPlaceholder")}
          />
        </div>
        <div className="grid grid-cols-2 gap-ds-2">
          <div className="grid gap-ds-1">
            <label className={ui.formLabel} htmlFor="pomo-work">
              {t("workMin")}
            </label>
            <input
              id="pomo-work"
              className={ui.inputClass}
              inputMode="numeric"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(e.target.value)}
            />
          </div>
          <div className="grid gap-ds-1">
            <label className={ui.formLabel} htmlFor="pomo-break">
              {t("breakMin")}
            </label>
            <input
              id="pomo-break"
              className={ui.inputClass}
              inputMode="numeric"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
            />
          </div>
        </div>
        <Button className={`${ui.primaryButton} w-full justify-center`} onClick={startSession} type="button">
          {t("startPomodoro")}
        </Button>
      </div>
    </CollapsibleQuickForm>
  );

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("pageTitle")} description={t("pageDescription")} />

        <OperationalStatePanel title={tCommon("common.currentState")} tone={stats.running ? "active" : "default"}>
          {stats.running ? (
            <div className="flex flex-wrap items-start justify-between gap-ds-3">
              <div>
                <p className="text-base font-semibold text-lifeos-fg">
                  {pomodoroPrimaryTitle(stats.running, tasks, t)}
                </p>
                <p className="mt-ds-1 text-sm text-lifeos-fg-muted">{runningSecondary(stats.running)}</p>
              </div>
              <Button className={ui.secondaryButton} onClick={() => completeSession(stats.running!.id)} type="button" size="sm">
                {t("complete")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-lifeos-fg-secondary">
              {t("noCycle")}{" "}
              {stats.todayDone > 0 ? t("completedToday", { count: stats.todayDone }) : t("startWhenReady")}
            </p>
          )}
        </OperationalStatePanel>

        <OperationalMetricBand>
          <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-3">
            <OperationalMetricCell label={t("today")} value={stats.todayDone} hint={t("completedCycles")} />
            <OperationalMetricCell label={t("thisWeek")} value={stats.weekDone} />
            <OperationalMetricCell label={t("cycles")} value={sessions.length} hint={t("loggedRecently")} />
          </div>
        </OperationalMetricBand>

        <OperationalTwoColumn
          main={
            <RecentActivityBlock title={t("recentCycles")}>
              {sessions.length === 0 && (
                <CalmEmptyState
                  tone="pomodoro"
                  size="inline"
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                />
              )}
              {sessions.slice(0, 12).map((s) => (
                <ActivityRow
                  key={s.id}
                  primary={pomodoroPrimaryTitle(s, tasks, t)}
                  secondary={pomodoroSecondaryParts(s, tasks, now, locale, t).join(" · ")}
                  action={
                    s.status === "running" ? (
                      <Button className={ui.secondaryButton} onClick={() => completeSession(s.id)} type="button" size="sm">
                        {t("complete")}
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </RecentActivityBlock>
          }
          aside={startForm}
        />

        {error && <p className="text-sm text-lifeos-danger">{error}</p>}
      </section>
    </div>
  );
}
