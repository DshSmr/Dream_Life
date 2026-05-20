"use client";

import type { CurrentStateItem, CurrentStateMood } from "@/lib/currentState/types";
import { cn } from "@/lib/utils";
import { Brain, Compass, Home, Wallet, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<CurrentStateItem["key"], LucideIcon> = {
  focus: Brain,
  home: Home,
  money: Wallet,
  energy: Wind,
  dream: Compass
};

const MOOD_SHELL: Record<CurrentStateMood, string> = {
  calm: "bg-lifeos-muted/20 ring-lifeos-border/25",
  warm: "bg-lifeos-accent/8 ring-lifeos-accent/20",
  quiet: "bg-lifeos-muted/15 ring-lifeos-border/20",
  gentle: "bg-lifeos-inset/40 ring-lifeos-border/15"
};

export function CurrentStatePanel({
  items,
  footnote,
  className
}: {
  items: CurrentStateItem[];
  footnote?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-ds-4", className)}>
      <ul className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = ICONS[item.key];
          return (
            <li
              key={item.key}
              className={cn(
                "rounded-ds-input px-ds-4 py-ds-4 ring-1 transition-colors",
                MOOD_SHELL[item.mood]
              )}
            >
              <div className="flex items-start gap-ds-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-lifeos-muted/35 text-lifeos-fg-muted">
                  <Icon className="size-4" strokeWidth={1.6} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-lifeos-fg-secondary">{item.title}</p>
                  <p className="mt-ds-1 text-sm leading-relaxed text-lifeos-fg">{item.summary}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {footnote ? (
        <p className="text-sm leading-relaxed text-lifeos-fg-muted">{footnote}</p>
      ) : null}
    </div>
  );
}
