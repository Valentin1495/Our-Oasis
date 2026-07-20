export type OasisStatus =
  | "IN_PROGRESS"
  | "SHARED_SUCCESS"
  | "PERFECT_SUCCESS";

export function normalizeProgressPercentage(
  progressPercentage: number,
): number {
  if (!Number.isFinite(progressPercentage)) return 0;
  return Math.min(100, Math.max(0, progressPercentage));
}

export function getOasisStatus(
  progressPercentage: number,
): OasisStatus {
  const normalizedProgress =
    normalizeProgressPercentage(progressPercentage);

  if (normalizedProgress >= 100) return "PERFECT_SUCCESS";
  if (normalizedProgress >= 75) return "SHARED_SUCCESS";
  return "IN_PROGRESS";
}
