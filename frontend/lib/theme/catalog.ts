import type { ThemePreference } from "@/components/theme/ThemeProvider";

/** Stable ids for theme options in Settings → Appearance. */
export type ThemeOptionId =
  | ThemePreference
  | "midnight"
  | "soft-dark"
  | "warm-light";

export type ThemeCatalogEntry = {
  id: ThemeOptionId;
  /** Maps to stored preference when the option is active. */
  preference: ThemePreference | null;
  /** Label key under `settings.appearance`. */
  labelKey: string;
  available: boolean;
};

/**
 * Single source for the appearance dropdown.
 * Add entries with `available: false` until the palette ships.
 */
export const THEME_CATALOG: readonly ThemeCatalogEntry[] = [
  { id: "dark", preference: "dark", labelKey: "themeDark", available: true },
  { id: "light", preference: "light", labelKey: "themeLight", available: true },
  { id: "system", preference: "system", labelKey: "themeSystem", available: true },
  { id: "midnight", preference: null, labelKey: "themeMidnight", available: false },
  { id: "soft-dark", preference: null, labelKey: "themeSoftDark", available: false },
  { id: "warm-light", preference: null, labelKey: "themeWarmLight", available: false }
] as const;

export const ACTIVE_THEME_OPTIONS = THEME_CATALOG.filter((e) => e.available);

export function catalogEntryForPreference(pref: ThemePreference): ThemeCatalogEntry {
  return ACTIVE_THEME_OPTIONS.find((e) => e.preference === pref) ?? ACTIVE_THEME_OPTIONS[0]!;
}
