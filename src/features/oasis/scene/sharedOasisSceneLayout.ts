export interface OasisPoint {
  xPercent: number;
  yPercent: number;
}

export interface MemberDockPosition extends OasisPoint {
  zIndex: number;
}

export interface WaterDropArc {
  left: [string, string, string];
  top: [string, string, string];
}

export interface StageRingProgress {
  sharedProgress: number;
  perfectProgress: number;
}

export const SHARED_OASIS_LAYOUT = {
  centerXPercent: 50,
  centerYPercent: 42,
  dockYPercent: 84,
  dockMinXPercent: 12,
  dockMaxXPercent: 88,
  oasisZIndex: 20,
  memberZIndex: 40,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function deriveStageRingProgress(
  progressPercentage: number,
): StageRingProgress {
  const progress = Number.isFinite(progressPercentage)
    ? clamp(progressPercentage, 0, 100)
    : 0;

  return {
    sharedProgress: round(clamp(progress / 75, 0, 1)),
    perfectProgress: round(clamp((progress - 75) / 25, 0, 1)),
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

export function getWaterDropArc(
  source: OasisPoint,
  target: OasisPoint = {
    xPercent: SHARED_OASIS_LAYOUT.centerXPercent,
    yPercent: SHARED_OASIS_LAYOUT.centerYPercent,
  },
): WaterDropArc {
  const controlPoint = {
    xPercent: (source.xPercent + target.xPercent) / 2,
    yPercent: Math.max(12, Math.min(source.yPercent, target.yPercent) - 12),
  };

  return {
    left: [
      `${source.xPercent}%`,
      `${round(controlPoint.xPercent)}%`,
      `${target.xPercent}%`,
    ],
    top: [
      `${source.yPercent - 7}%`,
      `${round(controlPoint.yPercent)}%`,
      `${target.yPercent}%`,
    ],
  };
}
