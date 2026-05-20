import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/types";

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore quota / private mode */
  }
}
