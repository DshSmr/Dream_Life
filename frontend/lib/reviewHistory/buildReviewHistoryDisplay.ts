import type { DailyReview } from "@/lib/api";
import type { Locale } from "@/lib/i18n/types";

export type ReviewHistoryT = (key: string, values?: Record<string, string | number>) => string;

export type ReviewHistoryDisplay = {
  title: string;
  preview: string | null;
};

const ROBOTIC_TITLE = /daily\s*review|gentle\s*look\s*at|\d{4}-\d{2}-\d{2}/i;
const TECHNICAL_SUMMARY =
  /momentum|metrics|red\s*flags|life\s*os|deep-?work|execution|€\d|confidence|pillar|budget\s*check/i;

const PLACEHOLDER_CONCERNS = [
  "no major red flags",
  "no major red flags in the metrics snapshot"
];
const PLACEHOLDER_WINS = ["you kept recording signals in life os"];

function daySeed(dayKey: string): number {
  return [...dayKey].reduce((h, c) => h + c.charCodeAt(0), 0);
}

function weekdayLong(dateStr: string, locale: Locale): string {
  const tag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
  const dt = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString(tag, { weekday: "long" });
}

function isPlaceholderConcern(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return PLACEHOLDER_CONCERNS.some((p) => lower.includes(p));
}

function isPlaceholderWin(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return PLACEHOLDER_WINS.some((p) => lower.includes(p));
}

function isRoboticTitle(title: string): boolean {
  return ROBOTIC_TITLE.test(title.trim());
}

function looksTechnical(text: string): boolean {
  return TECHNICAL_SUMMARY.test(text);
}

function realWins(review: DailyReview): string[] {
  return review.wins.filter((w) => w.trim() && !isPlaceholderWin(w));
}

function realConcerns(review: DailyReview): string[] {
  return review.concerns.filter((c) => c.trim() && !isPlaceholderConcern(c));
}

function pickTitleKey(review: DailyReview, seed: number): string {
  const summary = review.summary.toLowerCase();
  const wins = realWins(review);
  const concerns = realConcerns(review);

  if (concerns.length > 0 && wins.length > 0) return "titleGentleReset";
  if (summary.includes("steady") && (summary.includes("home") || summary.includes("work"))) {
    return seed % 2 === 0 ? "titleSteadierDay" : "titleQuietProgress";
  }
  if (summary.includes("focus") && summary.includes("home")) return "titleCalmEvening";
  if (summary.includes("quiet focus") || summary.includes("room for quiet focus")) {
    return "titleCalmEvening";
  }
  if (summary.includes("home") || summary.includes("cleaning")) {
    return seed % 2 === 0 ? "titleSmallSteps" : "titleQuietProgress";
  }
  if (summary.includes("quieter") || summary.includes("few things completed")) {
    return "titleSmallSteps";
  }
  if (summary.includes("soft day")) return "titleQuietProgress";

  if (seed % 3 === 0) {
    return "titleWeekdayReflection";
  }

  const pool = ["titleQuietProgress", "titleSmallSteps", "titleSteadierDay", "titleCalmEvening", "titleGentleReset"];
  return pool[seed % pool.length]!;
}

export function buildHumanReviewTitle(
  review: DailyReview,
  t: ReviewHistoryT,
  locale: Locale
): string {
  if (!isRoboticTitle(review.title)) return review.title.trim();

  const seed = daySeed(review.date);
  const key = pickTitleKey(review, seed);
  if (key === "titleWeekdayReflection") {
    return t(key, { weekday: weekdayLong(review.date, locale) });
  }
  return t(key);
}

function previewFromSummaryHeuristic(summary: string, t: ReviewHistoryT): string | null {
  const s = summary.toLowerCase();
  if (s.includes("steady day") && s.includes("home")) return t("previewSteadyWorkHome");
  if (s.includes("focus and home care")) return t("previewFocusHome");
  if (s.includes("quieter day") && s.includes("completed")) return t("previewQuietTasks");
  if (s.includes("quiet focus")) return t("previewQuietFocus");
  if (s.includes("home had some gentle")) return t("previewHomeGentle");
  if (s.includes("soft day")) return t("previewSoftDay");
  return null;
}

function previewFromSignals(review: DailyReview, t: ReviewHistoryT): string {
  const wins = realWins(review);
  const concerns = realConcerns(review);
  const summary = review.summary.toLowerCase();

  if (wins.length >= 2 && concerns.length === 0) return t("previewActiveCalm");
  if (concerns.length > 0 && wins.length > 0) return t("previewGentleReset");
  if (summary.includes("focus") && summary.includes("home")) return t("previewFocusHome");
  if (summary.includes("home") || summary.includes("cleaning")) return t("previewHomeGentle");
  if (summary.includes("focus")) return t("previewQuietFocus");
  if (wins.length > 0) return t("previewQuietTasks");
  return t("previewSoftDay");
}

function buildPreviewText(review: DailyReview, t: ReviewHistoryT): string | null {
  const raw = review.summary.trim();
  if (!raw || /^no summary/i.test(raw)) {
    return previewFromSignals(review, t);
  }

  const heuristic = previewFromSummaryHeuristic(raw, t);
  if (heuristic) return heuristic;

  if (raw.length <= 140 && !looksTechnical(raw)) return raw;

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 140 && !looksTechnical(firstSentence)) {
    return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
  }

  return previewFromSignals(review, t);
}

export function buildReviewHistoryDisplay(
  review: DailyReview,
  t: ReviewHistoryT,
  locale: Locale
): ReviewHistoryDisplay {
  return {
    title: buildHumanReviewTitle(review, t, locale),
    preview: buildPreviewText(review, t)
  };
}
