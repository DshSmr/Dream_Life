"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, describeFetchFailure, type DailyReview } from "@/lib/api";
import { formatDateFiNumeric, formatLocalDateTimeLong } from "@/lib/datetime";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { buildReviewHistoryDisplay } from "@/lib/reviewHistory/buildReviewHistoryDisplay";

async function errorMessageFromResponse(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { detail?: unknown };
    const d = data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d))
      return d
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) return String((item as { msg: string }).msg);
          return JSON.stringify(item);
        })
        .join("; ");
  } catch {
    /* not JSON */
  }
  return text.trim() || `HTTP ${res.status}`;
}

function ReviewCard({
  review,
  expanded,
  onToggle,
  onRegenerate,
  busy
}: {
  review: DailyReview;
  expanded: boolean;
  onToggle: () => void;
  onRegenerate: () => void;
  busy: boolean;
}) {
  const { t, locale } = useTranslations("insights.reviewHistory");
  const display = buildReviewHistoryDisplay(review, t, locale);

  return (
    <article className={ds.surfaces.contentPanelCompact}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-lg font-semibold text-lifeos-fg">{display.title}</h3>
          <p className={`mt-1 text-sm ${ui.mutedText}`}>{formatDateFiNumeric(review.date)}</p>
          {display.preview ? (
            <p className={`mt-2 text-sm leading-relaxed ${ui.mutedText}`}>{display.preview}</p>
          ) : null}
          {review.created_at && (
            <p className={`mt-2 text-xs ${ui.mutedText}`}>
              {t("saved")} {formatLocalDateTimeLong(review.created_at)}
            </p>
          )}
        </button>
        <Button
          type="button"
          className={`${ui.secondaryButton} min-h-11 shrink-0`}
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
        >
          {busy ? t("working") : t("revisit")}
        </Button>
      </div>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-lifeos-border-subtle/15 pt-5">
          <p className="text-sm leading-relaxed text-lifeos-fg-secondary">{review.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-lifeos-fg-muted">{t("whatWentWell")}</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-lifeos-success">
                {review.wins.map((w, i) => (
                  <li key={`${review.date}-w-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-lifeos-fg-muted">{t("needsAttention")}</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-lifeos-warning">
                {review.concerns.map((c, i) => (
                  <li key={`${review.date}-c-${i}`}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-lifeos-fg-muted">{t("tomorrow")}</h4>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-lifeos-fg-secondary">
              {review.tomorrowPlan.map((t, i) => (
                <li key={`${review.date}-t-${i}`}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}

export default function AiReviewHistoryPage() {
  const { t } = useTranslations("insights.reviewHistory");
  const [items, setItems] = useState<DailyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [regenBusyDate, setRegenBusyDate] = useState<string | null>(null);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/ai/reviews?limit=90`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await errorMessageFromResponse(r));
        return r.json() as Promise<DailyReview[]>;
      })
      .then(setItems)
      .catch((e: unknown) => setError(describeFetchFailure(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function regenerateForDate(isoDate: string) {
    setRegenBusyDate(isoDate);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ai/daily-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: isoDate, regenerate: true })
      });
      if (!res.ok) throw new Error(await errorMessageFromResponse(res));
      const updated = (await res.json()) as DailyReview;
      setItems((prev) => {
        const next = prev.filter((x) => x.date !== isoDate);
        next.push(updated);
        next.sort((a, b) => b.date.localeCompare(a.date));
        return next;
      });
    } catch (e: unknown) {
      setError(describeFetchFailure(e));
    } finally {
      setRegenBusyDate(null);
    }
  }

  return (
    <div className={ui.contentClass}>
      <section className={ui.panelClass}>
        <h1 className="text-2xl font-semibold text-lifeos-fg">{t("pageTitle")}</h1>
        <p className={ui.pageHint}>{t("pageDescription")}</p>

        {error && <p className="mt-4 text-sm text-lifeos-danger">{error}</p>}
        {loading && (
          <div className="mt-6">
            <PageSectionSkeleton />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <CalmEmptyState
            tone="reviews"
            size="comfortable"
            className="mt-6"
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        )}

        <div className="mt-6 space-y-4">
          {items.map((rev) => (
            <ReviewCard
              key={rev.id ?? rev.date}
              review={rev}
              expanded={expandedDate === rev.date}
              onToggle={() => setExpandedDate((d) => (d === rev.date ? null : rev.date))}
              onRegenerate={() => void regenerateForDate(rev.date)}
              busy={regenBusyDate === rev.date}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
