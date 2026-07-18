const THRESHOLDS = [25, 50, 75, 100] as const;
export const MAX_DROPS_PER_DAY = 4;

/** 실제 누적 섭취량이 목표의 25/50/75/100%를 통과한 횟수. */
export function getContributionDrops(
  consumedMl: number,
  goalMl: number,
): number {
  if (goalMl <= 0 || consumedMl <= 0) return 0;
  return Math.min(
    MAX_DROPS_PER_DAY,
    Math.floor((consumedMl / goalMl) * MAX_DROPS_PER_DAY),
  );
}

export function computeContributionDropsFromMl(
  nextConsumedMl: number,
  goalMl: number,
  dropsUsedToday: number,
): number {
  const nextDrops = getContributionDrops(nextConsumedMl, goalMl);
  return Math.max(
    0,
    Math.min(nextDrops - dropsUsedToday, MAX_DROPS_PER_DAY - dropsUsedToday),
  );
}

/**
 * 개인 진행률이 prevPercent에서 newPercent로 바뀔 때
 * 공동 오아시스에 기여하는 물방울 수를 계산한다.
 * 25/50/75/100% 구간을 넘을 때마다 1개씩, 하루 최대 4개.
 */
export function computeContributionDrops(
  prevPercent: number,
  newPercent: number,
  dropsUsedToday: number,
): number {
  const remaining = MAX_DROPS_PER_DAY - dropsUsedToday;
  if (remaining <= 0) return 0;

  const crossed = THRESHOLDS.filter(
    (t) => prevPercent < t && newPercent >= t,
  ).length;

  return Math.min(crossed, remaining);
}

export function computePersonalProgressPercent(
  cupsLogged: number,
  cupMl: number,
  dailyGoalMl: number,
): number {
  if (dailyGoalMl <= 0) return 0;
  return Math.min(100, Math.round((cupsLogged * cupMl * 100) / dailyGoalMl));
}

/**
 * 개인 목표(cupMl, dailyGoalMl) 기준으로, 물방울 1개를 얻기 위해
 * 몇 컵을 마셔야 하는지 계산한다. (25%에 해당하는 컵 수)
 * 예: 컵 250ml, 목표 2000ml → 2컵마다 물방울 1개.
 */
export function computeCupsPerDrop(cupMl: number, dailyGoalMl: number): number {
  if (cupMl <= 0 || dailyGoalMl <= 0) return 0;
  const quarterGoalMl = dailyGoalMl / 4;
  return Math.max(1, Math.ceil(quarterGoalMl / cupMl));
}
