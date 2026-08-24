export interface OasisPoint {
  xPercent: number;
  yPercent: number;
}

export interface MemberDockPosition extends OasisPoint {
  zIndex: number;
}

export interface ScenePoint {
  x: number;
  y: number;
}

export interface WaterDropArc {
  left: [string, string, string];
  top: [string, string, string];
}

export interface OrganicProgress {
  waterwayProgress: number;
  lifeProgress: number;
}

export const SHARED_OASIS_LAYOUT = {
  centerXPercent: 50,
  centerYPercent: 42,
  dockYPercent: 84,
  dockMinXPercent: 12,
  dockMaxXPercent: 88,
  // 2명일 때는 도크 양 끝(12%/88%)에 배치하면 서로 동떨어져 보이므로,
  // 3명일 때의 중앙-바깥 간격과 같은 폭으로 중앙 쪽에 모아 배치한다.
  dockPairHalfSpreadPercent: 19,
  oasisZIndex: 20,
  memberZIndex: 40,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function deriveOrganicProgress(
  progressPercentage: number,
): OrganicProgress {
  const progress = Number.isFinite(progressPercentage)
    ? clamp(progressPercentage, 0, 100)
    : 0;
  const lifeProgress = round(clamp((progress - 75) / 25, 0, 1));

  return {
    waterwayProgress: round(clamp(progress / 75, 0, 1)),
    lifeProgress,
  };
}

export function getMemberDockPosition(
  memberIndex: number,
  memberCount: number,
): MemberDockPosition {
  const count = clamp(Math.floor(memberCount), 1, 5);
  const index = clamp(Math.floor(memberIndex), 0, count - 1);
  const xPercent =
    count === 1
      ? 50
      : count === 2
        ? SHARED_OASIS_LAYOUT.centerXPercent +
          (index === 0 ? -1 : 1) *
            SHARED_OASIS_LAYOUT.dockPairHalfSpreadPercent
        : SHARED_OASIS_LAYOUT.dockMinXPercent +
          (index / (count - 1)) *
            (SHARED_OASIS_LAYOUT.dockMaxXPercent -
              SHARED_OASIS_LAYOUT.dockMinXPercent);

  return {
    xPercent: round(xPercent),
    yPercent: SHARED_OASIS_LAYOUT.dockYPercent,
    zIndex: SHARED_OASIS_LAYOUT.memberZIndex,
  };
}

export function getMeasuredWaterDropArc(
  source: ScenePoint,
  target: ScenePoint,
  sceneHeight: number,
): WaterDropArc {
  const horizontalDistance = target.x - source.x;
  const outwardDirection = Math.sign(source.x - target.x);
  const curveOffset = Math.min(
    Math.abs(horizontalDistance) * 0.12,
    Math.max(8, sceneHeight * 0.035),
  );
  const controlPoint = {
    x: (source.x + target.x) / 2 + outwardDirection * curveOffset,
    y: (source.y + target.y) / 2 - Math.max(12, sceneHeight * 0.055),
  };

  return {
    left: [
      `${round(source.x)}px`,
      `${round(controlPoint.x)}px`,
      `${round(target.x)}px`,
    ],
    top: [
      `${round(source.y)}px`,
      `${round(controlPoint.y)}px`,
      `${round(target.y)}px`,
    ],
  };
}
