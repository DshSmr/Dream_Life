import { cn } from "@/lib/utils";

export type FormControlState = "default" | "invalid";

/**
 * Shared surface for inputs, triggers, and textareas — Life OS tokens
 * (blended fill + focus ring; no default outline).
 */
/** Shared height for inputs, selects, and time fields in Settings. */
export const formControlHeightClass = "h-12 min-h-12";

export function formControlClassName(state: FormControlState = "default") {
  const invalid = state === "invalid";
  return cn(
    "w-full min-w-0 rounded-ds-input border-0 bg-lifeos-muted/90 px-ds-4 text-sm text-lifeos-fg antialiased",
    "shadow-[inset_0_1px_2px_rgba(15,23,42,0.07)] dark:bg-lifeos-muted/55 dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.45)]",
    "outline-none transition-[box-shadow,background-color] duration-lifeos-normal ease-lifeos",
    "placeholder:text-lifeos-fg-muted",
    invalid
      ? "ring-2 ring-lifeos-danger/35 ring-offset-2 ring-offset-lifeos-page focus-visible:ring-lifeos-danger/45"
      : cn(
          "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-lifeos-page",
          "aria-invalid:ring-2 aria-invalid:ring-lifeos-danger/35 aria-invalid:ring-offset-2 aria-invalid:ring-offset-lifeos-page"
        ),
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-lifeos-inset/50"
  );
}

/** Input / select trigger — same box size everywhere. */
export function formFieldClassName(state: FormControlState = "default") {
  return cn(
    formControlClassName(state),
    formControlHeightClass,
    "flex items-center py-0 leading-none"
  );
}
