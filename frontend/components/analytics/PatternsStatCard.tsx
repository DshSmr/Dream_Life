"use client";

import { cn } from "@/lib/utils";

/** Shared calm stat summary — rectangular, not pill/button. */
export const PATTERNS_STAT_CARD_SHELL =
  "flex min-h-[72px] w-full min-w-0 flex-col justify-center rounded-2xl border border-lifeos-border/22 bg-lifeos-muted/12 px-4 py-[14px]";

export function PatternsStatCard({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn(PATTERNS_STAT_CARD_SHELL, className)}>
      <p className="text-xs leading-normal text-lifeos-fg-muted">{label}</p>
      <p className="mt-2 break-words text-base font-medium leading-snug text-lifeos-fg">{value}</p>
    </div>
  );
}
