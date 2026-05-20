"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SHELL =
  "rounded-ds-card bg-lifeos-muted/14 ring-1 ring-lifeos-border/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export function PatternsCard({
  title,
  hint,
  children,
  className,
  hero
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  /** Hero rhythm block — more padding, stronger presence. */
  hero?: boolean;
}) {
  const hasHeader = Boolean(title || hint);

  return (
    <article
      className={cn(
        SHELL,
        hero ? "px-ds-5 py-ds-6 md:px-ds-6 md:py-ds-7" : "px-ds-4 py-ds-5 md:px-ds-5",
        className
      )}
    >
      {hasHeader ? (
        <header className="space-y-ds-1">
          {title ? (
            <h2 className="text-sm font-semibold tracking-wide text-lifeos-fg-secondary">{title}</h2>
          ) : null}
          {hint ? <p className="max-w-[42ch] text-sm leading-relaxed text-lifeos-fg-muted">{hint}</p> : null}
        </header>
      ) : null}
      <div className={hasHeader ? "mt-ds-4" : undefined}>{children}</div>
    </article>
  );
}
