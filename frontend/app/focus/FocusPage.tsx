"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, EventItem, FocusSession, TaskItem } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import {
  focusSessionFocusedOnLine,
  focusSessionPrimaryTitle,
  formatFocusDurationLine,
  formatStartedRelative,
  formatTodayFocusMinutes,
  formatWeekFocusMinutes
} from "@/lib/focus/sessionDisplay";
import {
  buildDaySeries,
  focusMinutesByDay,
  focusMinutesToday,
  focusStreakFromEvents,
  lastNDayKeys
} from "@/lib/operational/metrics";
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
import { sendWithOfflineQueue } from "@/services/offlineQueue";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

export default function FocusPage() {
  const { t } = useTranslations("work.focus");
  const { t: tCommon } = useTranslations();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [label, setLabel] = useState("");
  const [focusTaskId, setFocusTaskId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const activeSession = sessions.find((session) => !session.ended_at) ?? null;
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const loadSessions = useCallback(async () => {
    const response = await fetch(`${API_URL}/focus/sessions?limit=50`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch focus sessions");
    setSessions(await response.json());
  }, []);

  const loadTasks = useCallback(async () => {
    const response = await fetch(`${API_URL}/tasks?limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    setTasks(await response.json());
  }, []);

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch events");
    const raw = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    setEvents(normalizeAnalyticsEvents(raw));
  }, []);

  useEffect(() => {
    Promise.all([loadSessions(), loadTasks(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [loadSessions, loadTasks, loadEvents]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    Promise.all([loadSessions(), loadTasks(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [realtimeEpoch, loadSessions, loadTasks, loadEvents]);

  useEffect(() => {
    if (!activeSession) return;
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, [activeSession?.id]);

  const dayKeys = useMemo(() => lastNDayKeys(7), []);
  const todayMin = useMemo(() => focusMinutesToday(sessions, now), [sessions, now]);
  const streak = useMemo(() => focusStreakFromEvents(events), [events]);
  const weekMin = useMemo(() => {
    const trend = buildDaySeries(dayKeys, focusMinutesByDay(sessions, dayKeys));
    return trend.reduce((sum, d) => sum + d.value, 0);
  }, [dayKeys, sessions]);

  async function startSession() {
    setError(null);
    const body = { label: label.trim() || null, task_id: focusTaskId || null };
    try {
      const result = await sendWithOfflineQueue({ kind: "focus_start", body }, () =>
        fetch(`${API_URL}/focus/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        setLabel("");
        setFocusTaskId("");
        await loadSessions();
        return;
      }
      if (!result.response.ok) {
        setError(t("startFailed"));
        toast.error(t("startFailed"));
        return;
      }
      setLabel("");
      setFocusTaskId("");
      toast.success(t("sessionStarted"));
      setNow(new Date());
      await Promise.all([loadSessions(), loadEvents()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tCommon("common.toast.connectionError"));
      toast.error(t("startCouldNot"));
    }
  }

  async function stopSession(sessionId: string) {
    setError(null);
    try {
      const result = await sendWithOfflineQueue({ kind: "focus_stop", sessionId }, () =>
        fetch(`${API_URL}/focus/sessions/${sessionId}/stop`, { method: "POST" })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        await loadSessions();
        return;
      }
      if (!result.response.ok) {
        setError(t("stopFailed"));
        toast.error(t("stopFailed"));
        return;
      }
      toast.success(t("sessionStopped"));
      await Promise.all([loadSessions(), loadEvents()]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tCommon("common.toast.connectionError"));
      toast.error(t("stopCouldNot"));
    }
  }

  const streakDays = (n: number) =>
    n === 1 ? tCommon("life.consistency.oneDay") : tCommon("life.consistency.daysCount", { count: n });

  const minSuffix = t("minSuffix");

  function sessionSecondaryParts(session: FocusSession): string[] {
    const parts: string[] = [];
    const hasCustomLabel = Boolean(session.label?.trim());
    const focused = focusSessionFocusedOnLine(session, tasks, t);
    if (focused && hasCustomLabel) parts.push(focused);

    const elapsedSec = !session.ended_at
      ? Math.max(0, Math.floor((now.getTime() - new Date(session.started_at).getTime()) / 1000))
      : 0;

    if (!session.ended_at && elapsedSec < 60) {
      parts.push(t("justStarted"));
      return parts;
    }

    parts.push(formatStartedRelative(session.started_at, now, t));

    if (session.ended_at) {
      const duration = formatFocusDurationLine(session, now, t, minSuffix);
      if (duration) parts.push(duration);
    }

    return parts;
  }

  const startForm = (
    <CollapsibleQuickForm label={t("startSession")} hideExpandGlyph>
      <div className="grid gap-ds-2">
        <div className="grid gap-ds-1">
          <label className={ui.formLabel} htmlFor="focus-task">
            {t("focusOn")}
          </label>
          <select
            id="focus-task"
            className={ui.inputClass}
            value={focusTaskId}
            onChange={(e) => setFocusTaskId(e.target.value)}
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
          <label className={ui.formLabel} htmlFor="focus-label">
            {t("labelOptional")}
          </label>
          <input
            id="focus-label"
            className={ui.inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("labelPlaceholder")}
          />
        </div>
        <Button className={`${ui.primaryButton} w-full justify-center`} onClick={startSession} type="button">
          {t("startFocus")}
        </Button>
      </div>
    </CollapsibleQuickForm>
  );

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("pageTitle")} description={t("pageDescription")} />

        <OperationalStatePanel title={tCommon("common.currentState")} tone={activeSession ? "active" : "default"}>
          {activeSession ? (
            <div className="flex flex-wrap items-start justify-between gap-ds-3">
              <div>
                <p className="text-base font-semibold text-lifeos-fg">
                  {focusSessionPrimaryTitle(activeSession, tasks, t)}
                </p>
                <p className="mt-ds-1 text-sm text-lifeos-fg-muted">{sessionSecondaryParts(activeSession).join(" · ")}</p>
              </div>
              <Button className={ui.secondaryButton} onClick={() => stopSession(activeSession.id)} type="button" size="sm">
                {t("stopSession")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-lifeos-fg-secondary">
              {t("noSession")}{" "}
              {todayMin > 0
                ? todayMin < 1
                  ? t("loggedTodayLight")
                  : t("loggedToday", { minutes: todayMin })
                : t("startWhenReady")}
            </p>
          )}
        </OperationalStatePanel>

        <OperationalMetricBand>
          <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-4">
            <OperationalMetricCell
              label={t("today")}
              value={formatTodayFocusMinutes(todayMin, t, minSuffix)}
              hint={t("completedRunning")}
            />
            <OperationalMetricCell label={t("sevenDayTotal")} value={formatWeekFocusMinutes(weekMin, t, minSuffix)} />
            <OperationalMetricCell
              label={t("streak")}
              value={streakDays(streak)}
              valueClassName={streak > 0 ? "text-lifeos-warning" : undefined}
              hint={t("daysInRow")}
            />
            <OperationalMetricCell label={t("sessions")} value={sessions.length} hint={t("loggedRecently")} />
          </div>
        </OperationalMetricBand>

        <OperationalTwoColumn
          main={
            <RecentActivityBlock
              title={t("recentSessions")}
              empty={
                sessions.length === 0 ? (
                  <CalmEmptyState
                    tone="focus"
                    size="inline"
                    title={t("emptyTitle")}
                    description={t("emptyDescription")}
                  />
                ) : undefined
              }
            >
              {sessions.slice(0, 12).map((s) => (
                <ActivityRow
                  key={s.id}
                  primary={focusSessionPrimaryTitle(s, tasks, t)}
                  secondary={sessionSecondaryParts(s).join(" · ")}
                  action={
                    !s.ended_at ? (
                      <Button className={ui.secondaryButton} onClick={() => stopSession(s.id)} type="button" size="sm">
                        {t("stop")}
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
