import type { DailyReview, EventItem } from "@/lib/api";
import type { Locale } from "@/lib/i18n/types";
import { localDateKeyFromIso } from "@/lib/datetime";
import { dreamPresetById } from "@/lib/dream/catalog";
import { resolveDreamFromPreferences } from "@/lib/dream/resolve";
import { pickDreamWhisper } from "@/lib/dream/messaging";
import type { DreamLayerContext } from "@/lib/dream/types";
import { getResolvedUserPreferences } from "@/services/preferences";
import { dayPartFromMs, compareDayParts, dayPartLabel } from "@/lib/timeline/dayParts";
import { buildDayClosingReflection } from "@/lib/timeline/dayReflection";
import { mapEventToLifeFlowCopy, type LifeFlowT } from "@/lib/timeline/lifeFlowCopy";
import { dayBucketForKey, formatDayHeading } from "@/lib/timeline/synthesis";
import type {
  LifeFlowDayGroup,
  LifeFlowDayPart,
  LifeFlowDayPartGroup,
  LifeFlowMoment
} from "@/lib/timeline/types";
import { computeDailyStats } from "@/lib/analytics/fromEvents";

export type BuildLifeFlowInput = {
  events: EventItem[];
  reviews?: DailyReview[];
  /** How many calendar days back to include (from today) */
  daySpan?: number;
  now?: Date;
  locale?: Locale;
  t: LifeFlowT;
};

function parseDayKey(dayKey: string): Date {
  const [ys, ms, ds] = dayKey.split("-");
  return new Date(Number(ys), Number(ms) - 1, Number(ds));
}

function dayKeysInSpan(span: number, now: Date): string[] {
  const keys: string[] = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    keys.push(key);
  }
  return keys;
}

function dreamMomentForDay(
  dayKey: string,
  stats: ReturnType<typeof computeDailyStats>,
  atMs: number,
  t: LifeFlowT
): LifeFlowMoment | null {
  const dream = resolveDreamFromPreferences(getResolvedUserPreferences());
  if (!dream.isSet) return null;
  if (stats.tasksCompleted === 0 && stats.focusMinutes === 0 && stats.expensesTotal === 0 && stats.cleaningActions === 0) {
    return null;
  }

  const ctx: DreamLayerContext = {
    tasksCompletedToday: stats.tasksCompleted,
    focusMinutesToday: stats.focusMinutes,
    hasNextAction: false,
    planItemsDone: 0,
    planItemsTotal: 0
  };
  const whisper = pickDreamWhisper(dream, ctx);
  const toward =
    dream.id !== "custom" && dream.id ? dreamPresetById(dream.id)?.towardPhrase : null;

  return {
    id: `dream-${dayKey}`,
    atMs: atMs - 1,
    dayKey,
    dayPart: "morning",
    kind: "reflection",
    category: "dream",
    text: toward ? t("dreamToward", { toward }) : whisper ?? t("dreamAligned", { label: dream.label }),
    subline: dream.label
  };
}

function groupMomentsIntoParts(moments: LifeFlowMoment[]): LifeFlowDayPartGroup[] {
  const byPart = new Map<LifeFlowDayPart, LifeFlowMoment[]>();
  for (const m of moments) {
    const list = byPart.get(m.dayPart) ?? [];
    list.push(m);
    byPart.set(m.dayPart, list);
  }

  const parts: LifeFlowDayPartGroup[] = [];
  for (const [dayPart, list] of byPart) {
    list.sort((a, b) => a.atMs - b.atMs);
    parts.push({ dayPart, label: dayPartLabel(dayPart), moments: list });
  }
  parts.sort((a, b) => compareDayParts(a.dayPart, b.dayPart));
  return parts;
}

