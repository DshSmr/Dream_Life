/**
 * Calm, rule-based weekly observations for the review screen.
 * Copy only — numeric rollups stay in `@/lib/analytics/fromEvents`.
 */
import type { CleaningZone, EventItem, FinanceTransaction } from "@/lib/api";
import { computeWeeklyStats, filterEventsInRange } from "@/lib/analytics/fromEvents";
import { localDateKeyFromIso } from "@/lib/datetime";

export type WeeklyReviewT = (key: string, values?: Record<string, string | number>) => string;

export type WeeklyReviewInsightInput = {
  events: EventItem[];
  weekFromMs: number;
  weekToMs: number;
  zones: CleaningZone[];
  topExpenseCategory: string | null;
  topExpenseAmount: number;
};

function weekSeed(fromMs: number, toMs: number): number {
  return Math.floor((fromMs + toMs) / 86_400_000);
}

/**
 * Gentle observations — not coaching, not onboarding tips.
 */
export function generateWeeklyObservations(
  input: WeeklyReviewInsightInput,
  t: WeeklyReviewT
): string[] {
  const stats = computeWeeklyStats(input.events, input.weekFromMs, input.weekToMs);
  const { tasksCompleted: tasks, focusMinutes: focus, cleaningActions: cleaning, expensesTotal: spent } = stats;
  const seed = weekSeed(input.weekFromMs, input.weekToMs);
  const out: string[] = [];

  if (focus === 0 && tasks > 0) {
    out.push(t("obsFocusQuieter"));
  } else if (focus >= 45) {
    out.push(seed % 2 === 0 ? t("obsFocusSteady") : t("obsFocusHadRoom"));
  } else if (focus > 0) {
    out.push(t("obsFocusSome"));
  }

  if (cleaning > 0) {
    out.push(seed % 2 === 0 ? t("obsHomeSteady") : t("obsHomeCared"));
  }

  const overdue = input.zones.filter((z) => z.status === "overdue");
  if (overdue.length > 0 && cleaning === 0) {
    out.push(t("obsHomeWaiting"));
  }

  if (tasks > 0) {
    out.push(seed % 2 === 0 ? t("obsTasksForward") : t("obsTasksMoved"));
  }

  if (spent <= 0) {
    out.push(t("obsMoneyQuiet"));
  } else if (spent < 120) {
    out.push(t("obsMoneyLight"));
  } else if (input.topExpenseCategory && input.topExpenseAmount > 0) {
    out.push(t("obsMoneyCategory", { category: input.topExpenseCategory }));
  }

  const weekEvents = filterEventsInRange(input.events, input.weekFromMs, input.weekToMs);
  const focusDays = new Set<string>();
  for (const e of weekEvents) {
    if (e.type === "focus_session_completed" || e.type === "pomodoro_completed") {
      const key = localDateKeyFromIso(e.created_at);
      if (key) focusDays.add(key);
    }
  }
  if (focusDays.size >= 3 && tasks >= 2) {
    out.push(t("obsRhythmSteady"));
  }

  if (tasks === 0 && focus === 0 && cleaning === 0 && spent === 0) {
    return [t("obsWeekQuiet"), t("obsWeekGentle")];
  }

  if (out.length === 0) {
    out.push(t("obsWeekGentle"));
  }

  const unique = [...new Set(out)];
  return unique.slice(0, 5);
}

export function topExpenseCategoryInRange(
  rows: FinanceTransaction[],
  fromMs: number,
  toMs: number
): { category: string; total: number } | null {
  const byCat = new Map<string, number>();
  for (const row of rows) {
    if (row.kind !== "expense") continue;
    const ms = new Date(row.created_at).getTime();
    if (Number.isNaN(ms) || ms < fromMs || ms >= toMs) continue;
    const cat = row.category?.trim() || "Other";
    byCat.set(cat, (byCat.get(cat) ?? 0) + row.amount);
  }
  let best: { category: string; total: number } | null = null;
  for (const [category, total] of byCat) {
    if (!best || total > best.total) best = { category, total };
  }
  return best;
}

export function topExpenseCategoryInWeek(
  rows: FinanceTransaction[],
  weekFromMs: number,
  weekToMs: number
): { category: string; total: number } | null {
  return topExpenseCategoryInRange(rows, weekFromMs, weekToMs);
}
