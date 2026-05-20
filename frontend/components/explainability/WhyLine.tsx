import { ui } from "@/lib/ui";

type WhyLineProps = { text: string; prefix?: string | false };

/** Short supporting line for recommendations, risks, and insights. */
export function WhyLine({ text, prefix = "Why? " }: WhyLineProps) {
  const t = text.trim();
  if (!t) return null;
  return (
    <p className="mt-2 border-l-2 border-lifeos-border-subtle pl-3 text-sm leading-relaxed text-lifeos-nav-text">
      {prefix ? <span className="font-medium text-lifeos-fg-secondary">{prefix}</span> : null}
      {t}
    </p>
  );
}

export function WhyMuted({ text, prefix = "Why? " }: { text: string; prefix?: string | false }) {
  const t = text.trim();
  if (!t) return null;
  return (
    <p className={`mt-1.5 text-xs leading-snug ${ui.mutedText}`}>
      {prefix ? <span className="font-medium text-lifeos-fg-muted">{prefix}</span> : null}
      {t}
    </p>
  );
}
