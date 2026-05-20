"use client";

import { SectionTabNav } from "@/components/nav/SectionTabNav";
import { useI18n } from "@/lib/i18n";
import { FINANCE_TABS } from "@/lib/i18n/nav";
import { useSectionTabs } from "@/lib/i18n/useSectionTabs";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const tabs = useSectionTabs(FINANCE_TABS);
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl">
      <SectionTabNav ariaLabel={t("nav.aria.finance")} tabs={tabs} />
      {children}
    </div>
  );
}
