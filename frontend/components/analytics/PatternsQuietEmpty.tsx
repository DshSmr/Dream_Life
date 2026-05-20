"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Calm inline empty copy — no dashed placeholder boxes. */
export function PatternsQuietEmpty({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm leading-relaxed text-lifeos-fg-muted", className)}>{children}</p>
  );
}
