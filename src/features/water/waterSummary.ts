import type { DailyHydration } from "../../types";

export function shouldShowWaterSummary(
  hydration: DailyHydration | null,
  hasPendingUndo: boolean,
): boolean {
  return hydration !== null && !hasPendingUndo;
}
