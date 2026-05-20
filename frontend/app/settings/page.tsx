"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { Surface } from "@/components/ui/Surface";
import { DreamDirectionSettings } from "@/components/dream/DreamDirectionSettings";
import { LanguagePreferenceSelect } from "@/components/settings/LanguagePreferenceSelect";
import { SettingsField } from "@/components/settings/SettingsField";
import { formFieldClassName } from "@/lib/form-control";
import { ThemePreferenceSelect } from "@/components/theme/ThemePreferenceSelect";
import { BodyText, LabelText, MutedText, PageTitle, SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { AUTOMATION_RULE_SETTING_CATALOG } from "@/services/automation/ruleSettingCatalog";
import type { AutomationSetting, AutomationSettingCategory } from "@/services/automation/settingsTypes";
import { getAutomationSettingsForUi, setAutomationRuleEnabled } from "@/services/automation/settingsStorage";
import { useTranslations } from "@/lib/i18n";
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
  getResolvedUserPreferences,
  saveUserPreferences,
  USER_PREFERENCES_CHANGED_EVENT
} from "@/services/preferences";

const CATEGORY_ORDER: AutomationSettingCategory[] = ["cleaning", "focus", "goals", "insights"];

function categoryLabel(cat: AutomationSettingCategory, t: (key: string) => string): string {
  if (cat === "cleaning") return t("categoryCleaning");
  if (cat === "focus") return t("categoryFocus");
  if (cat === "goals") return t("categoryGoals");
  return t("categoryInsights");
}

function groupByCategory(settings: AutomationSetting[]): Map<AutomationSettingCategory, AutomationSetting[]> {
  const map = new Map<AutomationSettingCategory, AutomationSetting[]>();
  for (const cat of CATEGORY_ORDER) map.set(cat, []);
  for (const s of settings) {
    const list = map.get(s.category);
    if (list) list.push(s);
  }
  return map;
}

