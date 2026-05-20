import type { CleaningZone, FocusSession, TaskItem } from "@/lib/api";
import { isTaskOverdue } from "@/lib/commandCenter";

/** Daily expense total above this (EUR) triggers a finance insight. */
export const HIGH_SPENDING_EUR_THRESHOLD = 100;

export type InsightCategory = "productivity" | "cleaning" | "finance" | "tasks";

export type RuleInsight = {
  id: string;
  category: InsightCategory;
  message: string;
  explanation?: string;
};

export type RuleInsightInput = {
  focusSessions: FocusSession[];
  cleaningZones: CleaningZone[];
  /**
   * Expense signal for "today" (local calendar). Prefer `computeDailyStats(...).expensesTotal` from the event
   * stream when callers already load events; finance API totals are equivalent if every expense emits `expense_added`.
   */
  expensesTodayTotal: number;
  tasks: TaskItem[];
  now?: Date;
  /** Overrides Settings → daily spending limit when omitted uses built-in default (€100). */
  dailySpendingLimitEur?: number;
};

const MAX_INSIGHTS = 3;

function sameLocalDay(iso: string, ref: Date): boolean {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  return (
    t.getFullYear() === ref.getFullYear() && t.getMonth() === ref.getMonth() && t.getDate() === ref.getDate()
  );
}

function hasFocusSessionStartedToday(sessions: FocusSession[], now: Date): boolean {
  return sessions.some((s) => sameLocalDay(s.started_at, now));
}

function firstOverdueZone(zones: CleaningZone[]): CleaningZone | undefined {
  return zones.find((z) => z.status === "overdue");
}

function hasHighPriorityOverdueTask(tasks: TaskItem[], now: Date): boolean {
  return tasks.some(
    (t) => t.priority === "high" && t.status !== "done" && isTaskOverdue(t.due_date, t.status, now)
  );
}

/**
 * Rule-based dashboard insights (no LLM). Evaluates input data and returns up to MAX_INSIGHTS items.
 * Order: cleaning → finance → productivity → tasks (first wins when capped).
 */
export function generateRuleInsights(input: RuleInsightInput): RuleInsight[] {
  const now = input.now ?? new Date();
  const out: RuleInsight[] = [];

  const spendingLimit = input.dailySpendingLimitEur ?? HIGH_SPENDING_EUR_THRESHOLD;

  const overdue = firstOverdueZone(input.cleaningZones);
  if (overdue) {
    const name = overdue.name.trim() || "A zone";
    out.push({
      id: `cleaning-overdue-${overdue.id}`,
      category: "cleaning",
      message: `${name} is overdue for a clean.`,
      explanation: `Based on when it was last done and how often you want it cleaned.`
    });
  }

  if (input.expensesTodayTotal > spendingLimit) {
    out.push({
      id: "finance-high-spending-today",
      category: "finance",
      message: "You spent more than your daily limit today.",
      explanation: `Today's expenses (€${input.expensesTodayTotal.toFixed(0)}) are above your limit (€${spendingLimit}) in Settings.`
    });
  }

  if (!hasFocusSessionStartedToday(input.focusSessions, now)) {
    out.push({
      id: "productivity-no-focus-today",
      category: "productivity",
      message: "No focus time logged yet today.",
      explanation: "A short focus block can help you move one thing forward."
    });
  }

  if (hasHighPriorityOverdueTask(input.tasks, now)) {
    out.push({
      id: "tasks-high-priority-overdue",
      category: "tasks",
      message: "A high-priority task is past its due date.",
      explanation: "Finishing it or adjusting the date might ease the load."
    });
  }

  return out.slice(0, MAX_INSIGHTS);
}
