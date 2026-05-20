"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, EventItem, EventType } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import {
  activityMomentSearchText,
  formatActivityMomentWhen,
  mapActivityMoment,
  shouldShowInActivityFeed
} from "@/lib/activity/momentCopy";
import { EventDetailModal } from "@/components/EventDetailModal";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { useTranslations } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

type ActivityT = (key: string, values?: Record<string, string | number | undefined | null>) => string;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** YYYY-MM-DD in the user's local calendar (for grouping). */
function localDayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "invalid";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatActivityDayHeading(dayKey: string, t: ActivityT, locale: string, now: Date = new Date()): string {
  if (dayKey === "invalid") return t("unknownDate");
  const [ys, ms, ds] = dayKey.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const day = Number(ds);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(day)) return t("unknownDate");

  const groupDate = startOfLocalDay(new Date(y, m - 1, day));
  const todayStart = startOfLocalDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (groupDate.getTime() === todayStart.getTime()) return t("today");
  if (groupDate.getTime() === yesterdayStart.getTime()) return t("yesterday");

  const localeTag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
  return groupDate.toLocaleDateString(localeTag, { day: "numeric", month: "long", year: "numeric" });
}

export default function ActivityPage() {
  const { t, locale } = useTranslations("insights.activity");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventFilter, setEventFilter] = useState<"all" | EventType>("all");
  const [dateFilter, setDateFilter] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailEvent, setDetailEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const eventFilters = useMemo(
    () =>
      [
        { id: "all" as const, label: t("filterAll") },
        { id: "task_completed" as const, label: t("filterTasks") },
        { id: "income_added" as const, label: t("filterIncome") },
        { id: "expense_added" as const, label: t("filterExpenses") },
        { id: "cleaning_done" as const, label: t("filterCleaning") },
        { id: "focus_started" as const, label: t("filterFocusStart") },
        { id: "focus_session_completed" as const, label: t("filterFocusDone") },
        { id: "pomodoro_completed" as const, label: t("filterPomodoro") }
      ] satisfies Array<{ id: "all" | EventType; label: string }>,
    [t]
  );

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/events?limit=100`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch activity log");
    const rawItems = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    setEvents(normalizeAnalyticsEvents(rawItems).filter(shouldShowInActivityFeed));
  }, []);

  useEffect(() => {
    loadEvents().catch(() => {
      setError(t("loadError"));
    });
  }, [loadEvents, t]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    loadEvents().catch(() => {
      setError(t("loadError"));
    });
  }, [realtimeEpoch, loadEvents, t]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();

    const byType = eventFilter === "all" ? events : events.filter((event) => event.type === eventFilter);

    const byDate = byType.filter((event) => {
      if (dateFilter === "all") return true;
      const created = new Date(event.created_at).getTime();
      if (Number.isNaN(created)) return false;

      if (dateFilter === "today") {
        const today = new Date();
        const eventDate = new Date(created);
        return (
          eventDate.getFullYear() === today.getFullYear() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getDate() === today.getDate()
        );
      }

      const days = dateFilter === "7d" ? 7 : 30;
      return created >= now - days * 24 * 60 * 60 * 1000;
    });

    const query = searchQuery.trim().toLowerCase();
    if (!query) return byDate;

    return byDate.filter((event) => activityMomentSearchText(event, t).includes(query));
  }, [events, eventFilter, dateFilter, searchQuery, t]);

  const groupedByDay = useMemo(() => {
    const sorted = [...filteredEvents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const map = new Map<string, EventItem[]>();
    for (const item of sorted) {
      const key = localDayKey(item.created_at);
      const list = map.get(key);
      if (list) list.push(item);
      else map.set(key, [item]);
    }
    const keys = Array.from(map.keys()).filter((k) => k !== "invalid").sort((a, b) => b.localeCompare(a));
    return keys.map((dayKey) => ({ dayKey, items: map.get(dayKey) ?? [] }));
  }, [filteredEvents]);

  const now = useMemo(() => new Date(), [filteredEvents.length, realtimeEpoch]);

  return (
    <div className={ui.contentClass}>
      <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
      <section className={ui.panelClass}>
        <h1 className="text-2xl font-semibold text-lifeos-fg">{t("pageTitle")}</h1>
        <p className={ui.pageHint}>{t("pageDescription")}</p>
        <p className={ui.microHint}>{t("tip")}</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className={ui.inputClass}
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button className={dateFilter === "today" ? ui.pillActive : ui.pill} onClick={() => setDateFilter("today")} type="button">
              {t("today")}
            </button>
            <button className={dateFilter === "7d" ? ui.pillActive : ui.pill} onClick={() => setDateFilter("7d")} type="button">
              {t("days7")}
            </button>
            <button className={dateFilter === "30d" ? ui.pillActive : ui.pill} onClick={() => setDateFilter("30d")} type="button">
              {t("days30")}
            </button>
            <button className={dateFilter === "all" ? ui.pillActive : ui.pill} onClick={() => setDateFilter("all")} type="button">
              {t("all")}
            </button>
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-lifeos-border bg-lifeos-card px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-lifeos-fg-secondary">{t("filterMoments")}</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {eventFilters.map((filter) => (
              <button
                key={filter.id}
                className={eventFilter === filter.id ? ui.pillActive : ui.pill}
                onClick={() => setEventFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </details>

        {error && <p className="mt-4 text-lifeos-danger">{error}</p>}

        <div className="mt-6 space-y-10">
          {groupedByDay.map(({ dayKey, items }) => (
            <section key={dayKey}>
              <h2 className="border-b border-lifeos-border pb-2 text-lg font-semibold tracking-tight text-lifeos-fg">
                {formatActivityDayHeading(dayKey, t, locale)}
              </h2>
              <ul className="mt-4 space-y-6">
                {items.map((item, index) => {
                  const moment = mapActivityMoment(item, t, index);
                  const when = formatActivityMomentWhen(item.created_at, now, locale, t);
                  return (
                    <li key={item.id} className="border-b border-lifeos-border/80 pb-6 last:border-b-0 last:pb-0">
                      <button
                        type="button"
                        className="w-full rounded-xl border border-transparent px-2 py-1 text-left transition hover:border-lifeos-border hover:bg-lifeos-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lifeos-accent/40 focus-visible:ring-offset-0"
                        onClick={() => setDetailEvent(item)}
                      >
                        <p className="text-sm font-medium leading-snug text-lifeos-fg">{moment.headline}</p>
                        <p className="mt-1 text-sm tabular-nums text-lifeos-fg-muted">{when}</p>
                        {moment.subline ? (
                          <p className="mt-1 text-sm text-lifeos-fg-secondary">{moment.subline}</p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          {!filteredEvents.length &&
            (events.length === 0 ? (
              <CalmEmptyState
                tone="insights"
                size="comfortable"
                title={t("emptyTitle")}
                description={t("emptyDescription")}
              />
            ) : (
              <CalmEmptyState
                tone="filter"
                size="inline"
                title={t("filterEmptyTitle")}
                description={t("filterEmptyDescription")}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
