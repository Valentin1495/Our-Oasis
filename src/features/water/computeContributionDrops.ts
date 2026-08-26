export const MAX_DROPS_PER_DAY = 4;

/** 오늘 마신 컵 수만큼 공동 물방울. 하루 최대 4개. */
export function getContributionDrops(cupsLogged: number): number {
  if (!Number.isFinite(cupsLogged) || cupsLogged <= 0) return 0;
  return Math.min(MAX_DROPS_PER_DAY, Math.floor(cupsLogged));
}

export function computeContributionDropsFromCups(
  nextCups: number,
  dropsUsedToday: number,
): number {
  const nextDrops = getContributionDrops(nextCups);
  return Math.max(
    0,
    Math.min(nextDrops - dropsUsedToday, MAX_DROPS_PER_DAY - dropsUsedToday),
  );
}

export function computeContributionDropsFromMl(
  nextConsumedMl: number,
  cupMl: number,
  dropsUsedToday: number,
): number {
  if (cupMl <= 0) return 0;
  return computeContributionDropsFromCups(
    nextConsumedMl / cupMl,
    dropsUsedToday,
  );
}

export function computePersonalProgressPercent(
  cupsLogged: number,
  cupMl: number,
  dailyGoalMl: number,
): number {
  if (dailyGoalMl <= 0) return 0;
  return Math.min(100, Math.round((cupsLogged * cupMl * 100) / dailyGoalMl));
}

/** 한 잔이 물방울 1개이므로 항상 1컵이다. */
export function computeCupsPerDrop(cupMl: number): number {
  if (cupMl <= 0) return 0;
  return 1;
}
