"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, FinanceKind, FinanceRangeSummary, FinanceTransaction } from "@/lib/api";
import { formatEurPlain } from "@/lib/commandCenter";
import { buildFinanceMonthSummary } from "@/lib/finance/summaryCopy";
import {
  financeMonthPanelTone,
  moneyInValueClass,
  signedDeltaValueClass
} from "@/lib/semanticTone";
import { getLocalMonthRangeIso, localCalendarDayKeyFromDate } from "@/lib/datetime";
import {
  buildDaySeries,
  financeExpenseByDay,
  financeTodaySpend,
  largestExpenseToday,
  lastNDayKeys,
  topCategoriesLast7Days
} from "@/lib/operational/metrics";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { FormField } from "@/components/ui/FormField";
import { BodyText } from "@/components/ui/typography";
import { MoneyActivityFeed } from "@/components/finance/MoneyActivityFeed";
import {
  ActivityRow,
  CollapsibleQuickForm,
  OperationalMetricBand,
  WeeklyActivityRhythm,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalStatePanel,
  OperationalTwoColumn,
  RecentActivityBlock
} from "@/components/operational/OperationalPrimitives";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useSelectStringHandler
} from "@/components/ui/select";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { sendWithOfflineQueue } from "@/services/offlineQueue";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

export type FinanceTabVariant = "full" | "dashboard" | "transactions";

