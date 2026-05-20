import type { CleaningZone, FocusSession } from "@/lib/api";

import { hasFocusTouchToday } from "@/lib/systemStatus";

import type { ResolvedDream } from "@/lib/dream/types";

import type { CurrentStateItem, CurrentStateMood, CurrentStateSnapshot } from "@/lib/currentState/types";

import type { TranslationKey } from "@/lib/i18n/types";



export type BuildCurrentStateInput = {

  tasksCompletedToday: number;

  focusMinutesToday: number;

  cleaningActionsToday: number;

  focusSessions: FocusSession[];

  cleaningZones: CleaningZone[];

  expensesTodayTotal: number;

  dailySpendingLimitEur: number;

  monthlyBalanceDelta: number | null;

  dream?: ResolvedDream | null;

  now?: Date;

};



type TFn = (key: TranslationKey) => string;



function focusSummary(

  focusMinutes: number,

  sessions: FocusSession[],

  now: Date,

  t: TFn

): { summary: string; mood: CurrentStateMood } {

  const inFlight = sessions.some((s) => !s.ended_at);

  if (inFlight) {

    return { summary: t("dashboard.currentState.focusInBlock"), mood: "warm" };

  }

  if (focusMinutes >= 40) {

    return { summary: t("dashboard.currentState.focusGood"), mood: "warm" };

  }

  if (focusMinutes >= 15) {

    return { summary: t("dashboard.currentState.focusSome"), mood: "calm" };

  }

  if (focusMinutes >= 1 || hasFocusTouchToday(sessions, now)) {

    return { summary: t("dashboard.currentState.focusLighter"), mood: "quiet" };

  }

  return { summary: t("dashboard.currentState.focusReady"), mood: "gentle" };

}



function homeSummary(zones: CleaningZone[], t: TFn): { summary: string; mood: CurrentStateMood } {

  if (zones.length === 0) {

    return { summary: t("dashboard.currentState.homeReady"), mood: "gentle" };

  }

  const overdue = zones.filter((z) => z.status === "overdue").length;

  const soon = zones.filter((z) => z.status === "soon").length;

  if (overdue >= 2) {

    return { summary: t("dashboard.currentState.homeWaiting"), mood: "gentle" };

  }

  if (overdue === 1) {

    return { summary: t("dashboard.currentState.homeOneCare"), mood: "gentle" };

  }

  if (soon >= 2) {

    return { summary: t("dashboard.currentState.homeMostlySteady"), mood: "calm" };

  }

  return { summary: t("dashboard.currentState.homeSteady"), mood: "calm" };

}



function moneySummary(

  expensesToday: number,

  dailyLimit: number,

  monthBalance: number | null,

  t: TFn

): { summary: string; mood: CurrentStateMood } {

  const limit = Math.max(1, dailyLimit);

  if (expensesToday > limit * 1.15) {

    return { summary: t("dashboard.currentState.moneyHigh"), mood: "gentle" };

  }

  if (expensesToday > 0 && expensesToday <= limit) {

    return { summary: t("dashboard.currentState.moneyBalanced"), mood: "calm" };

  }

  if (monthBalance !== null && !Number.isNaN(monthBalance)) {

    if (monthBalance < -50) {

      return { summary: t("dashboard.currentState.moneyTight"), mood: "gentle" };

    }

    if (monthBalance > 0) {

      return { summary: t("dashboard.currentState.moneySteadyMonth"), mood: "calm" };

    }

  }

  if (expensesToday === 0) {

    return { summary: t("dashboard.currentState.moneyNothingToday"), mood: "quiet" };

  }

  return { summary: t("dashboard.currentState.moneyBalanced"), mood: "calm" };

}



function energySummary(

  focusMinutes: number,

  tasksCompleted: number,

  t: TFn

): { summary: string; mood: CurrentStateMood } {

  const signal = focusMinutes + tasksCompleted * 8;

  if (signal >= 55) {

    return { summary: t("dashboard.currentState.energySteadyPace"), mood: "warm" };

  }

  if (signal >= 20) {

    return { summary: t("dashboard.currentState.energySteady"), mood: "calm" };

  }

  if (signal >= 1) {

    return { summary: t("dashboard.currentState.energyLow"), mood: "quiet" };

  }

  return { summary: t("dashboard.currentState.energyQuiet"), mood: "gentle" };

}



function dreamSummary(

  dream: ResolvedDream | null | undefined,

  tasksCompleted: number,

  focusMinutes: number,

  cleaningActions: number,

  expensesToday: number,

  t: TFn

): { summary: string; mood: CurrentStateMood } | null {

  if (!dream?.isSet) return null;

  const touched = tasksCompleted > 0 || focusMinutes > 0 || cleaningActions > 0 || expensesToday > 0;

  if (touched) {

    return { summary: t("dashboard.currentState.dreamSmallStep"), mood: "warm" };

  }

  return { summary: t("dashboard.currentState.dreamReady"), mood: "gentle" };

}



function quietDayFootnote(

  focusMinutes: number,

  tasksCompleted: number,

  cleaningActions: number,

  expensesToday: number,

  t: TFn

): string | null {

  if (focusMinutes + tasksCompleted + cleaningActions + (expensesToday > 0 ? 1 : 0) > 0) {

    return null;

  }

  return t("dashboard.currentState.dreamSmallStep");

}



/**

 * Calm, human summaries for how today feels — no scores or productivity labels.

 */

export function buildCurrentState(input: BuildCurrentStateInput, t: TFn): CurrentStateSnapshot {

  const now = input.now ?? new Date();

  const focus = focusSummary(input.focusMinutesToday, input.focusSessions, now, t);

  const home = homeSummary(input.cleaningZones, t);

  const money = moneySummary(

    input.expensesTodayTotal,

    input.dailySpendingLimitEur,

    input.monthlyBalanceDelta,

    t

  );

  const energy = energySummary(input.focusMinutesToday, input.tasksCompletedToday, t);

  const dream = dreamSummary(

    input.dream,

    input.tasksCompletedToday,

    input.focusMinutesToday,

    input.cleaningActionsToday,

    input.expensesTodayTotal,

    t

  );



  const items: CurrentStateItem[] = [

    { key: "focus", title: t("dashboard.currentState.focus"), ...focus },

    { key: "home", title: t("dashboard.currentState.home"), ...home },

    { key: "money", title: t("dashboard.currentState.money"), ...money },

    { key: "energy", title: t("dashboard.currentState.energy"), ...energy }

  ];



  if (dream) {

    items.push({ key: "dream", title: t("dashboard.currentState.dream"), ...dream });

  }



  const footnote = quietDayFootnote(

    input.focusMinutesToday,

    input.tasksCompletedToday,

    input.cleaningActionsToday,

    input.expensesTodayTotal,

    t

  );



  return { items, footnote };

}

