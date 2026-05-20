"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_URL, CleaningZone, EventItem } from "@/lib/api";
import { normalizeAnalyticsEvents } from "@/lib/analytics/normalize";
import { computeHomeHealthScore } from "@/lib/cleaningHealth";
import { homeHealthLevelClass } from "@/lib/semanticTone";
import { cleaningActionLabel, pickNextCleaningZone } from "@/lib/commandCenter";
import {
  formatCleaningWhen,
  homeHealthSummary,
  zoneCareLine
} from "@/lib/cleaning/display";
import { useUserPreferencesEpoch } from "@/hooks/useUserPreferencesEpoch";
import {
  cleaningDoneThisWeek,
  cleaningStreakFromEvents,
  cleaningZoneCounts
} from "@/lib/operational/metrics";
import { getResolvedUserPreferences } from "@/services/preferences";
import { ui } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { Button } from "@/components/ui/button";
import {
  ActivityRow,
  CollapsibleQuickForm,
  OperationalMetricBand,
  OperationalMetricCell,
  OperationalPageHeader,
  OperationalStatePanel,
  OperationalTwoColumn,
  RecentActivityBlock
} from "@/components/operational/OperationalPrimitives";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { sendWithOfflineQueue } from "@/services/offlineQueue";
import { useLifeOsRealtimeEpoch } from "@/services/realtime";

function cleaningStatusBadge(
  status: CleaningZone["status"],
  labels: { ok: string; soon: string; overdue: string }
): { label: string; className: string } {
  if (status === "ok") {
    return {
      label: labels.ok,
      className: "rounded-md bg-lifeos-status-healthy-bg/80 px-ds-2 py-0.5 text-xs font-medium text-lifeos-status-healthy ring-1 ring-lifeos-status-healthy-border/40"
    };
  }
  if (status === "soon") {
    return {
      label: labels.soon,
      className: "rounded-md bg-lifeos-warning-muted/30 px-ds-2 py-0.5 text-xs font-medium text-lifeos-warning"
    };
  }
  return {
    label: labels.overdue,
    className: "rounded-md bg-lifeos-status-risk-bg/80 px-ds-2 py-0.5 text-xs font-medium text-lifeos-status-risk ring-1 ring-lifeos-status-risk-border/40"
  };
}

