"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChartRhythmPlaceholder({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.25rem] items-center justify-center rounded-xl border border-dashed border-lifeos-border/70 bg-lifeos-muted/20 px-ds-4 py-ds-3 text-center text-sm leading-relaxed text-lifeos-fg-muted",
        className
      )}
    >
      {children}
    </div>
  );
}