function eventsToMoments(events: EventItem[], t: LifeFlowT): LifeFlowMoment[] {
  const moments: LifeFlowMoment[] = [];
  let index = 0;
  for (const event of events) {
    const atMs = new Date(event.created_at).getTime();
    if (Number.isNaN(atMs)) continue;
    const dayKey = localDateKeyFromIso(event.created_at);
    const mapped = mapEventToLifeFlowCopy(event, index++, t);
    if (!mapped) continue;
    moments.push({
      id: event.id,
      atMs,
      dayKey,
      dayPart: dayPartFromMs(atMs),
      kind: "moment",
      category: mapped.category,
      text: mapped.text,
      subline: mapped.subline
    });
  }
  return moments;
}

/**
 * Builds a multi-day, grouped life flow from events, reviews, and dream context.
 */
export function buildLifeFlowStream(input: BuildLifeFlowInput): LifeFlowDayGroup[] {
  const now = input.now ?? new Date();
  const span = input.daySpan ?? 14;
  const t = input.t;
  const locale = input.locale ?? "en";
  const allowedKeys = new Set(dayKeysInSpan(span, now));

  const eventMoments = eventsToMoments(input.events, t).filter((m) => allowedKeys.has(m.dayKey));

  const reviewByDay = new Map<string, DailyReview>();
  for (const review of input.reviews ?? []) {
    const dk = review.date?.slice(0, 10);
    if (dk && dk.length >= 10) reviewByDay.set(dk, review);
  }

  const momentsByDay = new Map<string, LifeFlowMoment[]>();
  for (const m of eventMoments) {
    const list = momentsByDay.get(m.dayKey) ?? [];
    list.push(m);
    momentsByDay.set(m.dayKey, list);
  }

  const todayKey = localDateKeyFromIso(now.toISOString());
  const groups: LifeFlowDayGroup[] = [];

  for (const dayKey of [...allowedKeys].sort((a, b) => parseDayKey(b).getTime() - parseDayKey(a).getTime())) {
    const dayEvents = input.events.filter((e) => localDateKeyFromIso(e.created_at) === dayKey);
    const stats = computeDailyStats(dayEvents, dayKey);
    let moments = momentsByDay.get(dayKey) ?? [];

    const dreamM = dreamMomentForDay(dayKey, stats, moments[0]?.atMs ?? Date.parse(`${dayKey}T12:00:00`), t);
    if (dreamM) moments = [dreamM, ...moments];

    const closing = buildDayClosingReflection(dayKey, dayEvents, t, reviewByDay.get(dayKey));
    if (closing) {
      const atMs = Date.parse(`${dayKey}T21:30:00`);
      moments.push({
        id: `closing-${dayKey}`,
        atMs: Number.isNaN(atMs) ? Date.now() : atMs,
        dayKey,
        dayPart: "evening",
        kind: "reflection",
        category: "review",
        text: closing.text,
        subline: closing.subline
      });
    }

    if (moments.length === 0) continue;

    moments.sort((a, b) => a.atMs - b.atMs);

    const parts = groupMomentsIntoParts(moments);
    groups.push({
      dayKey,
      heading: formatDayHeading(dayKey, t, locale, now),
      bucket: dayBucketForKey(dayKey, now),
      isToday: dayKey === todayKey,
      moments,
      parts
    });
  }

  return groups;
}

/** Single-day slice — used by legacy callers */
export function buildDailyTimeline(
  events: EventItem[],
  dayKey: string,
  t: LifeFlowT
): import("@/lib/timeline/types").TimelineRow[] {
  const groups = buildLifeFlowStream({ events, daySpan: 90, t });
  const day = groups.find((g) => g.dayKey === dayKey);
  if (!day) return [];
  const rows: import("@/lib/timeline/types").TimelineRow[] = [];
  for (const part of day.parts) {
    for (const m of part.moments) {
      rows.push({
        id: m.id,
        atMs: m.atMs,
        timeLabel: "",
        headline: m.text,
        detail: m.subline ?? null
      });
    }
  }
  return rows;
}
