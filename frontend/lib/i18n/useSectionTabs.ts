"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SectionTabDef } from "@/lib/i18n/nav";

export function useSectionTabs(defs: readonly SectionTabDef[]) {
  const { t, locale } = useI18n();
  return useMemo(
    () => defs.map((tab) => ({ href: tab.href, label: t(tab.labelKey) })),
    [defs, t, locale]
  );
}
