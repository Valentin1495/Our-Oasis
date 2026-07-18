export type OasisPhase =
  | "dry"
  | "first-life"
  | "growing"
  | "thriving"
  | "community-success"
  | "perfect";

export interface OasisSceneModel {
  percent: number;
  phase: OasisPhase;
  waterLevel: number;
  hasWater: boolean;
  vegetationLevel: 0 | 1 | 2 | 3 | 4 | 5;
  animalLevel: 0 | 1 | 2;
  hasWarmLight: boolean;
  isCommunitySuccess: boolean;
  isPerfect: boolean;
}

function clampPercent(percent: number): number {
  if (Number.isNaN(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

/**
 * 공동 달성률을 오아시스 장면 전용 상태로 변환한다.
 * 서버 상태를 변경하지 않으며, 표시를 위한 파생값만 반환한다.
 */
export function deriveOasisSceneModel(percent: number): OasisSceneModel {
  const safePercent = clampPercent(percent);

  const phase: OasisPhase =
    safePercent === 0
      ? "dry"
      : safePercent < 25
        ? "first-life"
        : safePercent < 50
          ? "growing"
          : safePercent < 75
            ? "thriving"
            : safePercent < 100
              ? "community-success"
              : "perfect";

  const vegetationLevel: OasisSceneModel["vegetationLevel"] =
    phase === "dry"
      ? 0
      : phase === "first-life"
        ? 1
        : phase === "growing"
          ? 2
          : phase === "thriving"
            ? 3
            : phase === "community-success"
              ? 4
              : 5;

  const animalLevel: OasisSceneModel["animalLevel"] =
    phase === "thriving"
      ? 1
      : phase === "community-success" || phase === "perfect"
        ? 2
        : 0;

  return {
    percent: safePercent,
    phase,
    // 첫 행동은 바로 보이게 하되 이후에는 100%까지 연속적으로 증가한다.
    waterLevel:
      safePercent === 0 ? 0 : 0.12 + (safePercent / 100) * 0.88,
    hasWater: safePercent > 0,
    vegetationLevel,
    animalLevel,
    hasWarmLight: safePercent >= 75,
    isCommunitySuccess: safePercent >= 75,
    isPerfect: safePercent >= 100,
  };
}
