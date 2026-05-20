"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { sendWithOfflineQueue } from "@/services/offlineQueue";
import { API_URL, CleaningZone, FocusSession, TaskItem } from "@/lib/api";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { Button } from "@/components/ui/button";
import { WhyMuted } from "@/components/explainability/WhyLine";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useAutomationPrefsEpoch } from "@/hooks/useAutomationPrefsEpoch";
import { useUserPreferencesEpoch } from "@/hooks/useUserPreferencesEpoch";
import { useTranslations } from "@/lib/i18n";
import {
  categoryNotificationEmoji,
  generateNotifications,
  loadNotificationReadIds,
  mergeNotificationReadState,
  NOTIFICATION_MUTATION,
  notificationReadCompoundKey,
  saveNotificationReadIds,
  type AppNotification
} from "@/services/notifications";

type Props = {
  tasks: TaskItem[];
  zones: CleaningZone[];
  focusSessions: FocusSession[];
  expensesTodayTotal: number;
  onRefresh?: () => void | Promise<void>;
};

export function DashboardNotificationsSection({
  tasks,
  zones,
  focusSessions,
  expensesTodayTotal,
  onRefresh
}: Props) {
  const { t } = useTranslations("dashboard.notifications");
  const { t: tToast } = useTranslations("common");
  const automationPrefsEpoch = useAutomationPrefsEpoch();
  const userPrefsEpoch = useUserPreferencesEpoch();
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  useEffect(() => {
    setReadIds(loadNotificationReadIds());
  }, []);

  const notifications: AppNotification[] = useMemo(() => {
    const now = new Date();
    const drafts = generateNotifications({
      cleaningZones: zones,
      focusSessions,
      tasks,
      expensesTodayTotal,
      now
    });
    return mergeNotificationReadState(drafts, readIds, now);
  }, [zones, focusSessions, tasks, expensesTodayTotal, readIds, automationPrefsEpoch, userPrefsEpoch]);

  const markRead = useCallback((id: string) => {
    const now = new Date();
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(notificationReadCompoundKey(id, now));
      saveNotificationReadIds(next);
      return next;
    });
  }, []);

  const runAction = useCallback(
    async (n: AppNotification) => {
      const a = n.action;
      if (!a?.target) return;

      if (a.type === "navigate") {
        markRead(n.id);
        router.push(a.target as Route);
        return;
      }

      if (a.type === "mutation") {
        setActionBusyId(n.id);
        try {
          if (a.target === NOTIFICATION_MUTATION.focus_start) {
            const result = await sendWithOfflineQueue(
              { kind: "focus_start", body: { label: null, task_id: null } },
              () =>
                fetch(`${API_URL}/focus/sessions`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ label: null, task_id: null })
                })
            );
            if (result.mode === "queued") {
              toast.info(tToast("toast.savedForNow"), { description: tToast("toast.savedOfflineShort") });
              markRead(n.id);
              await onRefresh?.();
              return;
            }
            if (!result.response.ok) throw new Error("focus");
            toast.success(tToast("toast.focusStarted"));
            markRead(n.id);
            await onRefresh?.();
            router.push("/work/focus");
            return;
          }

          if (a.target === NOTIFICATION_MUTATION.cleaning_mark_done) {
            const zoneId = a.payload?.zoneId;
            if (typeof zoneId !== "string") throw new Error("zone");
            const result = await sendWithOfflineQueue({ kind: "cleaning_done", zoneId }, () =>
              fetch(`${API_URL}/cleaning/zones/${zoneId}/done`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
              })
            );
            if (result.mode === "queued") {
              toast.info(tToast("toast.savedForNow"), { description: tToast("toast.savedOfflineShort") });
              markRead(n.id);
              await onRefresh?.();
              return;
            }
            if (!result.response.ok) throw new Error("cleaning");
            toast.success(tToast("toast.markedCleaned"));
            markRead(n.id);
            await onRefresh?.();
            return;
          }

          throw new Error("unknown");
        } catch {
          toast.error(tToast("toast.couldNotComplete"));
        } finally {
          setActionBusyId(null);
        }
      }
    },
    [markRead, onRefresh, router, tToast]
  );

  function typeAccentBar(t: AppNotification["type"]): string {
    if (t === "warning") return "shadow-[inset_4px_0_0_0_rgba(220,200,154,0.5)]";
    if (t === "success") return "shadow-[inset_4px_0_0_0_rgba(120,192,165,0.45)]";
    return "shadow-[inset_4px_0_0_0_rgba(91,108,255,0.32)]";
  }

  return (
    <section className={ds.surfaces.contentPanelCompact}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lifeos-section font-semibold tracking-tight text-lifeos-fg">{t("title")}</h2>
          <p className={`mt-1 text-sm ${ui.mutedText}`}>{t("subtitle")}</p>
        </div>
      </div>

      {notifications.length > 0 ? (
        <ul className="mt-5 space-y-2.5">
          {notifications.map((n) => (
            <li key={n.id}>
              <article
                className={cn(
                  "rounded-xl bg-lifeos-muted/25 p-4 shadow-inner",
                  typeAccentBar(n.type),
                  n.read ? "opacity-70" : ""
                )}
              >
                <div className="flex gap-3">
                  <span className="text-xl leading-none" aria-hidden>
                    {categoryNotificationEmoji(n.category)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-lifeos-fg">{n.title}</p>
                    <p className={`mt-1 text-xs leading-snug ${ui.mutedText}`}>{n.message}</p>
                    <WhyMuted text={n.explanation ?? ""} />
                    {n.action ? (
                      <div className="mt-3">
                        <Button
                          variant={n.action.type === "mutation" ? "primary" : "secondary"}
                          size="sm"
                          disabled={actionBusyId === n.id}
                          onClick={() => void runAction(n)}
                          type="button"
                        >
                          {actionBusyId === n.id ? t("working") : n.action.label}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {!n.read ? <span className="mt-1 size-2 shrink-0 rounded-full bg-lifeos-accent/80" title={t("unread")} /> : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <CalmEmptyState
          tone="notifications"
          size="comfortable"
          className="mt-4"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
    </section>
  );
}
