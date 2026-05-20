/**
 * Base URL for API calls.
 * - Browser (no env): uses same-origin `/life-os-api` → proxied by Next to uvicorn (see `next.config.mjs`).
 * - Server / SSR: uses `http://127.0.0.1:8765` directly so Node can reach the backend without going through Next.
 * - Override anytime: `NEXT_PUBLIC_API_URL` in `.env.local` (e.g. production API URL).
 */
function resolveApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (env) return env;
  if (typeof window !== "undefined") {
    return "/life-os-api";
  }
  return "http://127.0.0.1:8765";
}

export const API_URL = resolveApiBaseUrl();

/**
 * `fetch` throws TypeError/Error with "Failed to fetch" when the server is down, URL is wrong, or CORS blocks the response.
 */
export function describeFetchFailure(reason: unknown): string {
  const raw =
    reason instanceof TypeError
      ? reason.message
      : reason instanceof Error
        ? reason.message
        : String(reason);
  if (
    raw === "Failed to fetch" ||
    raw.startsWith("NetworkError") ||
    raw === "Load failed" ||
    raw === "The Internet connection appears to be offline."
  ) {
    return "We could not reach Dream Life. Check your connection and try again.";
  }
  return raw;
}

/** Non-OK fetch: include HTTP status and truncated body (often FastAPI `detail` or DB error text). */
export async function errorFromResponse(response: Response, label: string): Promise<Error> {
  let detail = "";
  try {
    const text = await response.text();
    detail = text ? `: ${text.slice(0, 320)}` : "";
  } catch {
    /* ignore body read errors */
  }
  let msg = `${label} (${response.status}${detail})`;
  if (
    /OperationalError|connection refused|could not connect|Connection refused/i.test(msg) ||
    (response.status >= 500 && /postgres|psycopg|5432|5433/i.test(msg))
  ) {
    msg = "Something went wrong loading your data. Try again in a moment.";
  }
  return new Error(msg);
}

export type EventType =
  | "work_started"
  | "focus_started"
  | "focus_ended"
  | "focus_session_completed"
  | "pomodoro_completed"
  | "task_completed"
  | "income_added"
  | "expense_added"
  | "cleaning_done";

export type EventItem = {
  id: string;
  type: EventType;
  source: "web" | "iot" | "system";
  payload: Record<string, unknown>;
  created_at: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskEnergyType = "high_focus" | "low_energy" | "creative" | "admin";

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  /** Present after API supports task energy; treat missing as unset. */
  energy_type?: TaskEnergyType | null;
  created_at: string;
  completed_at: string | null;
};

export type DailySummary = {
  date: string;
  events_total: number;
  tasks_created: number;
  tasks_in_progress: number;
  tasks_completed: number;
  pomodoros_completed: number;
  income_added: number;
  expenses_added: number;
  cleanings_done: number;
  income_total: number;
  expense_total: number;
  balance_delta: number;
};

/** Materialized UTC-day snapshot from GET /analytics/daily-snapshot */
export type DailySnapshotSystemState = {
  mind: string;
  home: string;
  finance: string;
};

export type DailySnapshot = {
  date: string;
  tasks_completed: number;
  focus_minutes: number;
  expenses_total: number;
  cleaning_completed: number;
  home_health_score: number | null;
  system_state: DailySnapshotSystemState;
  created_at: string;
  updated_at: string;
};

export type FinanceKind = "income" | "expense";

export type FinanceTransaction = {
  id: string;
  kind: FinanceKind;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
};

export type FinanceRangeSummary = {
  income_total: number;
  expense_total: number;
  balance_delta: number;
};

export type CleaningStatus = "ok" | "soon" | "overdue";

export type CleaningZone = {
  id: string;
  name: string;
  frequency_days: number;
  last_cleaned_at: string | null;
  status: CleaningStatus;
  created_at: string;
};

