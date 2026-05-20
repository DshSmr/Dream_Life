"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL, EventItem, TaskEnergyType, TaskItem, TaskPriority, TaskStatus } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { pickTopPriorityTask } from "@/lib/commandCenter";
import { localCalendarDayKeyFromDate } from "@/lib/datetime";
import { buildDaySeries, lastNDayKeys, taskCompletedByDay, taskOperationalStats } from "@/lib/operational/metrics";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";
import {
  ActivityRow,
  CollapsibleQuickForm,
  WeeklyActivityRhythm,
  OperationalMetricBand,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalStatePanel,
  OperationalTwoColumn,
  RecentActivityBlock
} from "@/components/operational/OperationalPrimitives";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useSelectStringHandler
} from "@/components/ui/select";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { sendWithOfflineQueue } from "@/services/offlineQueue";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

type TaskBoardFilter = "active" | TaskStatus;

function TasksPageContent() {
  const { t, locale } = useTranslations("work.tasks");
  const { t: tCommon } = useTranslations();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskBoardFilter>("active");
  const [dueFilter, setDueFilter] = useState<"all" | "overdue" | "today" | "week">("all");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const onPriorityChange = useSelectStringHandler((v) => setTaskPriority(v as TaskPriority));
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEnergyType, setTaskEnergyType] = useState<TaskEnergyType | "">("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tasks?limit=100`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      setTasks(await response.json());
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }, [tCommon]);

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch events");
    const raw = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    setEvents(normalizeAnalyticsEvents(raw));
  }, []);

  useEffect(() => {
    Promise.all([loadTasks(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [loadTasks, loadEvents]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    Promise.all([loadTasks(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [realtimeEpoch, loadTasks, loadEvents]);

  useEffect(() => {
    if (!highlightId) return;
    setTaskFilter("active");
    setDueFilter("all");
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId) return;
    const t = window.setTimeout(() => {
      document.getElementById(`task-row-${highlightId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [highlightId, tasks]);

  async function onCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!taskTitle.trim()) {
      setError(t("titleRequired"));
      toast.error(t("titleRequired"));
      return;
    }
    try {
      const body = {
        title: taskTitle.trim(),
        priority: taskPriority,
        due_date: taskDueDate || null,
        energy_type: taskEnergyType || null
      };
      const result = await sendWithOfflineQueue({ kind: "post_task", body }, () =>
        fetch(`${API_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        setTaskTitle("");
        setTaskPriority("medium");
        setTaskDueDate("");
        setTaskEnergyType("");
        await loadTasks();
        return;
      }
      if (!result.response.ok) {
        setError(t("createFailed"));
        toast.error(t("createFailed"));
        return;
      }
      setTaskTitle("");
      setTaskPriority("medium");
      setTaskDueDate("");
      setTaskEnergyType("");
      toast.success(t("taskAdded"));
      await loadTasks();
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    setError(null);
    try {
      const result = await sendWithOfflineQueue({ kind: "patch_task_status", taskId, status }, () =>
        fetch(`${API_URL}/tasks/${taskId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        await loadTasks();
        if (status === "done") await loadEvents().catch(() => undefined);
        return;
      }
      if (!result.response.ok) {
        setError(t("updateFailed"));
        toast.error(t("updateFailed"));
        return;
      }
      toast.success(t("statusUpdated"));
      await loadTasks();
      if (status === "done") await loadEvents().catch(() => undefined);
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }

  const counters = {
    active: tasks.filter((t) => t.status !== "done").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length
  };
  const priorityLabel: Record<TaskPriority, string> = {
    low: t("priorityLow"),
    medium: t("priorityMedium"),
    high: t("priorityHigh")
  };

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const statusFiltered = tasks.filter((task) => {
    if (taskFilter === "active") return task.status !== "done";
    return task.status === taskFilter;
  });

  const filteredTasks = statusFiltered.filter((task) => {
    if (dueFilter === "all" || !task.due_date) return dueFilter === "all" ? true : false;

    const due = new Date(task.due_date);
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (dueFilter === "overdue") return dueStart < todayStart && task.status !== "done";
    if (dueFilter === "today") return dueStart.getTime() === todayStart.getTime();
    if (dueFilter === "week") return dueStart >= todayStart && dueStart <= weekEnd;
    return true;
  });
  const statusLabel: Record<TaskStatus, string> = {
    todo: t("statusTodo"),
    in_progress: t("statusInProgress"),
    done: t("statusDone")
  };

  const streakDays = (n: number) =>
    n === 1 ? tCommon("life.consistency.oneDay") : tCommon("life.consistency.daysCount", { count: n });

  const topPriority = useMemo(() => pickTopPriorityTask(tasks), [tasks]);
  const ops = useMemo(() => taskOperationalStats(tasks, events), [tasks, events]);
  const dayKeys = useMemo(() => lastNDayKeys(7), []);
  const completionTrend = useMemo(
    () => buildDaySeries(dayKeys, taskCompletedByDay(events, dayKeys)),
    [dayKeys, events]
  );

  const weekRhythmLocale = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";

  const todayKey = localCalendarDayKeyFromDate(today);

  function weekdayLong(dayKey: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
    if (!m) return dayKey;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString(weekRhythmLocale, { weekday: "long" });
  }

  function weekdayShort(dayKey: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
    if (!m) return dayKey.slice(-2);
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString(weekRhythmLocale, { weekday: "short" }).replace(/\.$/, "").slice(0, 2);
  }

  function getDueMeta(dueDate: string | null, status: TaskStatus): { label: string } | null {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    if (Number.isNaN(dueStart.getTime())) return null;

    const diffDays = Math.floor((dueStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 && status !== "done") {
      return { label: `${t("dueOverdue")} (${dueDate})` };
    }
    if (diffDays === 0) {
      return { label: `${t("dueToday")} (${dueDate})` };
    }
    return { label: `${t("dueLabel")} ${dueDate}` };
  }

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("pageTitle")} description={t("pageDescription")} />

        <OperationalStatePanel title={t("todayFocus")} tone={topPriority ? "active" : "default"}>
          {topPriority ? (
            <div>
              <p className="text-base font-semibold text-lifeos-fg">{topPriority.title}</p>
              <p className="mt-ds-1 text-sm text-lifeos-fg-muted">
                {t("highPriority")}
                {topPriority.due_date ? ` · ${t("due")} ${topPriority.due_date}` : ""} · {statusLabel[topPriority.status]}
              </p>
              <div className="mt-ds-3 flex flex-wrap gap-ds-2">
                {topPriority.status !== "in_progress" && (
                  <Button variant="primary" size="sm" type="button" onClick={() => updateTaskStatus(topPriority.id, "in_progress")}>
                    {t("start")}
                  </Button>
                )}
                <Button variant="primary" size="sm" type="button" onClick={() => updateTaskStatus(topPriority.id, "done")}>
                  {t("done")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-lifeos-fg-secondary">
              {t("nothingUrgent")}{" "}
              {ops.active === 0
                ? t("addWhenReady")
                : ops.active === 1
                  ? t("tasksWaitingOne")
                  : t("tasksWaitingOther", { count: ops.active })}
            </p>
          )}
        </OperationalStatePanel>

        <OperationalMetricBand>
          <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-4">
            <OperationalMetricCell label={t("active")} value={ops.active} />
            <OperationalMetricCell label={t("inProgress")} value={ops.inProgress} />
            <OperationalMetricCell label={t("doneToday")} value={ops.doneToday} />
            <OperationalMetricCell
              label={t("streak")}
              value={streakDays(ops.taskStreak)}
              hint={`${ops.doneWeek} ${t("thisWeek")}`}
            />
          </div>
          <WeeklyActivityRhythm
            series={completionTrend}
            ariaLabel={t("weekRhythmAria")}
            todayKey={todayKey}
            weekdayShort={weekdayShort}
            dayTitle={(d) =>
              d.value > 0
                ? t("weekRhythmDayActive", { weekday: weekdayLong(d.dayKey), count: d.value })
                : t("weekRhythmDayQuiet", { weekday: weekdayLong(d.dayKey) })
            }
          />
        </OperationalMetricBand>

        <div className="flex flex-wrap gap-2">
          <button className={taskFilter === "active" ? ui.pillActive : ui.pill} onClick={() => setTaskFilter("active")} type="button">
            {t("filterActive")} ({counters.active})
          </button>
          <button className={taskFilter === "todo" ? ui.pillActive : ui.pill} onClick={() => setTaskFilter("todo")} type="button">
            {t("filterTodo")} ({counters.todo})
          </button>
          <button
            className={taskFilter === "in_progress" ? ui.pillActive : ui.pill}
            onClick={() => setTaskFilter("in_progress")}
            type="button"
          >
            {t("filterInProgress")} ({counters.in_progress})
          </button>
          <button className={taskFilter === "done" ? ui.pillActive : ui.pill} onClick={() => setTaskFilter("done")} type="button">
            {t("filterDone")} ({counters.done})
          </button>
        </div>
        <details className="mt-3 rounded-xl border border-lifeos-border bg-lifeos-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-lifeos-fg-secondary">{t("advancedFilters")}</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={dueFilter === "all" ? ui.pillActive : ui.pill} onClick={() => setDueFilter("all")} type="button">
              {t("allDeadlines")}
            </button>
            <button className={dueFilter === "overdue" ? ui.pillActive : ui.pill} onClick={() => setDueFilter("overdue")} type="button">
              {t("overdue")}
            </button>
            <button className={dueFilter === "today" ? ui.pillActive : ui.pill} onClick={() => setDueFilter("today")} type="button">
              {t("today")}
            </button>
            <button className={dueFilter === "week" ? ui.pillActive : ui.pill} onClick={() => setDueFilter("week")} type="button">
              {t("thisWeekFilter")}
            </button>
          </div>
        </details>

        <OperationalTwoColumn
          main={
            <RecentActivityBlock title={t("queueTitle")}>
              {filteredTasks.length === 0 && (
                <CalmEmptyState
                  tone="filter"
                  size="inline"
                  title={t("emptyFilterTitle")}
                  description={t("emptyFilterDescription")}
                />
              )}
              {filteredTasks.map((task) => {
                const due = getDueMeta(task.due_date, task.status);
                return (
                  <div
                    key={task.id}
                    id={`task-row-${task.id}`}
                    className={highlightId === task.id ? "rounded-ds-input ring-2 ring-lifeos-accent/40" : undefined}
                  >
                    <ActivityRow
                      primary={task.title}
                      secondary={`${statusLabel[task.status]} · ${priorityLabel[task.priority]}${due ? ` · ${due.label}` : ""}`}
                      action={
                        <div className="flex flex-wrap gap-ds-1">
                          {task.status !== "in_progress" && (
                            <Button variant="primary" size="sm" type="button" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                              {t("start")}
                            </Button>
                          )}
                          <Button variant="primary" size="sm" type="button" onClick={() => updateTaskStatus(task.id, "done")}>
                            {t("done")}
                          </Button>
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </RecentActivityBlock>
          }
          aside={
            <CollapsibleQuickForm label={t("addTask")} hideExpandGlyph>
              <form onSubmit={onCreateTask} className={ui.formGrid}>
                <FormField id="task-title-side" label={t("title")}>
                  <Input id="task-title-side" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder={t("titlePlaceholder")} autoComplete="off" />
                </FormField>
                <FormField id="task-priority-side" label={t("priority")}>
                  <Select
                    value={taskPriority}
                    onValueChange={onPriorityChange}
                    items={{ low: t("priorityLow"), medium: t("priorityMedium"), high: t("priorityHigh") }}
                  >
                    <SelectTrigger id="task-priority-side" className="w-full">
                      <SelectValue placeholder={t("choosePriority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t("priorityLow")}</SelectItem>
                      <SelectItem value="medium">{t("priorityMedium")}</SelectItem>
                      <SelectItem value="high">{t("priorityHigh")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <div className="flex justify-end md:col-span-2">
                  <Button className={ui.primaryButton} type="submit">{t("submit")}</Button>
                </div>
              </form>
            </CollapsibleQuickForm>
          }
        />
        {error && <p className="text-sm text-lifeos-danger">{error}</p>}
      </section>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className={ui.contentClass}>
          <PageSectionSkeleton className="mt-4" />
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
