export type CurrentStateArea = "focus" | "home" | "money" | "energy" | "dream";

/** Subtle visual mood — not a score or grade */
export type CurrentStateMood = "calm" | "warm" | "quiet" | "gentle";

export type CurrentStateItem = {
  key: CurrentStateArea;
  title: string;
  summary: string;
  mood: CurrentStateMood;
};

export type CurrentStateSnapshot = {
  items: CurrentStateItem[];
  /** Optional closing line for very quiet days */
  footnote?: string | null;
};
