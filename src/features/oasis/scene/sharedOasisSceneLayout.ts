export interface MemberOrbitPosition {
  xPercent: number;
  yPercent: number;
  zIndex: number;
  depth: "back" | "front";
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

export const SHARED_OASIS_LAYOUT = {
  centerXPercent: 50,
  centerYPercent: 56,
  memberSizePercent: 20,
  oasisZIndex: 100,
  backZIndexMin: 70,
  backZIndexMax: 99,
  frontZIndexMin: 101,
  frontZIndexMax: 130,
  depthEpsilon: 0.0001,
  orbitByMemberCount: {
    1: {
      radiusXPercent: 37,
      radiusYPercent: 30,
      startAngleRadians: Math.PI / 2,
    },
    2: {
      radiusXPercent: 50,
      radiusYPercent: 30,
      startAngleRadians: (-3 * Math.PI) / 4,
    },
    3: {
      radiusXPercent: 44,
      radiusYPercent: 30,
      startAngleRadians: (-5 * Math.PI) / 6,
    },
    4: {
      radiusXPercent: 50,
      radiusYPercent: 30,
      startAngleRadians: (-3 * Math.PI) / 4,
    },
    5: {
      radiusXPercent: 42,
      radiusYPercent: 30,
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
