import type { Locale } from "@/lib/i18n/types";
import { messages as en } from "@/lib/i18n/messages/en";
import { messages as fi } from "@/lib/i18n/messages/fi";
import { messages as ru } from "@/lib/i18n/messages/ru";

export const messageCatalogs = {
  en,
  ru,
  fi
} as const satisfies Record<Locale, import("@/lib/i18n/types").Messages>;

export { messages as enMessages } from "@/lib/i18n/messages/en";
