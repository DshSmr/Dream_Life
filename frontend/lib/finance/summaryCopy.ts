type FinanceT = (key: string, values?: Record<string, string | number>) => string;

export function buildFinanceMonthSummary(
  t: FinanceT,
  balanceDelta: number,
  todaySpend: number,
  formatEur: (amount: number) => string
): { primary: string; secondary: string } {
  const primary =
    balanceDelta >= 0
      ? t("summaryLeft", { balance: formatEur(balanceDelta) })
      : t("summaryMoreOut", { amount: formatEur(Math.abs(balanceDelta)) });

  const secondary =
    todaySpend <= 0 ? t("summaryNoSpendToday") : t("summaryOutToday", { spent: formatEur(todaySpend) });

  return { primary, secondary };
}
