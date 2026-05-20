"use client";

import type { ReactNode } from "react";
import { BodyText } from "@/components/ui/typography";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

/** Uniform label → control → hint stack for Settings forms. */
export function SettingsField({ id, label, hint, className, children }: Props) {
  return (
    <div className={cn("flex flex-col gap-ds-2", className)}>
      <label className={ds.typography.uiLabel} htmlFor={id}>
        {label}
      </label>
      <div className="min-h-12">{children}</div>
      {hint ? (
        <BodyText as="p" className={cn(ds.typography.bodyMuted, "leading-relaxed")}>
          {hint}
        </BodyText>
      ) : null}
    </div>
  );
}
