"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatMessage } from "@/lib/i18n/format";
import type { TranslationKey } from "@/lib/i18n/types";

type TValues = Record<string, string | number | undefined | null>;

/**
 * Scoped translator — `const t = useTranslations("nav"); t("primary.dashboard")`.
 * Or global: `const t = useTranslations(); t("nav.primary.dashboard")`.
 */
export function useTranslations(namespace?: string) {
  const { t: translate, locale, setLocale } = useI18n();

  const t = useCallback(
    (key: string, values?: TValues) => {
      const fullKey = (namespace ? `${namespace}.${key}` : key) as TranslationKey;
      return formatMessage(translate(fullKey), values);
    },
    [namespace, translate]
  );

  return { t, locale, setLocale };
}
