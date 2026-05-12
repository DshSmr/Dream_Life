/** Default matches README / uvicorn --port 8765 (port 8000 often triggers WinError 10013 on Windows). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8765";

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
    return (
      `Cannot reach the Life OS API at ${API_URL}. ` +
      `Start the backend (from the backend folder): python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8765. ` +
      `If the UI uses a different API host, set NEXT_PUBLIC_API_URL in frontend/.env.local and restart Next.js.`
    );
  }
  return raw;
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
