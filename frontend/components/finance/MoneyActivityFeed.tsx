"use client";

import type { FinanceTransaction } from "@/lib/api";
import {
  formatSignedMoneyAmount,
  transactionSubtitle,
  transactionTitle,
  transactionWhenLabel
} from "@/lib/finance/transactionDisplay";
import { ActivityRow, RecentActivityBlock } from "@/components/operational/OperationalPrimitives";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { transactionAmountClass } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";

type FinanceT = (key: string, values?: Record<string, string | number>) => string;

export function MoneyActivityFeed({
  transactions,
  t,
  title,
  emptyTitle,
  emptyDescription,
  limit = 15,
  now = new Date(),
  locale = "en"
}: {
  transactions: FinanceTransaction[];
  t: FinanceT;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  limit?: number;
  now?: Date;
  locale?: string;
}) {
  const rows = transactions.slice(0, limit);

  return (
    <RecentActivityBlock title={title}>
      {rows.length === 0 ? (
        <CalmEmptyState
          tone="finance"
          size="inline"
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        rows.map((tx) => {
          const subtitle = transactionSubtitle(tx, t);
          const when = transactionWhenLabel(tx, now, locale, t);
          return (
            <ActivityRow
              key={tx.id}
              primary={transactionTitle(tx)}
              secondary={
                <>
                  {subtitle ? <span className="block">{subtitle}</span> : null}
                  <span className="mt-0.5 block text-xs text-lifeos-fg-muted">{when}</span>
                </>
              }
              action={
                <span
                  className={cn(
                    "shrink-0 tabular-nums text-base font-medium tracking-tight",
                    transactionAmountClass(tx.kind)
                  )}
                >
                  {formatSignedMoneyAmount(tx.kind, tx.amount)}
                </span>
              }
            />
          );
        })
      )}
    </RecentActivityBlock>
  );
}
