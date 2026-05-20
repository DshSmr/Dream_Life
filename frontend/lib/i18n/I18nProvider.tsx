"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { readStoredLocale, writeStoredLocale } from "@/lib/i18n/storage";
import { translate } from "@/lib/i18n/translate";
import type { Locale, TranslationKey } from "@/lib/i18n/types";

export const LOCALE_CHANGED_EVENT = "lifeos-locale-changed";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: next }));
  }, []);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
