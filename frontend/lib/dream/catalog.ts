import type { DreamPresetId } from "@/lib/dream/types";

export type DreamPreset = {
  id: DreamPresetId;
  label: string;
  /** Short phrase for contextual copy, e.g. "your future home" */
  towardPhrase: string;
};

export const DREAM_PRESETS: DreamPreset[] = [
  { id: "home", label: "Buy a home", towardPhrase: "your future home" },
  { id: "stability", label: "Build financial stability", towardPhrase: "long-term steadiness" },
  { id: "calm", label: "Create a calmer life", towardPhrase: "a calmer life" },
  { id: "health", label: "Improve health", towardPhrase: "your wellbeing" },
  { id: "business", label: "Start a business", towardPhrase: "what you are building" },
  { id: "less-overwhelmed", label: "Feel less overwhelmed", towardPhrase: "more ease" }
];

export function dreamPresetById(id: string): DreamPreset | undefined {
  return DREAM_PRESETS.find((p) => p.id === id);
}
