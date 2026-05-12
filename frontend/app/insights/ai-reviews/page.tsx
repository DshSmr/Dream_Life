"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, describeFetchFailure, type DailyReview } from "@/lib/api";
import { formatDateFiNumeric, formatLocalDateTimeLong } from "@/lib/datetime";
import { ui } from "@/lib/ui";
import { Button } from "@/components/ui/button";

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
  return (
    <article className="rounded-2xl border border-[#2A2F36] bg-[#11151A] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8F98]">
            {formatDateFiNumeric(review.date)}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">{review.title}</h3>
          {review.created_at && (
            <p className={`mt-1 text-xs ${ui.mutedText}`}>Saved {formatLocalDateTimeLong(review.created_at)}</p>
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
          {busy ? "Working…" : "Regenerate"}
        </Button>
      </div>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-[#2A2F36] pt-5">
          <p className="text-sm leading-relaxed text-[#E5E5E5]">{review.summary}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">Wins</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-[#b7e4c7]">
                {review.wins.map((w, i) => (
                  <li key={`${review.date}-w-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">Concerns</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-[#f3d59e]">
                {review.concerns.map((c, i) => (
                  <li key={`${review.date}-c-${i}`}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A8F98]">Tomorrow plan</h4>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-[#E5E5E5]">
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
        <h1 className="text-2xl font-semibold text-white">AI Review History</h1>
        <p className={ui.pageHint}>
          One saved review per calendar day (server UTC, same as analytics). Generate from the dashboard or regenerate here
          — duplicates are never created for the same date.
        </p>

        {error && <p className="mt-4 text-sm text-[#f7b0a2]">{error}</p>}
        {loading && <p className={`mt-6 text-sm ${ui.mutedText}`}>Loading history…</p>}

        {!loading && !error && items.length === 0 && (
          <p className={`mt-6 rounded-lg border border-[#2A2F36] bg-[#141A22]/50 px-3 py-2 text-sm ${ui.mutedText}`}>
            No reviews stored yet. Open Dashboard → Recommendations → <span className="text-[#c9d0d8]">Generate review</span>.
          </p>
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
