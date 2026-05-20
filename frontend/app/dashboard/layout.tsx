"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SectionTabNav } from "@/components/nav/SectionTabNav";
import { useI18n } from "@/lib/i18n";
import { DASHBOARD_TABS } from "@/lib/i18n/nav";
import { useSectionTabs } from "@/lib/i18n/useSectionTabs";

function DashboardBreadcrumb() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = useSectionTabs(DASHBOARD_TABS);
  const normalized =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const tab = tabs.find((item) => item.href === normalized);
  if (!tab) return null;

  return (
    <div className="mb-3 md:mb-4">
      <p className="text-[11px] font-normal tracking-wide text-lifeos-fg-muted/75 md:text-xs">
        <Link href="/dashboard/overview" className="transition hover:text-lifeos-fg-secondary">
          {t("nav.breadcrumbDashboard")}
        </Link>
        <span className="mx-2 font-light text-lifeos-border-subtle" aria-hidden>
          /
        </span>
        <span className="text-lifeos-fg-muted">{tab.label}</span>
      </p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tabs = useSectionTabs(DASHBOARD_TABS);
  const { t } = useI18n();

  return (
    <div className="w-full min-w-0">
      <DashboardBreadcrumb />
      <SectionTabNav ariaLabel={t("nav.aria.dashboard")} tabs={tabs} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
