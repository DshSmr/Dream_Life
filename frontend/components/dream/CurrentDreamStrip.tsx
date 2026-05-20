"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import type { ResolvedDream } from "@/lib/dream/types";
import { cn } from "@/lib/utils";

export function CurrentDreamStrip({
  dream,
  whisper,
  className,
  showEdit = true
}: {
  dream: ResolvedDream;
  whisper?: string | null;
  className?: string;
  showEdit?: boolean;
}) {
  if (!dream.isSet) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-ds-3 rounded-ds-input bg-lifeos-muted/20 px-ds-4 py-ds-3 ring-1 ring-lifeos-domain-ai-border/30",
        className
      )}
    >
      <Compass className="mt-0.5 size-4 shrink-0 text-lifeos-accent/75" strokeWidth={1.6} aria-hidden />
      <div className="min-w-0 flex-1 space-y-ds-1">
        <p className="text-lifeos-caption font-medium text-lifeos-fg-muted">Current dream</p>
        <p className="text-sm font-medium leading-snug text-lifeos-fg">{dream.label}</p>
        {whisper ? <p className="text-sm leading-relaxed text-lifeos-fg-secondary">{whisper}</p> : null}
      </div>
      {showEdit ? (
        <Link
          href="/settings"
          className="shrink-0 pt-0.5 text-lifeos-caption text-lifeos-fg-muted underline-offset-2 hover:text-lifeos-fg-secondary hover:underline"
        >
          Edit
        </Link>
      ) : null}
    </div>
  );
}
