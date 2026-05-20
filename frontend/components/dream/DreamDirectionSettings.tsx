"use client";

import { useEffect, useState } from "react";
import { DREAM_PRESETS } from "@/lib/dream/catalog";
import { normalizeDreamCustom } from "@/lib/dream/resolve";
import type { DreamId } from "@/lib/dream/types";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { BodyText, MutedText } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  getResolvedUserPreferences,
  updateUserPreferences,
  USER_PREFERENCES_CHANGED_EVENT,
  type UserPreferences
} from "@/services/preferences";

function dreamIdFromPrefs(prefs: UserPreferences): DreamId {
  return (prefs.currentDreamId ?? "") as DreamId;
}

export function DreamDirectionSettings() {
  const [dreamId, setDreamId] = useState<DreamId>("");
  const [customText, setCustomText] = useState("");
  const [savedHint, setSavedHint] = useState(false);

  useEffect(() => {
    function sync() {
      const prefs = getResolvedUserPreferences();
      setDreamId(dreamIdFromPrefs(prefs));
      setCustomText(prefs.currentDreamCustom ?? "");
    }
    sync();
    window.addEventListener(USER_PREFERENCES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(USER_PREFERENCES_CHANGED_EVENT, sync);
  }, []);

  function flashSaved() {
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 2000);
  }

  function applyDream(nextId: DreamId, custom?: string) {
    const trimmed = normalizeDreamCustom(custom ?? customText);
    updateUserPreferences({
      currentDreamId: nextId,
      currentDreamCustom: nextId === "custom" ? trimmed : ""
    });
    setDreamId(nextId);
    if (nextId === "custom") setCustomText(trimmed);
    flashSaved();
  }

  function selectPreset(id: DreamId) {
    if (id === dreamId && id !== "custom") {
      applyDream("");
      return;
    }
    applyDream(id);
  }

  return (
    <div className="mt-ds-5 space-y-ds-5">
      <MutedText className={ds.typography.proseMax}>
        One long-term direction, not a deadline. Choose something that feels true, or write your own. Saved on this
        device only.
      </MutedText>

      <div className="flex flex-wrap gap-ds-2">
        {DREAM_PRESETS.map((preset) => {
          const selected = dreamId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset.id)}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-ds-4 text-sm transition-colors",
                selected
                  ? "bg-lifeos-accent/18 font-medium text-lifeos-fg ring-1 ring-lifeos-accent/35"
                  : "bg-lifeos-muted/35 text-lifeos-fg-secondary hover:bg-lifeos-muted/55"
              )}
              aria-pressed={selected}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            if (dreamId === "custom") {
              applyDream("");
              return;
            }
            setDreamId("custom");
          }}
          className={cn(
            "rounded-full px-ds-4 py-ds-2 text-sm transition-colors",
            dreamId === "custom"
              ? "bg-lifeos-accent/18 font-medium text-lifeos-fg ring-1 ring-lifeos-accent/35"
              : "bg-lifeos-muted/35 text-lifeos-fg-secondary hover:bg-lifeos-muted/55"
          )}
          aria-pressed={dreamId === "custom"}
        >
          Something else
        </button>
      </div>

      {dreamId === "custom" ? (
        <div className="grid max-w-lg gap-ds-2">
          <label className={ds.typography.uiLabel} htmlFor="dream-custom">
            Your direction in your own words
          </label>
          <input
            id="dream-custom"
            type="text"
            maxLength={120}
            placeholder="e.g. More time with family"
            className={`${ui.inputClass} h-10`}
            value={customText}
            onChange={(ev) => setCustomText(ev.target.value)}
            onBlur={() => {
              const trimmed = normalizeDreamCustom(customText);
              if (trimmed) applyDream("custom", trimmed);
            }}
          />
          <BodyText as="p" className={ds.typography.bodyMuted}>
            Press outside the field to save. Tap again to clear.
          </BodyText>
        </div>
      ) : null}

      {dreamId === "" ? (
        <BodyText as="p" className={ds.typography.bodyMuted}>
          No direction chosen yet. You can add one anytime. There is no onboarding pressure.
        </BodyText>
      ) : savedHint ? (
        <span className={cn(ds.typography.bodySecondary, "text-lifeos-success")}>Saved.</span>
      ) : null}
    </div>
  );
}
