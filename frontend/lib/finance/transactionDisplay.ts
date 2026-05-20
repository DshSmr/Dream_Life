import type { FinanceKind, FinanceTransaction } from "@/lib/api";
import { formatCleaningWhen } from "@/lib/cleaning/display";

type FinanceT = (key: string, values?: Record<string, string | number>) => string;

export function formatSignedMoneyAmount(kind: FinanceKind, amount: number): string {
  const sign = kind === "income" ? "+" : "−";
  return `${sign}€${amount.toFixed(2)}`;
}

export function transactionTitle(tx: FinanceTransaction): string {
  const note = tx.note?.trim();
  if (note) return note;
  return tx.category.trim() || "—";
}

export function transactionSubtitle(tx: FinanceTransaction, t: FinanceT): string | null {
  const note = tx.note?.trim();
  const category = tx.category.trim();
  if (note && category) return category;
  if (!note && category) {
    return tx.kind === "income" ? t("subtitleMoneyIn") : t("subtitleMoneyOut");
  }
  return null;
}

export function transactionWhenLabel(
  tx: FinanceTransaction,
  now: Date,
  locale: string,
  t: FinanceT
): string {
  return formatCleaningWhen(tx.created_at, now, locale, t);
}
