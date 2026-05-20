import type { DreamLayerContext, DreamPresetId, ResolvedDream } from "@/lib/dream/types";



type MessageSet = {

  quiet: string[];

  active: string[];

  steady: string[];

};



const PRESET_MESSAGES: Record<DreamPresetId, MessageSet> = {

  home: {

    quiet: ["Quiet day. Still counts.", "Rest is part of it too.", "One step toward home."],

    active: ["Today moved things forward.", "Progress toward home.", "Good day for your home goal."],

    steady: ["Steady progress toward home.", "No big day needed.", "Home goal is still set."]

  },

  stability: {

    quiet: ["Quiet day. Your goal is still there.", "Small moments add up.", "Nothing urgent today."],

    active: ["Today helped your savings goal.", "Progress toward stability.", "Logged activity fits your goal."],

    steady: ["Steady progress on finances.", "Balance builds slowly.", "Go at your own pace."]

  },

  calm: {

    quiet: ["Quiet day fits the plan.", "Stillness counts.", "You do not need a full schedule."],

    active: ["Room for calm and action today.", "Progress toward a calmer life.", "Today supported ease."],

    steady: ["Steady steps toward calm.", "Consistency over intensity.", "No need to rush."]

  },

  health: {

    quiet: ["Quiet day still supports health.", "Rest is part of it.", "One step for your body."],

    active: ["Today supported your health goal.", "Progress on wellbeing.", "What you logged counts."],

    steady: ["Steady steps on health.", "Ordinary days matter.", "Go at your own pace."]

  },

  business: {

    quiet: ["Quiet day. The work is still there.", "Ideas and rest can coexist.", "One step on what you build."],

    active: ["Today supported your project.", "Progress on what you build.", "Logged work counts."],

    steady: ["Steady work adds up.", "Quiet days are allowed.", "Your goal is still set."]

  },

  "less-overwhelmed": {

    quiet: ["Quiet day. Less pressure is fine.", "Ease is part of the plan.", "One small step today."],

    active: ["Today felt a bit lighter.", "Progress toward less overwhelm.", "You did not need to do everything."],

    steady: ["Steady beats intense.", "You do not have to carry it all.", "Small steps are enough."]

  }

};



const CUSTOM_MESSAGES: MessageSet = {

  quiet: ["Quiet day. Still counts.", "Rest is allowed.", "One small step today."],

  active: ["Today fit your direction.", "Progress on what matters.", "What you logged counts."],

  steady: ["Steady is enough.", "No perfect day required.", "Your direction is still set."]

};



function localDayKey(): string {

  const d = new Date();

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

}



function pickStable(items: string[], seed: string): string {

  if (items.length === 0) return "";

  let h = 0;

  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;

  return items[Math.abs(h) % items.length]!;

}



function activityKind(ctx: DreamLayerContext): keyof MessageSet {

  const activity =

    ctx.tasksCompletedToday + (ctx.focusMinutesToday >= 10 ? 2 : ctx.focusMinutesToday > 0 ? 1 : 0) + ctx.planItemsDone;

  if (activity >= 2) return "active";

  if (activity === 0 && !ctx.hasNextAction) return "quiet";

  return "steady";

}



function messagesForDream(dream: ResolvedDream): MessageSet {

  if (!dream.isSet) return { quiet: [], active: [], steady: [] };

  if (dream.id === "custom") return CUSTOM_MESSAGES;

  if (dream.id && dream.id in PRESET_MESSAGES) return PRESET_MESSAGES[dream.id as DreamPresetId];

  return CUSTOM_MESSAGES;

}



/** One line for dashboard surfaces. Stable for the day, shifts with activity. */

export function pickDreamWhisper(dream: ResolvedDream, ctx: DreamLayerContext): string | null {

  if (!dream.isSet) return null;

  const set = messagesForDream(dream);

  const kind = activityKind(ctx);

  const pool = set[kind];

  const seed = `${localDayKey()}-${dream.id}-${kind}-${dream.label}`;

  return pickStable(pool, seed);

}



export function pickNextStepDreamNote(dream: ResolvedDream, ctx: DreamLayerContext): string | null {

  if (!dream.isSet || ctx.hasNextAction) return null;

  if (activityKind(ctx) === "quiet") {

    return pickDreamWhisper(dream, ctx);

  }

  return "Nothing urgent. Your direction is still set.";

}

