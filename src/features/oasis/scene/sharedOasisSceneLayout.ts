export interface MemberOrbitPosition {
  xPercent: number;
  yPercent: number;
  zIndex: number;
  depth: "back" | "front";
  depthRatio: number;
  depthScale: number;
  depthBrightness: number;
  depthOpacity: number;
}

export interface MemberOrbitGeometry {
  radiusXPercent: number;
  radiusYPercent: number;
  startAngleRadians: number;
}

export interface OasisPoint {
  xPercent: number;
  yPercent: number;
}

export interface WaterDropArc {
  left: [string, string, string];
  top: [string, string, string];
}

export interface MemberConnectionPath {
  d: string;
  start: OasisPoint;
  control1: OasisPoint;
  control2: OasisPoint;
  target: OasisPoint;
}

export const SHARED_OASIS_LAYOUT = {
  centerXPercent: 50,
  centerYPercent: 53,
  memberSizePercent: 25,
  oasisZIndex: 100,
  backZIndexMin: 70,
  backZIndexMax: 99,
  frontZIndexMin: 101,
  frontZIndexMax: 130,
  depthEpsilon: 0.0001,
  orbitByMemberCount: {
    1: {
      radiusXPercent: 37,
      radiusYPercent: 27,
      startAngleRadians: Math.PI / 2,
    },
    2: {
      radiusXPercent: 47,
      radiusYPercent: 27,
      startAngleRadians: (-3 * Math.PI) / 4,
    },
    3: {
      radiusXPercent: 43,
      radiusYPercent: 27,
      startAngleRadians: (-5 * Math.PI) / 6,
    },
    4: {
      radiusXPercent: 47,
      radiusYPercent: 27,
      startAngleRadians: (-3 * Math.PI) / 4,
    },
    5: {
      radiusXPercent: 37.5,
      radiusYPercent: 27,
      startAngleRadians: (-7 * Math.PI) / 10,
    },
  },
} as const;

export function getMemberOrbitGeometry(
  memberCount: number,
): MemberOrbitGeometry {
  const safeMemberCount = Math.min(5, Math.max(1, Math.floor(memberCount))) as
    1 | 2 | 3 | 4 | 5;

  return SHARED_OASIS_LAYOUT.orbitByMemberCount[safeMemberCount];
}

export function getMemberOrbitPosition(
  memberIndex: number,
  memberCount: number,
): MemberOrbitPosition {
  const safeMemberCount = Math.max(1, Math.floor(memberCount));
  const safeMemberIndex = Math.max(0, Math.floor(memberIndex));
  const geometry = getMemberOrbitGeometry(safeMemberCount);
  const angle =
    geometry.startAngleRadians +
    safeMemberIndex * ((Math.PI * 2) / safeMemberCount);
  const xOffset = Math.cos(angle) * geometry.radiusXPercent;
  const rawDepth = Math.sin(angle);
  const normalizedDepth =
    Math.abs(rawDepth) < SHARED_OASIS_LAYOUT.depthEpsilon ? 0 : rawDepth;
  const yOffset = normalizedDepth * geometry.radiusYPercent;
  const isFront = normalizedDepth >= 0;
  const depthProgress = (normalizedDepth + 1) / 2;
  const zIndex = isFront
    ? SHARED_OASIS_LAYOUT.frontZIndexMin +
      Math.round(
        normalizedDepth *
          (SHARED_OASIS_LAYOUT.frontZIndexMax -
            SHARED_OASIS_LAYOUT.frontZIndexMin),
      )
    : SHARED_OASIS_LAYOUT.backZIndexMax -
      Math.round(
        Math.abs(normalizedDepth) *
          (SHARED_OASIS_LAYOUT.backZIndexMax -
            SHARED_OASIS_LAYOUT.backZIndexMin),
      );
  const xPercent = SHARED_OASIS_LAYOUT.centerXPercent + xOffset;

  return {
    xPercent,
    yPercent: SHARED_OASIS_LAYOUT.centerYPercent + yOffset,
    zIndex,
    depth: isFront ? "front" : "back",
    depthRatio: roundSceneCoordinate(normalizedDepth),
    depthScale: roundSceneCoordinate(0.86 + depthProgress * 0.18),
    depthBrightness: roundSceneCoordinate(0.94 + depthProgress * 0.08),
    depthOpacity: roundSceneCoordinate(0.9 + depthProgress * 0.1),
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
    yPercent: Math.max(12, Math.min(source.yPercent, target.yPercent) - 14),
  };

  return {
    left: [
      `${source.xPercent}%`,
      `${controlPoint.xPercent}%`,
      `${target.xPercent}%`,
    ],
    top: [
      `${source.yPercent - 5}%`,
      `${controlPoint.yPercent}%`,
      `${target.yPercent}%`,
    ],
  };
}

function clampSceneCoordinate(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function roundSceneCoordinate(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function getMemberConnectionPath(
  source: OasisPoint,
  target: OasisPoint = {
    xPercent: SHARED_OASIS_LAYOUT.centerXPercent,
    yPercent: SHARED_OASIS_LAYOUT.centerYPercent,
  },
): MemberConnectionPath {
  const start = {
    xPercent: roundSceneCoordinate(clampSceneCoordinate(source.xPercent)),
    yPercent: roundSceneCoordinate(clampSceneCoordinate(source.yPercent)),
  };
  const safeTarget = {
    xPercent: roundSceneCoordinate(clampSceneCoordinate(target.xPercent)),
    yPercent: roundSceneCoordinate(clampSceneCoordinate(target.yPercent)),
  };
  const dx = safeTarget.xPercent - start.xPercent;
  const dy = safeTarget.yPercent - start.yPercent;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const perpendicularX = -dy / distance;
  const perpendicularY = dx / distance;
  const bendDirection = start.xPercent <= safeTarget.xPercent ? -1 : 1;
  const bendStrength = Math.min(12, 5 + distance * 0.11);
  const control1 = {
    xPercent: roundSceneCoordinate(
      clampSceneCoordinate(
        start.xPercent +
          dx * 0.32 +
          perpendicularX * bendStrength * bendDirection,
      ),
    ),
    yPercent: roundSceneCoordinate(
      clampSceneCoordinate(
        start.yPercent +
          dy * 0.32 +
          perpendicularY * bendStrength * bendDirection,
      ),
    ),
  };
  const control2 = {
    xPercent: roundSceneCoordinate(
      clampSceneCoordinate(
        start.xPercent +
          dx * 0.72 -
          perpendicularX * bendStrength * bendDirection * 0.45,
      ),
    ),
    yPercent: roundSceneCoordinate(
      clampSceneCoordinate(
        start.yPercent +
          dy * 0.72 -
          perpendicularY * bendStrength * bendDirection * 0.45,
      ),
    ),
  };

  return {
    d: `M ${start.xPercent} ${start.yPercent} C ${control1.xPercent} ${control1.yPercent} ${control2.xPercent} ${control2.yPercent} ${safeTarget.xPercent} ${safeTarget.yPercent}`,
    start,
    control1,
    control2,
    target: safeTarget,
  };
}
