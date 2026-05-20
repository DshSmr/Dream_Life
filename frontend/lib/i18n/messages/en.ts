/**
 * English — source of truth for translation keys.
 * Add new keys here first, then mirror structure in `ru.ts` and `fi.ts`.
 */
import { commonExtraMessages } from "@/lib/i18n/messages/sections/common-extra";
import { dashboardMessages } from "@/lib/i18n/messages/sections/dashboard";
import { financeMessages } from "@/lib/i18n/messages/sections/finance";
import { insightsMessages } from "@/lib/i18n/messages/sections/insights";
import { lifeMessages } from "@/lib/i18n/messages/sections/life";
import { settingsExtraMessages } from "@/lib/i18n/messages/sections/settings-extra";
import { workMessages } from "@/lib/i18n/messages/sections/work";

export const messages = {
  nav: {
    primary: {
      dashboard: "Dashboard",
      work: "Work",
      life: "Life",
      finance: "Finance",
      insights: "Insights",
      settings: "Settings"
    },
    menu: "Menu",
    closeMenu: "Close menu",
    openMenu: "Open menu",
    accountSettings: "Account and settings",
    breadcrumbDashboard: "Dashboard",
    dashboardTabs: {
      overview: "Overview",
      goals: "Goals",
      commandCenter: "Focus",
      dailyPlan: "Today",
      recommendations: "Suggestions",
      notifications: "Notifications"
    },
    workTabs: {
      tasks: "Tasks",
      focus: "Focus",
      pomodoro: "Pomodoro"
    },
    lifeTabs: {
      cleaning: "Cleaning",
      homeHealth: "Home health",
      consistency: "Consistency"
    },
    financeTabs: {
      dashboard: "Dashboard",
      transactions: "Transactions"
    },
    insightsTabs: {
      activity: "Activity",
      patterns: "Patterns",
      lifeFlow: "Life flow",
      review: "Review",
      monthlyReview: "Monthly review",
      today: "Today",
      reviewHistory: "Review history"
    },
    aria: {
      primary: "Primary",
      mobilePrimary: "Primary mobile",
      dashboard: "Dashboard sections",
      work: "Work sections",
      life: "Life sections",
      finance: "Finance sections",
      insights: "Insights sections"
    }
  },
  common: {
    open: "Open",
    openCleaning: "Open cleaning",
    openFinance: "Open finance",
    save: "Save",
    cancel: "Cancel",
    add: "Add",
    viewAll: "View all",
    tryAgain: "Try again",
    loading: "Loading…",
    markDone: "Mark done",
    addZone: "Add zone",
    close: "Close",
    ...commonExtraMessages
  },
  settings: {
    pageTitle: "Settings",
    language: {
      title: "Language",
      description: "Interface language for this browser.",
      displayLanguage: "Display language",
      note: "More copy will follow in your chosen language over time."
    },
    appearance: {
      title: "Appearance",
      description: "Choose how Dream Life looks on this device.",
      themeLabel: "Theme",
      themeDark: "Dark",
      themeLight: "Light",
      themeSystem: "Match device",
      themeMidnight: "Midnight",
      themeSoftDark: "Soft dark",
      themeWarmLight: "Warm light"
    },
    preferences: {
      title: "Preferences"
    },
    automation: {
      title: "Automation"
    },
    developer: {
      title: "Developer tools",
      link: "Developer tools",
      pageDescription: "Manage stored activity on this device when you need a fresh start."
    },
    ...settingsExtraMessages
  },
  empty: {
    homeHealth: {
      title: "Start with one home area",
      description: "Add your first home area to start tracking your space."
    },
    patterns: {
      title: "Rhythms will gather here",
      description: "After a few more gentle sessions, you will notice how your days breathe."
    },
    lifeFlow: {
      title: "Your memory stream will gather here",
      description: "After a few gentle sessions, quiet moments from your days will begin to appear."
    },
    tasks: {
      title: "No tasks here yet",
      description: "Add a task when something is on your mind."
    },
    cleaning: {
      title: "Home care can start small",
      description: "Add a cleaning zone when you want a light rhythm, not a chore list."
    }
  },
  form: {
    zoneName: "Zone name",
    everyDays: "Every (days)",
    taskTitle: "Task title",
    priority: "Priority",
    amount: "Amount",
    category: "Category",
    note: "Note",
    type: "Type"
  },
  dashboard: dashboardMessages,
  work: workMessages,
  life: lifeMessages,
  finance: financeMessages,
  insights: insightsMessages
} as const;
