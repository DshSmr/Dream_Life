"use client";

import { useMemo } from "react";
import { SettingsField } from "@/components/settings/SettingsField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LOCALE_LABELS, SUPPORTED_LOCALES, useTranslations } from "@/lib/i18n";
import { ds } from "@/styles/design-system";
import { Surface } from "@/components/ui/Surface";
import { MutedText, SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

type Props = {
  embedded?: boolean;
  className?: string;
};

export function LanguagePreferenceSelect({ embedded = false, className = "" }: Props) {
  const { t, locale, setLocale } = useTranslations("settings.language");

  const items = useMemo(
    () => Object.fromEntries(SUPPORTED_LOCALES.map((code) => [code, LOCALE_LABELS[code]])),
    []
  );

  const onValueChange = (value: string) => {
    if (value === "en" || value === "ru" || value === "fi") setLocale(value);
  };

  const field = (
    <SettingsField
      id="lifeos-locale-select"
      label={t("displayLanguage")}
      hint={t("note")}
      className={className}
    >
      <Select value={locale} onValueChange={onValueChange} items={items}>
        <SelectTrigger id="lifeos-locale-select" className="w-full" aria-label={t("displayLanguage")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((code) => (
            <SelectItem key={code} value={code}>
              {LOCALE_LABELS[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsField>
  );

  if (embedded) {
    return (
      <>
        <div className="space-y-ds-2">
          <SectionTitle as="h2">{t("title")}</SectionTitle>
          <MutedText className={ds.typography.proseMax}>{t("description")}</MutedText>
        </div>
        <div className="max-w-sm">{field}</div>
      </>
    );
  }

  return (
    <Surface variant="primary" className="mt-6 space-y-ds-4">
      <div className="space-y-ds-2">
        <SectionTitle as="h2">{t("title")}</SectionTitle>
        <MutedText className={ds.typography.proseMax}>{t("description")}</MutedText>
      </div>
      <div className="max-w-sm">{field}</div>
    </Surface>
  );
}
