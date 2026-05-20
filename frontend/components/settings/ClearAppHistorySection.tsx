"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearAppHistory, describeFetchFailure, resetAllAppData } from "@/lib/api";
import { clearLocalHistoryCaches } from "@/lib/history/clearLocalHistoryCaches";
import { useTranslations } from "@/lib/i18n";
import { useBumpLifeOsData } from "@/services/realtime";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ModalKind = "history" | "resetAll" | null;

export function ClearAppHistorySection() {
  const { t } = useTranslations("settings.data");
  const bumpData = useBumpLifeOsData();
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setModal(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, busy]);

  useEffect(() => {
    if (modal) confirmRef.current?.focus();
  }, [modal]);

  const run = useCallback(
    async (kind: "history" | "resetAll") => {
      setBusy(true);
      setError(null);
      try {
        if (kind === "history") {
          await clearAppHistory();
          setSuccess(t("success"));
        } else {
          await resetAllAppData();
          setSuccess(t("resetAllSuccess"));
        }
        clearLocalHistoryCaches();
        bumpData();
        setModal(null);
      } catch (e) {
        setError(describeFetchFailure(e));
      } finally {
        setBusy(false);
      }
    },
    [bumpData, t]
  );

  const modalTitle = modal === "resetAll" ? t("resetAllModalTitle") : t("modalTitle");
  const modalBody = modal === "resetAll" ? t("resetAllModalBody") : t("modalBody");
  const confirmLabel = modal === "resetAll" ? t("resetAllConfirm") : t("confirm");

  return (
    <>
      <div className="space-y-ds-5">
        <div className="space-y-ds-2">
          <h2 className="text-lg font-semibold text-lifeos-fg">{t("title")}</h2>
          <p className={`max-w-2xl text-sm leading-relaxed ${ui.mutedText}`}>{t("description")}</p>
        </div>

        {success ? (
          <p className="text-sm text-lifeos-success" role="status">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-lifeos-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-ds-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-ds-button border border-lifeos-danger/35 bg-lifeos-danger/10 px-ds-5 text-sm font-medium text-lifeos-danger transition hover:bg-lifeos-danger/16 disabled:opacity-50"
            )}
            onClick={() => {
              setError(null);
              setModal("history");
            }}
            disabled={busy}
          >
            {t("action")}
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-ds-button border border-lifeos-danger/50 bg-lifeos-danger/14 px-ds-5 text-sm font-medium text-lifeos-danger transition hover:bg-lifeos-danger/22 disabled:opacity-50"
            )}
            onClick={() => {
              setError(null);
              setModal("resetAll");
            }}
            disabled={busy}
          >
            {t("resetAllAction")}
          </button>
        </div>

        <p className={`max-w-xl text-xs leading-relaxed ${ui.mutedText}`}>{t("footnote")}</p>
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-lifeos-nav-overlay backdrop-blur-[2px]"
            aria-label={t("cancel")}
            disabled={busy}
            onClick={() => setModal(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-2xl border border-lifeos-border bg-lifeos-card p-ds-5 shadow-ds-lg sm:rounded-2xl sm:p-ds-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-action-title"
          >
            <div className="flex items-start justify-between gap-ds-3">
              <h2 id="data-action-title" className="text-lg font-semibold text-lifeos-fg">
                {modalTitle}
              </h2>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-lifeos-fg-muted transition hover:bg-lifeos-hover hover:text-lifeos-fg"
                onClick={() => setModal(null)}
                disabled={busy}
                aria-label={t("cancel")}
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>
            <p className="mt-ds-4 text-sm leading-relaxed text-lifeos-fg-secondary">{modalBody}</p>
            <div className="mt-ds-6 flex flex-col-reverse gap-ds-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={cn(ui.secondaryButton, "min-h-11 w-full sm:w-auto")}
                onClick={() => setModal(null)}
                disabled={busy}
              >
                {t("cancel")}
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={cn(
                  "inline-flex min-h-11 w-full items-center justify-center rounded-ds-button border border-lifeos-danger/40 bg-lifeos-danger/12 px-ds-5 text-sm font-medium text-lifeos-danger transition hover:bg-lifeos-danger/18 disabled:opacity-50 sm:w-auto"
                )}
                onClick={() => void run(modal)}
                disabled={busy}
              >
                {busy ? t("clearing") : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
