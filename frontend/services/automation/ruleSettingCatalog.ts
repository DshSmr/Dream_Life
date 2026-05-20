import type { AutomationSettingCategory } from "@/services/automation/settingsTypes";

/** Static metadata for Settings UI + default toggles. IDs must match `AUTOMATION_RULES` in `rules.ts`. */
export type AutomationRuleSettingMeta = {
  id: string;
  name: string;
  description: string;
  category: AutomationSettingCategory;
  /** Used when the user has no saved preference yet. */
  defaultEnabled: boolean;
};

export const AUTOMATION_RULE_SETTING_CATALOG: readonly AutomationRuleSettingMeta[] = [
  {
    id: "auto-overdue-cleaning-notification",
    name: "Overdue cleaning reminder",
    description: "A gentle note when a home zone is past due.",
    category: "cleaning",
    defaultEnabled: true
  },
  {
    id: "auto-no-focus-recommendation",
    name: "No focus today",
    description: "Suggest a short focus block when none are logged yet.",
    category: "focus",
    defaultEnabled: true
  },
  {
    id: "auto-goal-at-risk-signal",
    name: "Goal needs attention",
    description: "Let you know when a weekly or monthly goal is falling behind.",
    category: "goals",
    defaultEnabled: true
  },
  {
    id: "auto-strong-productivity-insight",
    name: "Steady day note",
    description: "A warm line when tasks, focus, and home care all look good.",
    category: "insights",
    defaultEnabled: false
  },
  {
    id: "auto-high-priority-task-notification",
    name: "Important task reminder",
    description: "When a high-priority task is still open.",
    category: "focus",
    defaultEnabled: true
  },
  {
    id: "auto-high-spend-notification",
    name: "Higher spending today",
    description: "When today's expenses pass your daily limit.",
    category: "insights",
    defaultEnabled: true
  },
  {
    id: "auto-high-priority-task-recommendation",
    name: "Next step: important task",
    description: "Point you toward your top open task.",
    category: "focus",
    defaultEnabled: true
  },
  {
    id: "auto-finance-review-recommendation",
    name: "Check today's spending",
    description: "After a heavier spending day.",
    category: "insights",
    defaultEnabled: true
  },
  {
    id: "auto-quiet-log-recommendation",
    name: "Quiet day nudge",
    description: "After 10:00, if nothing is logged yet.",
    category: "focus",
    defaultEnabled: true
  }
];

const CATALOG_IDS = new Set(AUTOMATION_RULE_SETTING_CATALOG.map((r) => r.id));

export function isKnownAutomationRuleId(id: string): boolean {
  return CATALOG_IDS.has(id);
}