export default function FinancePageClient({ variant = "full" }: { variant?: FinanceTabVariant }) {
  const { t, locale } = useTranslations("finance");
  const { t: tCommon } = useTranslations();
  const [now] = useState(() => new Date());
  const todayKey = localCalendarDayKeyFromDate(now);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [kind, setKind] = useState<FinanceKind>("expense");
  const onKindChange = useSelectStringHandler((v) => setKind(v as FinanceKind));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [monthTotals, setMonthTotals] = useState<FinanceRangeSummary | null>(null);
  const realtimeEpoch = useLifeOsRealtimeEpoch();

  const loadTransactions = useCallback(async () => {
    const response = await fetch(`${API_URL}/finance/transactions?limit=80`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch finance transactions");
    setTransactions(await response.json());
  }, []);

  const loadMonthTotals = useCallback(async () => {
    const { from, to } = getLocalMonthRangeIso();
    const response = await fetch(
      `${API_URL}/finance/summary/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Failed to fetch monthly finance summary");
    setMonthTotals(await response.json());
  }, []);

  useEffect(() => {
    const loaders =
      variant === "dashboard"
        ? [loadMonthTotals()]
        : variant === "transactions"
          ? [loadTransactions()]
          : [loadTransactions(), loadMonthTotals()];
    Promise.all(loaders).catch((err: Error) => setError(err.message));
  }, [variant, loadTransactions, loadMonthTotals]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    const loaders =
      variant === "dashboard"
        ? [loadMonthTotals()]
        : variant === "transactions"
          ? [loadTransactions()]
          : [loadTransactions(), loadMonthTotals()];
    Promise.all(loaders).catch((err: Error) => setError(err.message));
  }, [realtimeEpoch, variant, loadTransactions, loadMonthTotals]);

  async function onCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t("amountInvalid"));
      toast.error(t("amountInvalid"));
      return;
    }
    if (!category.trim()) {
      setError(t("categoryRequired"));
      toast.error(t("categoryRequired"));
      return;
    }
    try {
      const txBody = {
        kind,
        amount: parsedAmount,
        category: category.trim(),
        note: note.trim() || null
      };
      const result = await sendWithOfflineQueue({ kind: "post_finance_transaction", body: txBody }, () =>
        fetch(`${API_URL}/finance/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(txBody)
        })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        setAmount("");
        setCategory("");
        setNote("");
        await Promise.all([loadTransactions(), loadMonthTotals()]);
        return;
      }
      if (!result.response.ok) {
        setError(t("createFailed"));
        toast.error(t("createFailed"));
        return;
      }
      setAmount("");
      setCategory("");
      setNote("");
      toast.success(t("transactionAdded"));
      await Promise.all([loadTransactions(), loadMonthTotals()]);
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(tCommon("common.toast.couldNotConnect"));
    }
  }

  const monthSummary = monthTotals ?? { income_total: 0, expense_total: 0, balance_delta: 0 };
  const monthHasNoTransactions = monthSummary.income_total === 0 && monthSummary.expense_total === 0;
  const dayKeys = useMemo(() => lastNDayKeys(7), []);
  const todaySpend = useMemo(() => financeTodaySpend(transactions), [transactions]);
  const spendTrend = useMemo(
    () => buildDaySeries(dayKeys, financeExpenseByDay(transactions, dayKeys)),
    [dayKeys, transactions]
  );
  const topCategories = useMemo(() => topCategoriesLast7Days(transactions), [transactions]);
  const unusual = useMemo(() => largestExpenseToday(transactions), [transactions]);
  const monthSummaryCopy = useMemo(
    () => buildFinanceMonthSummary(t, monthSummary.balance_delta, todaySpend, formatEurPlain),
    [t, monthSummary.balance_delta, todaySpend]
  );
  const hasSpendRhythm = variant !== "dashboard" && spendTrend.some((d) => d.value > 0);

  const weekdayShort = useCallback(
    (dayKey: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
      if (!m) return dayKey;
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      const tag = locale === "fi" ? "fi-FI" : locale === "ru" ? "ru-RU" : "en-GB";
      return d.toLocaleDateString(tag, { weekday: "short" }).slice(0, 2);
    },
    [locale]
  );

  const monthMetricStrip = (
    <OperationalMetricBand>
      <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-4">
        <OperationalMetricCell label={t("todayOut")} value={formatEurPlain(todaySpend)} />
        <OperationalMetricCell
          label={t("moneyIn")}
          value={formatEurPlain(monthSummary.income_total)}
          valueClassName={moneyInValueClass(monthSummary.income_total)}
        />
        <OperationalMetricCell label={t("moneyOut")} value={formatEurPlain(monthSummary.expense_total)} />
        <OperationalMetricCell
          label={t("leftThisMonth")}
          value={formatEurPlain(monthSummary.balance_delta)}
          valueClassName={signedDeltaValueClass(monthSummary.balance_delta)}
        />
      </div>
      {hasSpendRhythm ? (
        <WeeklyActivityRhythm
          series={spendTrend}
          ariaLabel={t("spendRhythmAria")}
          dayTitle={(d) => `${d.label}: €${d.value.toFixed(0)}`}
          weekdayShort={weekdayShort}
          todayKey={todayKey}
        />
      ) : null}
    </OperationalMetricBand>
  );

  const financeStatePanel = (
    <OperationalStatePanel title={t("thisMonth")} tone="default">
      {monthHasNoTransactions ? (
        <CalmEmptyState
          tone="finance"
          size="inline"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <div className="space-y-ds-1 text-sm leading-relaxed text-lifeos-fg-secondary">
          <p
            className={cn(
              "text-lifeos-fg",
              signedDeltaValueClass(monthSummary.balance_delta)
            )}
          >
            {monthSummaryCopy.primary}
          </p>
          <p className="text-lifeos-fg-muted">{monthSummaryCopy.secondary}</p>
          {unusual ? (
            <p className="pt-ds-1 text-lifeos-fg-muted">
              {t("largestToday")} {formatEurPlain(unusual.amount)} ({unusual.category})
            </p>
          ) : null}
        </div>
      )}
    </OperationalStatePanel>
  );

  const monthFootnote = (
    <BodyText as="p" className={cn("mt-ds-2", ds.typography.bodyMuted)}>
      {t("monthFootnote")}
    </BodyText>
  );

  const quickAddForm = (
    <CollapsibleQuickForm label={t("logTransaction")}>
      <form onSubmit={onCreateTransaction} className={cn(ui.formGrid, "gap-ds-2")}>
        <FormField id="tx-kind" label={t("type")}>
          <Select
            value={kind}
            onValueChange={onKindChange}
            items={{ expense: t("expense"), income: t("income") }}
          >
            <SelectTrigger id="tx-kind" className="w-full">
              <SelectValue placeholder={t("type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">{t("expense")}</SelectItem>
              <SelectItem value="income">{t("income")}</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="tx-amount" label={t("amount")}>
          <Input
            id="tx-amount"
            className="tabular-nums"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("amountPlaceholder")}
            inputMode="decimal"
          />
        </FormField>
        <FormField id="tx-category" label={t("category")}>
          <Input
            id="tx-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("categoryPlaceholder")}
            autoComplete="off"
          />
        </FormField>
        <FormField id="tx-note" label={t("note")} optional>
          <Input id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("notePlaceholder")} autoComplete="off" />
        </FormField>
        <div className="flex justify-end md:col-span-2">
          <Button className="h-10 rounded-ds-button" type="submit" variant="primary" size="md">
            {t("addButton")}
          </Button>
        </div>
      </form>
    </CollapsibleQuickForm>
  );

  const categoryInsight =
    topCategories.length > 0 ? (
      <RecentActivityBlock title={t("topCategories")}>
        {topCategories.map((c) => (
          <ActivityRow key={c.category} primary={c.category} secondary={formatEurPlain(c.total)} />
        ))}
      </RecentActivityBlock>
    ) : null;

  const transactionsList = (
    <MoneyActivityFeed
      transactions={transactions}
      t={t}
      title={t("recentMovement")}
      emptyTitle={t("txEmptyTitle")}
      emptyDescription={t("txEmptyDescription")}
      now={now}
      locale={locale}
    />
  );

  if (variant === "dashboard") {
    return (
      <div className={ui.contentClass}>
        <section className={cn(ui.panelClass, "space-y-ds-5")}>
          <OperationalPageHeader title={t("dashboardTitle")} description={t("dashboardDescription")} />
          {error && <p className="text-sm text-lifeos-danger">{error}</p>}
          {financeStatePanel}
          {monthMetricStrip}
          {monthFootnote}
        </section>
      </div>
    );
  }

  if (variant === "transactions") {
    return (
      <div className={ui.contentClass}>
        <section className={cn(ui.panelClass, "space-y-ds-5")}>
          <OperationalPageHeader title={t("transactionsTitle")} description={t("transactionsDescription")} />
          {error && <p className="text-sm text-lifeos-danger">{error}</p>}
          <OperationalTwoColumn main={<>{transactionsList}{categoryInsight}</>} aside={quickAddForm} />
        </section>
      </div>
    );
  }

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("fullTitle")} description={t("fullDescription")} />
        {error && <p className="text-sm text-lifeos-danger">{error}</p>}
        {financeStatePanel}
        {monthMetricStrip}
        <OperationalTwoColumn
          main={
            <>
              {categoryInsight}
              {transactionsList}
              {monthFootnote}
            </>
          }
          aside={quickAddForm}
        />
      </section>
    </div>
  );
}
