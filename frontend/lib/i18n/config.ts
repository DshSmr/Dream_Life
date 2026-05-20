import type { Locale } from "@/lib/i18n/types";

export const LOCALE_STORAGE_KEY = "lifeos-locale";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: readonly Locale[] = ["en", "ru", "fi"] as const;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  fi: "Suomi"
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ru" || value === "fi";
}
