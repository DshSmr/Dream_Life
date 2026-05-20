export type UserPreferences = {
  focusLengthMinutes: number;
  dailySpendingLimit: number;
  defaultCleaningFrequencyDays: number;
  workdayStart: string;
  workdayEnd: string;
  /** Preset id, `custom`, or empty when unset */
  currentDreamId: string;
  /** Used when currentDreamId is `custom` */
  currentDreamCustom: string;
};
