"use client";

import { useCallback, useMemo } from "react";
import { SettingsField } from "@/components/settings/SettingsField";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ACTIVE_THEME_OPTIONS } from "@/lib/theme/catalog";
import { useTranslations } from "@/lib/i18n";

type Props = {
  className?: string;
};

function isThemePreference(value: string): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

export function ThemePreferenceSelect({ className = "" }: Props) {
  const { preference, setPreference } = useTheme();
  const { t } = useTranslations("settings.appearance");

  const items = useMemo(
    () => Object.fromEntries(ACTIVE_THEME_OPTIONS.map((entry) => [entry.id, t(entry.labelKey)])),
    [t]
  );

  const onValueChange = useCallback(
    (value: string) => {
      if (isThemePreference(value)) setPreference(value);
    },
    [setPreference]
  );

  return (
    <SettingsField id="lifeos-theme-select" label={t("themeLabel")} className={className}>
      <Select value={preference} onValueChange={onValueChange} items={items}>
        <SelectTrigger id="lifeos-theme-select" className="w-full" aria-label={t("themeLabel")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ACTIVE_THEME_OPTIONS.map((entry) => (
            <SelectItem key={entry.id} value={entry.id}>
              {t(entry.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsField>
  );
}
