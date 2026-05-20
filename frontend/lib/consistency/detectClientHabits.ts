import type { DetectedHabit, EventItem, HabitSupportAction } from "@/lib/api";

const FOCUS_EVENT_TYPES = new Set(["focus_started", "focus_session_completed"]);
const MORNING_HOUR_START = 5;
const MORNING_HOUR_END = 11;

type HabitRow = {
  id: string;
  category: DetectedHabit["category"];
  confidence: number;
  frequency: string;
  message: string;
  supportMeta?: Record<string, unknown>;
};

function enrichClientHabit(row: HabitRow): DetectedHabit {
  const { supportMeta, ...base } = row;
  const hid = base.id;
  const actions: HabitSupportAction[] = [];

  if (hid === "habit-morning-focus") {
    actions.push({
      id: `${hid}-start-focus-25`,
      habitId: hid,
      label: "Try an earlier focus block tomorrow",
      type: "mutation",
      target: "focus_session_start",
      payload: { label: "Morning focus (25m)" }
    });
  } else if (hid === "habit-cleaning-consistency") {
    actions.push({
      id: `${hid}-daily-plan-clean`,
      habitId: hid,
      label: "Add a small cleaning pass to today",
      type: "plan_item",
      target: "daily_plan",
      payload: {
        planItemId: "habit-support-cleaning-rhythm",
        title: "A small cleaning pass today",
        category: "cleaning",
        priority: "medium"
      }
    });
  } else if (hid.startsWith("habit-spend-")) {
    const cat = String(supportMeta?.topExpenseCategory ?? "spending");
    actions.push({
      id: `${hid}-review-expenses`,
      habitId: hid,
      label: `Review “${cat}” expenses`,
      type: "navigate",
      target: "/finance/dashboard",
      payload: { category: cat }
    });
  } else if (hid.startsWith("habit-task-hour-")) {
    actions.push({
      id: `${hid}-plan-before-window`,
      habitId: hid,
      label: "Start with one important task in the morning",
      type: "plan_item",
      target: "daily_plan",
      payload: {
        planItemId: "habit-support-task-rhythm",
        title: "One important task for the morning",
        category: "task",
        priority: "high"
      }
    });
  }

  return { ...base, suggestedActions: actions };
}

function detectMorningFocus(events: EventItem[], lookbackDays: number): HabitRow | null {
  const relevant = events.filter((e) => FOCUS_EVENT_TYPES.has(e.type) && e.created_at);
  if (relevant.length < 8) return null;
  let morningN = 0;
  for (const e of relevant) {
    const h = new Date(e.created_at).getUTCHours();
    if (h >= MORNING_HOUR_START && h <= MORNING_HOUR_END) morningN += 1;
  }
  const ratio = morningN / relevant.length;
  if (ratio < 0.52) return null;
  const confidence = Math.min(0.93, 0.48 + ratio * 0.44);
  return {
    id: "habit-morning-focus",
    category: "focus",
    confidence: Math.round(confidence * 1000) / 1000,
    frequency: `Often in the morning over the last ~${lookbackDays} days`,
    message: "Your mornings often become focused naturally."
  };
}

function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function pstdev(nums: number[]): number {
  if (nums.length === 0) return 0;
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}

function detectCleaningConsistency(events: EventItem[]): HabitRow | null {
  const days = new Set<string>();
  for (const e of events) {
    if (e.type !== "cleaning_done" || !e.created_at) continue;
    const d = new Date(e.created_at);
    days.add(`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`);
  }
  const uniqueSorted = [...days].sort();
  if (uniqueSorted.length < 6) return null;

  const gaps: number[] = [];
  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1]).getTime();
    const cur = new Date(uniqueSorted[i]).getTime();
    gaps.push(Math.round((cur - prev) / 86_400_000));
  }
  if (gaps.length === 0) return null;

  const medianGap = median(gaps);
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (meanGap < 1.6 || medianGap < 2 || medianGap > 16) return null;

  const cv = meanGap > 0 ? pstdev(gaps) / meanGap : 1;
  if (cv > 0.72) return null;

  const confidence = Math.min(0.9, 0.52 + (1 - Math.min(cv, 1)) * 0.28 + Math.min(gaps.length, 24) * 0.006);
  return {
    id: "habit-cleaning-consistency",
    category: "cleaning",
    confidence: Math.round(confidence * 1000) / 1000,
    frequency: `Steady spacing across ${uniqueSorted.length} cleaning days lately`,
    message: "Cleaning has stayed steady lately.",
    supportMeta: { medianGapDays: Math.round(medianGap * 100) / 100 }
  };
}

function detectSpendingCategory(events: EventItem[]): HabitRow | null {
  const cats: string[] = [];
  for (const e of events) {
    if (e.type !== "expense_added") continue;
    const raw = e.payload?.category;
    cats.push(typeof raw === "string" && raw.trim() ? raw.trim() : "Uncategorized");
  }
  if (cats.length < 10) return null;

  const counts = new Map<string, number>();
  for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
  let topCat = "";
  let topN = 0;
  for (const [cat, n] of counts) {
    if (n > topN) {
      topN = n;
      topCat = cat;
    }
  }
  const share = topN / cats.length;
  if (share < 0.34) return null;

  const confidence = Math.min(0.88, 0.42 + share * 0.52);
  const slug =
    topCat
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "general";

  return {
    id: `habit-spend-${slug}`,
    category: "finance",
    confidence: Math.round(confidence * 1000) / 1000,
    frequency: `Often in “${topCat}” lately`,
    message: `Spending has often centered on ${topCat}.`,
    supportMeta: { topExpenseCategory: topCat }
  };
}

function detectTaskCompletionRhythm(events: EventItem[]): HabitRow | null {
  const hours: number[] = [];
  for (const e of events) {
    if (e.type !== "task_completed" || !e.created_at) continue;
    hours.push(new Date(e.created_at).getUTCHours());
  }
  if (hours.length < 12) return null;

  const counts = new Map<number, number>();
  for (const h of hours) counts.set(h, (counts.get(h) ?? 0) + 1);
  let peakHour = 0;
  let peakN = 0;
  for (const [h, n] of counts) {
    if (n > peakN) {
      peakN = n;
      peakHour = h;
    }
  }
  const share = peakN / hours.length;
  if (share < 0.38) return null;

  const confidence = Math.min(0.87, 0.45 + share * 0.46);
  const nextHour = (peakHour + 1) % 24;

  return {
    id: `habit-task-hour-${peakHour}`,
    category: "productivity",
    confidence: Math.round(confidence * 1000) / 1000,
    frequency: `Often around ${peakHour}:00–${nextHour}:00 lately`,
    message: "You often finish tasks around a familiar time of day.",
    supportMeta: { peakHourUtc: peakHour }
  };
}

/** Local fallback when GET /habits/detected is unavailable (same rules as backend detectors). */
export function detectClientHabits(events: EventItem[], lookbackDays = 45): DetectedHabit[] {
  const days = Math.max(14, Math.min(lookbackDays, 120));
  const rows: HabitRow[] = [];
  const morning = detectMorningFocus(events, days);
  if (morning) rows.push(morning);
  const cleaning = detectCleaningConsistency(events);
  if (cleaning) rows.push(cleaning);
  const spending = detectSpendingCategory(events);
  if (spending) rows.push(spending);
  const tasks = detectTaskCompletionRhythm(events);
  if (tasks) rows.push(tasks);

  return rows
    .map(enrichClientHabit)
    .sort((a, b) => b.confidence - a.confidence);
}
