import type { HomeHealthLevel } from "@/lib/cleaningHealth";

/** Green / red for signed balances and deltas (not plain spending totals). */
export function signedDeltaValueClass(delta: number): string | undefined {
  if (delta > 0) return "text-lifeos-success";
  if (delta < 0) return "text-lifeos-danger";
  return undefined;
}

export function financeMonthPanelTone(balanceDelta: number): "default" | "caution" {
  return balanceDelta < 0 ? "caution" : "default";
}

export function moneyInValueClass(total: number): string | undefined {
  return total > 0 ? "text-lifeos-success" : undefined;
}

export function countWhenPositiveClass(
  count: number,
  tone: "danger" | "warning" | "success"
): string | undefined {
  if (count <= 0) return undefined;
  if (tone === "danger") return "text-lifeos-danger";
  if (tone === "warning") return "text-lifeos-warning";
  return "text-lifeos-success";
}

export function streakValueClass(days: number, kind: "focus" | "cleaning" | "tasks"): string | undefined {
  if (days === 0) return "text-lifeos-fg-muted";
  if (kind === "focus") return "text-lifeos-warning";
  if (kind === "cleaning") return "text-lifeos-success";
  return undefined;
}

export function transactionAmountClass(kind: "income" | "expense"): string {
  return kind === "income" ? "text-lifeos-success" : "text-lifeos-fg-secondary";
}

export function homeHealthLevelClass(level: HomeHealthLevel | null | undefined): string | undefined {
  if (!level) return undefined;
  if (level === "healthy") return "text-lifeos-success";
  if (level === "needs_attention") return "text-lifeos-warning";
  return "text-lifeos-danger";
}
