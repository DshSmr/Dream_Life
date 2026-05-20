export type DreamPresetId =
  | "home"
  | "stability"
  | "calm"
  | "health"
  | "business"
  | "less-overwhelmed";

export type DreamId = DreamPresetId | "custom" | "";

export type ResolvedDream = {
  id: DreamId;
  label: string;
  isSet: boolean;
};

export type DreamLayerContext = {
  tasksCompletedToday: number;
  focusMinutesToday: number;
  hasNextAction: boolean;
  planItemsDone: number;
  planItemsTotal: number;
};