export default function CleaningPage() {
  const { t, locale } = useTranslations("life.cleaning");
  const { t: tGlance } = useTranslations("dashboard.commandCenter");
  const { t: tCommon } = useTranslations();
  const statusLabels = { ok: t("statusOk"), soon: t("statusSoon"), overdue: t("statusOverdue") };
  const streakDays = (n: number) =>
    n === 1 ? tCommon("life.consistency.oneDay") : tCommon("life.consistency.daysCount", { count: n });
  const userPrefsEpoch = useUserPreferencesEpoch();
  const realtimeEpoch = useLifeOsRealtimeEpoch();
  const [zones, setZones] = useState<CleaningZone[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [name, setName] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const loadZones = useCallback(async () => {
    const response = await fetch(`${API_URL}/cleaning/zones`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch cleaning zones");
    setZones(await response.json());
  }, []);

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/events?limit=500`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch events");
    const raw = (await response.json()) as Array<Omit<EventItem, "type"> & { type: string }>;
    setEvents(normalizeAnalyticsEvents(raw));
  }, []);

  useEffect(() => {
    Promise.all([loadZones(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [loadZones, loadEvents]);

  useEffect(() => {
    if (realtimeEpoch === 0) return;
    Promise.all([loadZones(), loadEvents()]).catch((err: Error) => setError(err.message));
  }, [realtimeEpoch, loadZones, loadEvents]);

  useEffect(() => {
    setFrequencyDays(String(getResolvedUserPreferences().defaultCleaningFrequencyDays));
  }, [userPrefsEpoch]);

  const homeHealth = useMemo(() => computeHomeHealthScore(zones), [zones]);
  const counts = useMemo(() => cleaningZoneCounts(zones), [zones]);
  const nextZone = useMemo(() => pickNextCleaningZone(zones), [zones]);
  const weekDone = useMemo(() => cleaningDoneThisWeek(events), [events]);
  const streak = useMemo(() => cleaningStreakFromEvents(events), [events]);

  const recentCleanings = useMemo(
    () =>
      events
        .filter((e) => e.type === "cleaning_done")
        .slice(0, 8)
        .map((e) => {
          const zoneName =
            typeof e.payload?.zone_name === "string"
              ? e.payload.zone_name
              : typeof e.payload?.zone_id === "string"
                ? zones.find((z) => z.id === e.payload.zone_id)?.name
                : null;
          return { id: e.id, at: e.created_at, label: zoneName ?? t("cleaningLogged") };
        }),
    [events, zones, t]
  );

  const priorityZones = useMemo(
    () => [...zones].filter((z) => z.status !== "ok").sort((a, b) => (a.status === "overdue" ? -1 : 1)),
    [zones]
  );

  async function onCreateZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const frequency = Number(frequencyDays);
    if (!name.trim()) {
      setError(t("zoneNameRequired"));
      toast.error(t("zoneNameRequired"));
      return;
    }
    if (!Number.isInteger(frequency) || frequency < 1) {
      setError(t("frequencyInvalid"));
      toast.error(t("frequencyInvalid"));
      return;
    }
    const response = await fetch(`${API_URL}/cleaning/zones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), frequency_days: frequency })
    });
    if (!response.ok) {
      setError(t("createFailed"));
      toast.error(t("createFailed"));
      return;
    }
    setName("");
    setFrequencyDays(String(getResolvedUserPreferences().defaultCleaningFrequencyDays));
    toast.success(t("zoneAdded"));
    await loadZones();
  }

  async function markDone(zoneId: string) {
    setError(null);
    try {
      const result = await sendWithOfflineQueue({ kind: "cleaning_done", zoneId }, () =>
        fetch(`${API_URL}/cleaning/zones/${zoneId}/done`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      );
      if (result.mode === "queued") {
        toast.info(tCommon("common.toast.savedForNow"), { description: tCommon("common.toast.savedOffline") });
        await Promise.all([loadZones(), loadEvents()]);
        return;
      }
      if (!result.response.ok) {
        setError(tCommon("common.toast.actionFailed"));
        toast.error(tCommon("common.toast.actionFailed"));
        return;
      }
      toast.success(t("markedCleaned"));
      await Promise.all([loadZones(), loadEvents()]);
    } catch {
      setError(tCommon("common.toast.connectionError"));
      toast.error(t("cannotReachApi"));
    }
  }

  const addZoneForm = (
    <CollapsibleQuickForm label={t("addZone")} hideExpandGlyph>
      <form onSubmit={onCreateZone} className={ui.formGrid}>
        <FormField id="zone-name" label={tCommon("form.zoneName")}>
          <Input id="zone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("zonePlaceholder")} autoComplete="off" />
        </FormField>
        <FormField id="zone-frequency" label={tCommon("form.everyDays")}>
          <Input
            id="zone-frequency"
            className="tabular-nums"
            value={frequencyDays}
            onChange={(e) => setFrequencyDays(e.target.value)}
            inputMode="numeric"
          />
        </FormField>
        <div className="flex justify-end md:col-span-2">
          <Button className={ui.primaryButton} type="submit">
            {t("submit")}
          </Button>
        </div>
      </form>
    </CollapsibleQuickForm>
  );

  return (
    <div className={ui.contentClass}>
      <section className={cn(ui.panelClass, "space-y-ds-5")}>
        <OperationalPageHeader title={t("pageTitle")} description={t("pageDescription")} />

        <OperationalStatePanel
          title={tCommon("common.currentState")}
          tone={counts.overdue > 0 ? "caution" : counts.soon > 0 ? "active" : "default"}
        >
          {zones.length === 0 ? (
            <CalmEmptyState
              tone="cleaning"
              size="inline"
              title={tCommon("empty.cleaning.title")}
              description={tCommon("empty.cleaning.description")}
            />
          ) : nextZone ? (
            <div className="flex flex-wrap items-start justify-between gap-ds-3">
              <div>
                <p className="text-base font-semibold text-lifeos-fg">
                  {cleaningActionLabel(nextZone, tGlance)}
                </p>
                <p className="mt-ds-1 text-sm text-lifeos-fg-muted">{zoneCareLine(nextZone, t)}</p>
              </div>
              {nextZone.status !== "ok" && (
                <Button className={ui.primaryButton} onClick={() => markDone(nextZone.id)} type="button" size="sm">
                  {t("markCleaned")}
                </Button>
              )}
            </div>
          ) : null}
        </OperationalStatePanel>

        <OperationalMetricBand>
          <div className="grid grid-cols-2 gap-ds-4 sm:grid-cols-4">
            <OperationalMetricCell
              label={t("homeHealthLabel")}
              value={homeHealth ? homeHealthSummary(homeHealth.level, t) : "—"}
              hint={zones.length > 0 ? t("areasTracked", { count: zones.length }) : undefined}
              valueClassName={homeHealth ? homeHealthLevelClass(homeHealth.level) : undefined}
            />
            <OperationalMetricCell
              label={t("overdue")}
              value={counts.overdue}
              valueClassName={counts.overdue > 0 ? "text-lifeos-danger" : undefined}
            />
            <OperationalMetricCell
              label={t("dueSoon")}
              value={counts.soon}
              valueClassName={counts.soon > 0 ? "text-lifeos-warning" : undefined}
            />
            <OperationalMetricCell
              label={t("streak")}
              value={streakDays(streak)}
              hint={t("cleaningsThisWeek", { count: weekDone })}
            />
          </div>
        </OperationalMetricBand>

        <OperationalTwoColumn
          main={
            <>
              {priorityZones.length > 0 && (
                <RecentActivityBlock title={t("needsAttention")}>
                  {priorityZones.map((z) => {
                    const badge = cleaningStatusBadge(z.status, statusLabels);
                    return (
                      <ActivityRow
                        key={z.id}
                        primary={z.name}
                        secondary={zoneCareLine(z, t)}
                        action={
                          <div className="flex items-center gap-ds-2">
                            <span className={badge.className}>{badge.label}</span>
                            <Button className={ui.secondaryButton} onClick={() => markDone(z.id)} type="button" size="sm">
                              {t("done")}
                            </Button>
                          </div>
                        }
                      />
                    );
                  })}
                </RecentActivityBlock>
              )}

              <RecentActivityBlock title={t("allZones")}>
                {zones.length === 0 && (
                  <CalmEmptyState
                    tone="cleaning"
                    size="inline"
                    title={t("noZonesTitle")}
                    description={t("noZonesDescription")}
                  />
                )}
                {zones.map((z) => {
                  const badge = cleaningStatusBadge(z.status, statusLabels);
                  return (
                    <ActivityRow
                      key={z.id}
                      primary={z.name}
                      secondary={zoneCareLine(z, t)}
                      action={
                        <div className="flex items-center gap-ds-2">
                          <span className={badge.className}>{badge.label}</span>
                          <Button className={ui.secondaryButton} onClick={() => markDone(z.id)} type="button" size="sm">
                            {t("markCleaned")}
                          </Button>
                        </div>
                      }
                    />
                  );
                })}
              </RecentActivityBlock>

              <RecentActivityBlock title={t("recentCleanings")}>
                {recentCleanings.length === 0 ? (
                  <p className={`text-sm ${ui.mutedText}`}>{t("recentEmpty")}</p>
                ) : (
                  recentCleanings.map((r) => (
                    <ActivityRow
                      key={r.id}
                      primary={r.label}
                      secondary={formatCleaningWhen(r.at, now, locale, t)}
                    />
                  ))
                )}
              </RecentActivityBlock>
            </>
          }
          aside={addZoneForm}
        />

        {error && <p className="text-sm text-lifeos-danger">{error}</p>}
      </section>
    </div>
  );
}
