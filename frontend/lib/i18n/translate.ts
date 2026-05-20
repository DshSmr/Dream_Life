import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { messageCatalogs } from "@/lib/i18n/messages";
import type { Locale, TranslationKey } from "@/lib/i18n/types";

function resolvePath(tree: unknown, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = tree;
  for (const part of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(locale: Locale, key: TranslationKey): string {
  const primary = resolvePath(messageCatalogs[locale], key);
  if (primary !== undefined) return primary;
  const fallback = resolvePath(messageCatalogs[DEFAULT_LOCALE], key);
  if (fallback !== undefined) return fallback;
  return key;
}
