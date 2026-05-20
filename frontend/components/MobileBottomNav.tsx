"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Home, LayoutDashboard, Lightbulb, ListTodo, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PRIMARY_NAV } from "@/lib/i18n/nav";

const MOBILE_NAV = PRIMARY_NAV.filter((item) => item.href !== "/settings");

const ICONS = {
  "/dashboard": LayoutDashboard,
  "/work": ListTodo,
  "/life": Home,
  "/finance": Wallet,
  "/insights": Lightbulb
} as const;

function routeActive(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t, locale } = useI18n();

  const items = useMemo(
    () =>
      MOBILE_NAV.map((item) => ({
        href: item.href,
        label: t(item.labelKey),
        prefix: item.prefix,
        Icon: ICONS[item.prefix as keyof typeof ICONS]
      })),
    [t, locale]
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-lifeos-border bg-lifeos-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label={t("nav.aria.mobilePrimary")}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-5 gap-0.5 px-1 pt-1">
        {items.map(({ href, label, Icon, prefix }) => {
          const active = routeActive(pathname, prefix);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium leading-tight transition-[background-color,color,transform] duration-lifeos-normal ease-lifeos touch-manipulation",
                active
                  ? "text-lifeos-accent"
                  : "text-lifeos-fg-muted hover:bg-lifeos-muted/55 hover:text-lifeos-fg-secondary active:scale-[0.97]"
              ].join(" ")}
            >
              <Icon className="size-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              <span className="max-w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
