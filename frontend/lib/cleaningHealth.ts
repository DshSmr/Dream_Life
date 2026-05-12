import type { CleaningZone, CleaningStatus } from "@/lib/api";

const STATUS_POINTS: Record<CleaningStatus, number> = {
  ok: 100,
  soon: 60,
  overdue: 20
};

export type HomeHealthLevel = "healthy" | "needs_attention" | "critical";

export type HomeHealthScore = {
  /** Rounded 0–100 (average of zone status points). */
  scorePercent: number;
  statusLabel: string;
  level: HomeHealthLevel;
};

function levelFromPercent(percent: number): { level: HomeHealthLevel; statusLabel: string } {
  if (percent >= 80) return { level: "healthy", statusLabel: "Healthy" };
  if (percent >= 50) return { level: "needs_attention", statusLabel: "Needs attention" };
  return { level: "critical", statusLabel: "Critical" };
}

/**
 * MVP home cleaning health: average of per-zone points (ok=100, soon=60, overdue=20).
 * Returns null when there are no zones.
 */
export function computeHomeHealthScore(zones: CleaningZone[]): HomeHealthScore | null {
  if (zones.length === 0) return null;

  const totalPoints = zones.reduce((sum, z) => sum + STATUS_POINTS[z.status], 0);
  const average = totalPoints / zones.length;
  const scorePercent = Math.round(average);
  const { level, statusLabel } = levelFromPercent(scorePercent);

  return { scorePercent, statusLabel, level };
}

/** Among overdue zones, pick the one farthest past its due window (by `last_cleaned_at` + frequency). */
export function mostOverdueZone(zones: CleaningZone[]): CleaningZone | null {
  const overdue = zones.filter((z) => z.status === "overdue");
  if (overdue.length === 0) return null;
  const now = Date.now();
  let worst: CleaningZone | null = null;
  let worstLateness = -Infinity;
  for (const z of overdue) {
    const lastMs = z.last_cleaned_at ? new Date(z.last_cleaned_at).getTime() : 0;
    const dueMs = lastMs + z.frequency_days * 86_400_000;
    const lateness = now - dueMs;
    if (lateness > worstLateness) {
      worstLateness = lateness;
      worst = z;
    }
  }
  return worst;
}