export type FocusSession = {
  id: string;
  label: string | null;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

export type DailyInsight = {
  date: string;
  headline: string;
  summary: string;
  recommendations: string[];
};

/** POST/GET /ai/daily-review and /ai/reviews — structured narrative review (persisted per day). */
export type DailyReview = {
  date: string;
  title: string;
  summary: string;
  wins: string[];
  concerns: string[];
  tomorrowPlan: string[];
  fallback: boolean;
  id?: string;
  created_at?: string | null;
  /** True when returned from DB without regenerating. */
  from_storage?: boolean;
};

/** POST /ai/monthly-review — on-demand month narrative (not persisted). */
export type MonthlyReview = {
  monthLabel: string;
  title: string;
  summary: string;
  wins: string[];
  risks: string[];
  patterns: string[];
  nextMonthFocus: string[];
  fallback: boolean;
};

export type PomodoroSession = {
  id: string;
  label: string | null;
  task_id: string | null;
  work_minutes: number;
  break_minutes: number;
  status: string;
  started_at: string;
  ended_at: string | null;
};

/** Persisted feedback for adaptive recommendations (POST /recommendations/feedback). */
export type RecommendationOutcome = "accepted" | "ignored" | "dismissed";

export type RecommendationFeedback = {
  recommendationId: string;
  outcome: RecommendationOutcome;
  timestamp: string;
};

/** GET /recommendations/adaptive-context — tuning merged from timing / priority / frequency modules. */
export type RecommendationAdjustment = {
  priority_weight: number;
  confidence: number;
  avoid_hours_local: number[];
  prefer_hours_local: number[];
  defer_show_until_hour_local: number | null;
  min_minutes_between_suggestions: number;
};

export type AdaptiveContext = {
  adjustments: Record<string, RecommendationAdjustment>;
};

export async function fetchAdaptiveContext(baseUrl: string = API_URL): Promise<AdaptiveContext> {
  const res = await fetch(`${baseUrl}/recommendations/adaptive-context`, { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Adaptive context failed (${res.status})`);
  }
  return res.json() as Promise<AdaptiveContext>;
}

export type DetectedHabitCategory = "focus" | "cleaning" | "finance" | "productivity";

export type HabitSupportActionType = "navigate" | "mutation" | "plan_item";

export type HabitSupportAction = {
  id: string;
  habitId: string;
  label: string;
  type: HabitSupportActionType;
  target?: string;
  payload?: Record<string, unknown>;
};

export type DetectedHabit = {
  id: string;
  category: DetectedHabitCategory;
  confidence: number;
  frequency: string;
  message: string;
  suggestedActions: HabitSupportAction[];
};

export async function fetchDetectedHabits(days = 45, baseUrl: string = API_URL): Promise<DetectedHabit[]> {
  const res = await fetch(`${baseUrl}/habits/detected?days=${days}`, { cache: "no-store" });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Detected habits failed (${res.status})`);
  }
  return res.json() as Promise<DetectedHabit[]>;
}

export type ClearAppHistoryResult = {
  ok: boolean;
  cleared: Record<string, number>;
  message: string;
};

export async function clearAppHistory(baseUrl: string = API_URL): Promise<ClearAppHistoryResult> {
  const res = await fetch(`${baseUrl}/app/clear-history`, { method: "POST" });
  if (!res.ok) {
    throw await errorFromResponse(res, "Could not clear history");
  }
  return (await res.json()) as ClearAppHistoryResult;
}

export async function resetAllAppData(baseUrl: string = API_URL): Promise<ClearAppHistoryResult> {
  const res = await fetch(`${baseUrl}/app/reset-all-data`, { method: "POST" });
  if (!res.ok) {
    throw await errorFromResponse(res, "Could not reset data");
  }
  return (await res.json()) as ClearAppHistoryResult;
}

export async function postRecommendationFeedback(
  payload: {
    recommendation_id: string;
    outcome: RecommendationOutcome;
    local_hour?: number | null;
  },
  baseUrl: string = API_URL
): Promise<void> {
  const res = await fetch(`${baseUrl}/recommendations/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recommendation_id: payload.recommendation_id,
      outcome: payload.outcome,
      local_hour: payload.local_hour ?? null,
      timestamp: new Date().toISOString()
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Recommendation feedback failed (${res.status})`);
  }
}
