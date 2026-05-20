import type { Route } from "next";
import type { TranslationKey } from "@/lib/i18n/types";

export type NavLink = {
  href: Route;
  labelKey: TranslationKey;
  prefix: string;
};

export const PRIMARY_NAV: readonly NavLink[] = [
  { href: "/dashboard/overview", labelKey: "nav.primary.dashboard", prefix: "/dashboard" },
  { href: "/work/tasks", labelKey: "nav.primary.work", prefix: "/work" },
  { href: "/life/cleaning", labelKey: "nav.primary.life", prefix: "/life" },
  { href: "/finance/dashboard", labelKey: "nav.primary.finance", prefix: "/finance" },
  { href: "/insights/activity", labelKey: "nav.primary.insights", prefix: "/insights" },
  { href: "/settings", labelKey: "nav.primary.settings", prefix: "/settings" }
] as const;

export type SectionTabDef = {
  href: Route;
  labelKey: TranslationKey;
};

export const DASHBOARD_TABS: readonly SectionTabDef[] = [
  { href: "/dashboard/overview", labelKey: "nav.dashboardTabs.overview" },
  { href: "/dashboard/goals", labelKey: "nav.dashboardTabs.goals" },
  { href: "/dashboard/command-center", labelKey: "nav.dashboardTabs.commandCenter" },
  { href: "/dashboard/daily-plan", labelKey: "nav.dashboardTabs.dailyPlan" },
  { href: "/dashboard/recommendations", labelKey: "nav.dashboardTabs.recommendations" },
  { href: "/dashboard/notifications", labelKey: "nav.dashboardTabs.notifications" }
] as const;

export const WORK_TABS: readonly SectionTabDef[] = [
  { href: "/work/tasks", labelKey: "nav.workTabs.tasks" },
  { href: "/work/focus", labelKey: "nav.workTabs.focus" },
  { href: "/work/pomodoro", labelKey: "nav.workTabs.pomodoro" }
] as const;

export const LIFE_TABS: readonly SectionTabDef[] = [
  { href: "/life/cleaning", labelKey: "nav.lifeTabs.cleaning" },
  { href: "/life/home-health", labelKey: "nav.lifeTabs.homeHealth" },
  { href: "/life/consistency", labelKey: "nav.lifeTabs.consistency" }
] as const;

export const FINANCE_TABS: readonly SectionTabDef[] = [
  { href: "/finance/dashboard", labelKey: "nav.financeTabs.dashboard" },
  { href: "/finance/transactions", labelKey: "nav.financeTabs.transactions" }
] as const;

export const INSIGHTS_TABS: readonly SectionTabDef[] = [
  { href: "/insights/activity", labelKey: "nav.insightsTabs.activity" },
  { href: "/insights/patterns", labelKey: "nav.insightsTabs.patterns" },
  { href: "/insights/timeline", labelKey: "nav.insightsTabs.lifeFlow" },
  { href: "/insights/review", labelKey: "nav.insightsTabs.review" },
  { href: "/insights/monthly-review", labelKey: "nav.insightsTabs.monthlyReview" },
  { href: "/insights/ai-insight", labelKey: "nav.insightsTabs.today" },
  { href: "/insights/ai-reviews", labelKey: "nav.insightsTabs.reviewHistory" }
] as const;
