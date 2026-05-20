import type { EventItem, EventType } from "@/lib/api";

const HIDDEN_TYPES: Set<EventType> = new Set(["focus_ended", "work_started"]);

const PLACEHOLDER_EXACT = new Set([
  "aa",
  "bb",
  "cc",
  "dd",
  "ee",
  "ff",
  "a",
  "b",
  "x",
  "xx",
  "xxx",
  "test",
  "asdf",
  "qwerty",
  "demo",
  "tmp",
  "foo",
  "bar",
  "ыввы",
  "ывы",
  "йцу",
  "asd"
]);

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

/** Short keyboard mash or demo placeholders — hide from the life stream. */
export function isNoiseLabel(label: string): boolean {
  const t = label.trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  if (PLACEHOLDER_EXACT.has(lower)) return true;
  if (t.length <= 2) return true;
  if (t.length <= 4 && !/\s/.test(t)) {
    const vowels = (t.match(/[aeiouyаеёиоуэюя]/gi) ?? []).length;
    if (vowels === 0) return true;
  }
  if (/^(.)\1{2,}$/i.test(t)) return true;
  return false;
}

export function shouldIncludeEventInLifeFlow(event: EventItem): boolean {
  if (HIDDEN_TYPES.has(event.type)) return false;

  const p = event.payload as Record<string, unknown>;
  const note = str(p.note);
  if (note.startsWith("habit_support_action:")) return false;

  // Noise tasks/zones still appear as gentle generic moments (see lifeFlowCopy).

  const taskTitle = str(p.task_title);
  if (taskTitle && isNoiseLabel(taskTitle) && (event.type === "focus_started" || event.type === "focus_session_completed" || event.type === "pomodoro_completed")) {
    return false;
  }

  return true;
}
