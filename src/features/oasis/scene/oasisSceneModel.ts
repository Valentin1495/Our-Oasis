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
  edgePlantLevel: 0 | 1 | 2;
  bloomState: "none" | "bud" | "flower";
  bloomProgress: number;
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

  return {
    percent: safePercent,
    phase,
    // 1%의 첫 행동은 식별 가능한 최소 수위로 보여 주고 이후 연속 증가한다.
    waterLevel:
      safePercent === 0 ? 0 : 0.06 + (safePercent / 100) * 0.94,
    hasWater: safePercent > 0,
    edgePlantLevel: safePercent < 25 ? 0 : safePercent <= 75 ? 1 : 2,
    bloomState:
      safePercent >= 100 ? "flower" : safePercent >= 75 ? "bud" : "none",
    bloomProgress:
      safePercent < 75
        ? 0
        : safePercent >= 100
          ? 1
          : 0.55 + ((safePercent - 75) / 25) * 0.45,
    isCommunitySuccess: safePercent >= 75,
    isPerfect: safePercent >= 100,
  };
}
