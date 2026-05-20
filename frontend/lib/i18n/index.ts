export { I18nProvider, useI18n, LOCALE_CHANGED_EVENT } from "@/lib/i18n/I18nProvider";
export { useTranslations } from "@/lib/i18n/useTranslations";
export { useSectionTabs } from "@/lib/i18n/useSectionTabs";
export {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isLocale
} from "@/lib/i18n/config";
export { readStoredLocale, writeStoredLocale } from "@/lib/i18n/storage";
export type { Locale, Messages, TranslationKey } from "@/lib/i18n/types";
