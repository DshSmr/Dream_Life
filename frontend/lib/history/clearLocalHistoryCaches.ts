const OFFLINE_QUEUE_KEY = "life-os-offline-mutation-queue-v1";
const NOTIFICATION_READ_KEY = "lifeos-notification-read-ids";
const DAILY_PLAN_DONE_PREFIX = "lifeos-daily-plan-done:";
const DAILY_PLAN_EXTRA_PREFIX = "lifeos-daily-plan-extra:";
const REC_COOLDOWN_PREFIX = "lifeos_rec_cd_";

/** Remove client-side history caches; keeps theme, locale, and user preferences. */
export function clearLocalHistoryCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(DAILY_PLAN_DONE_PREFIX) ||
        key.startsWith(DAILY_PLAN_EXTRA_PREFIX) ||
        key === OFFLINE_QUEUE_KEY ||
        key === NOTIFICATION_READ_KEY
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }

    if (typeof window.sessionStorage !== "undefined") {
      const sessionKeys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith(REC_COOLDOWN_PREFIX)) sessionKeys.push(key);
      }
      for (const key of sessionKeys) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    /* quota / private mode */
  }
}
