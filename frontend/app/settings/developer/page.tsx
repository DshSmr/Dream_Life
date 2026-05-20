"use client";

import Link from "next/link";
import { ClearAppHistorySection } from "@/components/settings/ClearAppHistorySection";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

export default function DeveloperToolsPage() {
  const { t } = useTranslations("settings.developer");

  return (
    <div className={ui.contentClass}>
      <section className={ui.panelClass}>
        <nav className="text-lifeos-caption font-medium text-lifeos-accent" aria-label="Breadcrumb">
          <Link href="/settings" className="text-lifeos-fg-muted transition hover:text-lifeos-accent">
            Settings
          </Link>
          <span className="mx-2 text-lifeos-fg-muted" aria-hidden>
            /
          </span>
          <span className="text-lifeos-fg-secondary">{t("title")}</span>
        </nav>

        <h1 className="mt-4 text-2xl font-semibold text-lifeos-fg">{t("title")}</h1>
        <p className={`mt-2 max-w-2xl ${ui.pageHint}`}>{t("pageDescription")}</p>

        <section className={cn("mt-10", ds.card.dashboardInset)}>
          <ClearAppHistorySection />
        </section>
      </section>
    </div>
  );
}
