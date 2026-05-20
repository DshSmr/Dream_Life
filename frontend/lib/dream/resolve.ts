import { dreamPresetById } from "@/lib/dream/catalog";
import type { ResolvedDream } from "@/lib/dream/types";
import type { UserPreferences } from "@/services/preferences/types";

const MAX_CUSTOM_LEN = 120;

export function normalizeDreamCustom(text: string): string {
  return text.trim().slice(0, MAX_CUSTOM_LEN);
}

export function resolveDreamFromPreferences(prefs: UserPreferences): ResolvedDream {
  const id = prefs.currentDreamId ?? "";
  if (!id) {
    return { id: "", label: "", isSet: false };
  }
  if (id === "custom") {
    const label = normalizeDreamCustom(prefs.currentDreamCustom ?? "");
    if (!label) return { id: "custom", label: "", isSet: false };
    return { id: "custom", label, isSet: true };
  }
  const preset = dreamPresetById(id);
  if (!preset) return { id: "", label: "", isSet: false };
  return { id: preset.id, label: preset.label, isSet: true };
}
