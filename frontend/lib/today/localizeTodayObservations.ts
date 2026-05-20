import type { RuleInsight } from "@/services/insights";
import type { TodayT } from "@/lib/today/buildTodayInsight";

/** Calm copy for rule-based observations on the Today page. */
export function localizeTodayObservation(item: RuleInsight, t: TodayT): RuleInsight {
  if (item.id.startsWith("cleaning-overdue-")) {
    const name = item.message.split(" is ")[0]?.trim() || t("obsZoneFallback");
    return {
      ...item,
      message: t("obsZoneWaiting", { zone: name }),
      explanation: t("obsZoneWaitingWhy")
    };
  }
  if (item.id === "finance-high-spending-today") {
    return {
      ...item,
      message: t("obsSpendingNoticed"),
      explanation: t("obsSpendingNoticedWhy")
    };
  }
  if (item.id === "productivity-no-focus-today") {
    return {
      ...item,
      message: t("obsFocusQuiet"),
      explanation: t("obsFocusQuietWhy")
    };
  }
  if (item.id === "tasks-high-priority-overdue") {
    return {
      ...item,
      message: t("obsTaskWaiting"),
      explanation: t("obsTaskWaitingWhy")
    };
  }
  return item;
}
