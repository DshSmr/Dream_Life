"use client";

import type { ReactNode } from "react";
import { MutedText } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function PatternPanel({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-ds-card bg-lifeos-muted/14 px-ds-4 py-ds-5 ring-1 ring-lifeos-border/18 md:px-ds-5",
        className
      )}
    >
      <h2 className="text-sm font-semibold tracking-wide text-lifeos-fg-secondary">{title}</h2>
      {description ? <MutedText className="mt-ds-1.5 max-w-[42ch] text-sm">{description}</MutedText> : null}
      <div className="mt-ds-4">{children}</div>
    </article>
  );
}
