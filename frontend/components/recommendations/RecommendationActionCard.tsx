"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WhyLine } from "@/components/explainability/WhyLine";
import { useTranslations } from "@/lib/i18n";
import type { NextActionRecommendation } from "@/lib/recommendations/types";

export type RecommendationActionCardProps = {
  action: NextActionRecommendation;
  busy: boolean;
  onPrimary: () => Promise<void>;
  onDismiss: () => void;
  onImplicitIgnore: () => void;
  /** Dashboard hero — larger type, stronger CTA, less chrome */
  layout?: "default" | "featured";
};

/**
 * Next-action row with primary CTA, dismiss, optional implicit "ignored" signal after idle timeout.
 */
export function RecommendationActionCard(props: RecommendationActionCardProps) {
  const { t } = useTranslations("dashboard.recommendations");
  const interacted = useRef(false);
  const ignoreSent = useRef(false);
  const featured = props.layout === "featured";

  const markInteract = () => {
    interacted.current = true;
  };

  useEffect(() => {
    interacted.current = false;
    ignoreSent.current = false;
    const idleTimer = window.setTimeout(() => {
      if (interacted.current || ignoreSent.current) return;
      ignoreSent.current = true;
      props.onImplicitIgnore();
    }, 120_000);
    return () => window.clearTimeout(idleTimer);
    // Only reset timer when this recommendation row identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.action.id]);

  return (
    <article
      className={
        featured
          ? "flex flex-col gap-ds-6 rounded-ds-card bg-lifeos-muted/25 p-ds-7 shadow-inner md:flex-row md:items-start md:justify-between md:p-ds-8"
          : "flex flex-col gap-4 rounded-xl bg-lifeos-muted/25 p-4 shadow-inner sm:flex-row sm:items-start sm:justify-between md:p-5"
      }
    >
      <div className={`flex min-w-0 flex-1 ${featured ? "gap-ds-5" : "gap-4"}`}>
        <span className={featured ? "text-3xl leading-none" : "text-2xl leading-none"} aria-hidden>
          {props.action.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={
              featured
                ? "text-lg font-semibold leading-snug text-lifeos-fg md:text-xl"
                : "text-base font-medium leading-snug text-lifeos-fg"
            }
          >
            {props.action.message}
          </p>
          <WhyLine text={props.action.explanation ?? ""} prefix={false} />
        </div>
      </div>
      <div className={`flex w-full flex-col ${featured ? "gap-ds-3" : "gap-2"} sm:w-auto sm:min-w-[11rem] sm:items-end`}>
        {props.action.primaryAction ? (
          <Button
            variant="primary"
            size={featured ? "lg" : "md"}
            className={cn(
              featured ? "w-full sm:w-auto sm:min-w-[12rem]" : "w-full shrink-0 sm:w-auto"
            )}
            disabled={props.busy}
            onMouseDown={markInteract}
            onClick={() => {
              markInteract();
              void props.onPrimary();
            }}
            type="button"
          >
            {props.busy ? t("working") : props.action.primaryAction.buttonLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size={featured ? "md" : "sm"}
          className="w-full sm:w-auto"
          onMouseDown={markInteract}
          onClick={() => {
            markInteract();
            props.onDismiss();
          }}
        >
          {t("notNow")}
        </Button>
      </div>
    </article>
  );
}