function ToggleSwitch({
  enabled,
  onToggle,
  onLabel,
  offLabel
}: {
  enabled: boolean;
  onToggle: () => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lifeos-accent/60 ${
        enabled ? "bg-lifeos-accent" : "bg-lifeos-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 block size-6 rounded-full bg-lifeos-elevated shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
      <span className="sr-only">{enabled ? onLabel : offLabel}</span>
    </button>
  );
}

function PersonalizationForm() {
  const { t } = useTranslations("settings");
  const [prefs, setPrefs] = useState<UserPreferences>(() => getResolvedUserPreferences());
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    function sync() {
      setPrefs(getResolvedUserPreferences());
    }
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, sync);
  }, []);

  function commit(next: UserPreferences) {
    saveUserPreferences(next);
    setPrefs(next);
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 2000);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const focus = Math.round(Number(prefs.focusLengthMinutes));
    const spend = Number(prefs.dailySpendingLimit);
    const freq = Math.round(Number(prefs.defaultCleaningFrequencyDays));
    if (!Number.isFinite(focus) || focus < 10 || focus > 180) return;
    if (!Number.isFinite(spend) || spend < 1) return;
    if (!Number.isFinite(freq) || freq < 1 || freq > 365) return;
    commit({
      ...prefs,
      focusLengthMinutes: focus,
      dailySpendingLimit: spend,
      defaultCleaningFrequencyDays: freq
    });
  }

  const inputClass = cn(formFieldClassName(), "w-full tabular-nums");
  const timeInputClass = cn(
    formFieldClassName(),
    "w-full min-w-0 appearance-none",
    "[&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:size-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50",
    "[&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit]:p-0"
  );

  return (
    <form className="mt-ds-6 space-y-ds-7" onSubmit={onSubmit}>
      <div className="grid items-start gap-x-ds-5 gap-y-ds-6 sm:grid-cols-2">
        <SettingsField id="pref-focus" label={t("focusLength")} hint={t("focusLengthHint")}>
          <input
            id="pref-focus"
            type="number"
            min={10}
            max={180}
            step={1}
            required
            className={inputClass}
            value={prefs.focusLengthMinutes}
            onChange={(ev) => setPrefs((p) => ({ ...p, focusLengthMinutes: Number(ev.target.value) }))}
          />
        </SettingsField>
        <SettingsField id="pref-spend" label={t("spendingLimit")} hint={t("spendingLimitHint")}>
          <input
            id="pref-spend"
            type="number"
            min={1}
            step={1}
            required
            className={inputClass}
            value={prefs.dailySpendingLimit}
            onChange={(ev) => setPrefs((p) => ({ ...p, dailySpendingLimit: Number(ev.target.value) }))}
          />
        </SettingsField>
        <SettingsField
          id="pref-clean-freq"
          label={t("cleaningFreq")}
          hint={t("cleaningFreqHint")}
          className="sm:col-span-2"
        >
          <input
            id="pref-clean-freq"
            type="number"
            min={1}
            max={365}
            step={1}
            required
            className={cn(inputClass, "max-w-xs")}
            value={prefs.defaultCleaningFrequencyDays}
            onChange={(ev) => setPrefs((p) => ({ ...p, defaultCleaningFrequencyDays: Number(ev.target.value) }))}
          />
        </SettingsField>
      </div>

      <div className="space-y-ds-3">
        <div className="grid items-start gap-x-ds-5 gap-y-ds-3 sm:grid-cols-2">
          <SettingsField id="pref-work-start" label={t("workdayStart")}>
            <input
              id="pref-work-start"
              type="time"
              required
              className={timeInputClass}
              value={prefs.workdayStart}
              onChange={(ev) => setPrefs((p) => ({ ...p, workdayStart: ev.target.value }))}
            />
          </SettingsField>
          <SettingsField id="pref-work-end" label={t("workdayEnd")}>
            <input
              id="pref-work-end"
              type="time"
              required
              className={timeInputClass}
              value={prefs.workdayEnd}
              onChange={(ev) => setPrefs((p) => ({ ...p, workdayEnd: ev.target.value }))}
            />
          </SettingsField>
        </div>
        <BodyText as="p" className={cn(ds.typography.bodyMuted, "max-w-prose leading-relaxed")}>
          {t("workdayHint")}
        </BodyText>
      </div>

      <div className="flex flex-wrap items-center gap-ds-3 border-t border-lifeos-border-subtle/10 pt-ds-6">
        <button type="submit" className={cn(ui.primaryButton, "min-h-10 px-ds-5")}>
          {t("savePersonalization")}
        </button>
        <button
          type="button"
          className={cn(
            ds.typography.bodySecondary,
            "min-h-10 rounded-ds-button px-ds-3 text-lifeos-fg-muted transition-colors duration-lifeos-normal ease-lifeos hover:bg-lifeos-hover/40 hover:text-lifeos-fg-secondary"
          )}
          onClick={() =>
            commit({
              ...prefs,
              focusLengthMinutes: DEFAULT_USER_PREFERENCES.focusLengthMinutes,
              dailySpendingLimit: DEFAULT_USER_PREFERENCES.dailySpendingLimit,
              defaultCleaningFrequencyDays: DEFAULT_USER_PREFERENCES.defaultCleaningFrequencyDays,
              workdayStart: DEFAULT_USER_PREFERENCES.workdayStart,
              workdayEnd: DEFAULT_USER_PREFERENCES.workdayEnd
            })
          }
        >
          {t("resetDefaults")}
        </button>
        {savedHint ? (
          <span className={cn(ds.typography.bodySecondary, "text-lifeos-success")}>{t("saved")}</span>
        ) : null}
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { t } = useTranslations("settings");
  const [settings, setSettings] = useState<AutomationSetting[]>(() => getAutomationSettingsForUi());

  const refresh = useCallback(() => {
    setSettings(getAutomationSettingsForUi());
  }, []);

  const grouped = useMemo(() => groupByCategory(settings), [settings]);

  const toggle = useCallback(
    (id: string, next: boolean) => {
      setAutomationRuleEnabled(id, next);
      refresh();
    },
    [refresh]
  );

  const catalogEmpty = AUTOMATION_RULE_SETTING_CATALOG.length === 0;

  return (
    <div className={ui.contentClass}>
      <section className={ui.panelClass}>
        <PageTitle>{t("pageTitle")}</PageTitle>
        <MutedText className={cn("mt-ds-4", ds.typography.proseMax)}>{t("pageDescription")}</MutedText>

        <Surface variant="primary" className="mt-6 space-y-ds-4">
          <div className="space-y-ds-2">
            <SectionTitle>{t("appearance.title")}</SectionTitle>
            <MutedText className={ds.typography.proseMax}>{t("appearance.description")}</MutedText>
          </div>
          <div className="max-w-sm">
            <ThemePreferenceSelect />
          </div>
        </Surface>

        <Surface variant="primary" className="mt-6 space-y-ds-4">
          <LanguagePreferenceSelect embedded />
        </Surface>

        <Surface variant="primary" className="mt-6 space-y-ds-4">
          <div className="space-y-ds-2">
            <SectionTitle>{t("directionTitle")}</SectionTitle>
            <MutedText className={ds.typography.proseMax}>{t("directionDescription")}</MutedText>
          </div>
          <DreamDirectionSettings />
        </Surface>

        <Surface variant="primary" className="mt-6 space-y-ds-4">
          <div className="space-y-ds-2">
            <SectionTitle>{t("personalizationTitle")}</SectionTitle>
            <MutedText className={ds.typography.proseMax}>{t("personalizationDescription")}</MutedText>
          </div>
          <PersonalizationForm />
        </Surface>

        <Surface variant="primary" className="mt-6 space-y-ds-4">
          <div className="space-y-ds-2">
            <SectionTitle>{t("nudgesTitle")}</SectionTitle>
            <MutedText className={ds.typography.proseMax}>{t("nudgesDescription")}</MutedText>
          </div>

          {catalogEmpty ? (
            <MutedText className="mt-ds-6">{t("nudgesEmpty")}</MutedText>
          ) : (
            <div className="mt-ds-5 space-y-ds-6">
              {CATEGORY_ORDER.map((cat) => {
                const rows = grouped.get(cat) ?? [];
                if (rows.length === 0) return null;
                return (
                  <div key={cat}>
                    <LabelText as="p" className="font-semibold text-lifeos-fg-secondary">
                      {categoryLabel(cat, t)}
                    </LabelText>
                    <Surface as="ul" variant="inset" className="mt-ds-3 !p-0 list-none divide-y divide-lifeos-border-subtle/[0.07] overflow-hidden">
                      {rows.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-col gap-3 px-ds-4 py-ds-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-ds-5"
                        >
                          <div className="min-w-0 flex-1 space-y-ds-2">
                            <BodyText as="p" className="font-semibold text-lifeos-fg">
                              {s.name}
                            </BodyText>
                            <MutedText className={ds.typography.proseWideMax}>{s.description}</MutedText>
                          </div>
                          <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                            <span className={cn(ds.typography.caption, "font-medium tabular-nums text-lifeos-accent")}>
                              {s.enabled ? t("toggleOn") : t("toggleOff")}
                            </span>
                            <ToggleSwitch
                              enabled={s.enabled}
                              onToggle={() => toggle(s.id, !s.enabled)}
                              onLabel={t("toggleOn")}
                              offLabel={t("toggleOff")}
                            />
                          </div>
                        </li>
                      ))}
                    </Surface>
                  </div>
                );
              })}
            </div>
          )}
        </Surface>

        <Surface
          variant="secondary"
          className="mt-6 space-y-ds-4 rounded-ds-card bg-lifeos-muted/15 px-ds-5 py-ds-6 shadow-inner md:px-ds-6"
        >
          <div className="space-y-ds-2">
            <SectionTitle>{t("developer.title")}</SectionTitle>
            <MutedText className={ds.typography.proseMax}>{t("developer.pageDescription")}</MutedText>
          </div>
          <Link
            href="/settings/developer"
            className="mt-ds-2 inline-flex min-h-11 items-center justify-center rounded-ds-button bg-lifeos-muted/40 px-ds-5 text-lifeos-body font-medium text-lifeos-accent shadow-sm transition hover:bg-lifeos-hover hover:text-lifeos-fg"
          >
            {t("developer.link")}
          </Link>
        </Surface>
      </section>
    </div>
  );
}
