"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CircleDashed,
  Brain,
  ClipboardList,
  Goal,
  Home,
  LineChart,
  NotebookPen,
  Sparkles,
  Timer,
  Wallet,
  Wind
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CalmEmptyTone =
  | "neutral"
  | "calm"
  | "tasks"
  | "focus"
  | "pomodoro"
  | "cleaning"
  | "finance"
  | "insights"
  | "notifications"
  | "reviews"
  | "timeline"
  | "goals"
  | "filter";

const TONE_ICONS: Record<CalmEmptyTone, LucideIcon> = {
  neutral: CircleDashed,
  calm: Wind,
  tasks: ClipboardList,
  focus: Brain,
  pomodoro: Timer,
  cleaning: Home,
  finance: Wallet,
  insights: LineChart,
  notifications: Bell,
  reviews: NotebookPen,
  timeline: Sparkles,
  goals: Goal,
  filter: CircleDashed
};

export function CalmEmptyState({
  title,
  description,
  tone = "neutral",
  size = "comfortable",
  className,
  children
}: {
  title: string;
  description?: string;
  tone?: CalmEmptyTone;
  size?: "inline" | "comfortable";
  className?: string;
  children?: ReactNode;
}) {
  const Icon = TONE_ICONS[tone];

  return (
    <div
      className={cn(
        "flex max-w-md items-start gap-ds-3 text-left",
        size === "comfortable" ? "py-ds-4" : "py-ds-2",
        className
      )}
      role="status"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lifeos-muted/35 text-lifeos-fg-muted/80"
        aria-hidden
      >
        <Icon className="size-[1.125rem]" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1 space-y-ds-1">
        <p className="text-sm font-medium leading-snug text-lifeos-fg">{title}</p>
        {description ? <p className="text-sm leading-relaxed text-lifeos-fg-muted">{description}</p> : null}
        {children ? <div className="pt-ds-2">{children}</div> : null}
      </div>
    </div>
  );
}
