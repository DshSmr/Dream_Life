"use client";

import { useEffect, useMemo, useRef } from "react";
import type { EventItem } from "@/lib/api";
import {
  activityLifeAreaLabel,
  buildActivityMomentDetails,
  formatActivityMomentWhen,
  mapActivityMoment
} from "@/lib/activity/momentCopy";
import { useTranslations } from "@/lib/i18n";
import { ui } from "@/lib/ui";
import { X } from "lucide-react";

type EventDetailModalProps = {
  event: EventItem | null;
  onClose: () => void;
};

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const { t, locale } = useTranslations("insights.activity");
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = Boolean(event);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open, event?.id]);

  const detail = useMemo(() => {
    if (!event) return null;
    const now = new Date();
    const moment = mapActivityMoment(event, t);
    const when = formatActivityMomentWhen(event.created_at, now, locale, t);
    const rows = buildActivityMomentDetails(event, t);
    const area = activityLifeAreaLabel(event.type, t);
    return { moment, when, rows, area };
  }, [event, t, locale]);

  if (!event || !detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-lifeos-nav-overlay backdrop-blur-[2px]"
        aria-label={t("detailTitle")}
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-lifeos-border bg-lifeos-card shadow-ds-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-detail-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-lifeos-border px-5 py-4 sm:px-6">
          <h2 id="event-detail-title" className="text-lg font-semibold text-lifeos-fg">
            {t("detailTitle")}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl text-lifeos-fg-muted outline-none transition hover:bg-lifeos-hover hover:text-lifeos-fg focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className={`${ui.mutedText} font-medium`}>{t("detailWhat")}</dt>
              <dd className="mt-1 text-lifeos-fg">{detail.moment.headline}</dd>
              {detail.moment.subline ? (
                <dd className="mt-0.5 text-lifeos-fg-secondary">{detail.moment.subline}</dd>
              ) : null}
            </div>
            <div>
              <dt className={`${ui.mutedText} font-medium`}>{t("detailArea")}</dt>
              <dd className="mt-1 text-lifeos-fg">{detail.area}</dd>
            </div>
            <div>
              <dt className={`${ui.mutedText} font-medium`}>{t("detailWhen")}</dt>
              <dd className="mt-1 tabular-nums text-lifeos-fg">{detail.when}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-lifeos-accent">{t("detailMore")}</p>
            {detail.rows.length === 0 ? (
              <p className={`mt-2 text-sm ${ui.mutedText}`}>{t("detailNothingElse")}</p>
            ) : (
              <dl className="mt-3 space-y-2 rounded-xl border border-lifeos-border bg-lifeos-inset p-4">
                {detail.rows.map((row) => (
                  <div key={row.label} className="grid gap-1 sm:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)] sm:gap-3">
                    <dt className={`break-words text-sm ${ui.mutedText}`}>{row.label}</dt>
                    <dd className="break-words text-sm text-lifeos-fg-secondary">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
