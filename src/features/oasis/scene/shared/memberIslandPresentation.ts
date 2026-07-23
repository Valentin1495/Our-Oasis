export type MemberIslandStatus =
  "pending" | "participated" | "contributing" | "complete";

export type MemberLabelSide = "left" | "center" | "right";

export interface MemberAccent {
  accent: string;
  soft: string;
  ink: string;
}

export interface MemberIslandVisualState {
  progress: number;
  easedProgress: number;
  liftPx: number;
  shadowScaleX: number;
  shadowScaleY: number;
  shadowOpacity: number;
  shadowBlurPx: number;
  hazeOpacity: number;
  saturation: number;
  brightness: number;
  islandOpacity: number;
  connectionOpacity: number;
}

export interface MemberAnimationTiming {
  durationSeconds: number;
  delaySeconds: number;
  hazeDurationSeconds: number;
}

export const MEMBER_ACCENT_PALETTE: readonly MemberAccent[] = [
  { accent: "#e27676", soft: "#ffe3df", ink: "#8d3f43" },
  { accent: "#2ba79d", soft: "#dff8f3", ink: "#176d68" },
  { accent: "#4c91d8", soft: "#e0efff", ink: "#285f99" },
  { accent: "#8a72ca", soft: "#eee8ff", ink: "#584494" },
  { accent: "#d49332", soft: "#fff0cf", ink: "#875d16" },
] as const;

export const MEMBER_DAILY_DROP_TARGET = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function round(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function hashMemberId(memberId: string): number {
  let hash = 0;

  for (const character of memberId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return hash;
}

export function normalizeMemberDrops(drops: number): number {
  if (!Number.isFinite(drops)) return 0;
  return Math.min(4, Math.max(0, Math.round(drops)));
}

export function getMemberIslandStatus({
  drops,
  hasWaterRecordToday,
}: {
  drops: number;
  hasWaterRecordToday: boolean;
}): MemberIslandStatus {
  const normalizedDrops = normalizeMemberDrops(drops);

  if (normalizedDrops >= 4) return "complete";
  if (normalizedDrops > 0) return "contributing";
  if (hasWaterRecordToday) return "participated";
  return "pending";
}

export function getMemberLabelSide(xPercent: number): MemberLabelSide {
  if (xPercent < 45) return "left";
  if (xPercent > 55) return "right";
  return "center";
}

export function getMemberAccent(memberId: string): MemberAccent {
  const hash = hashMemberId(memberId);

  return (
    MEMBER_ACCENT_PALETTE[hash % MEMBER_ACCENT_PALETTE.length] ??
    MEMBER_ACCENT_PALETTE[0]
  );
}

export function getIslandVisualState(
  completed: number,
  total: number,
): MemberIslandVisualState {
  const safeCompleted = Number.isFinite(completed) ? completed : 0;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const progress = safeTotal > 0 ? clamp(safeCompleted / safeTotal, 0, 1) : 0;
  const easedProgress = 1 - (1 - progress) ** 3;

  return {
    progress: round(progress),
    easedProgress: round(easedProgress),
    liftPx: round(interpolate(2, 8, easedProgress), 2),
    shadowScaleX: round(interpolate(0.98, 0.88, easedProgress)),
    shadowScaleY: round(interpolate(0.86, 0.76, easedProgress)),
    shadowOpacity: round(interpolate(0.18, 0.12, easedProgress)),
    shadowBlurPx: round(interpolate(4, 8, easedProgress), 2),
    hazeOpacity: round(interpolate(0.03, 0.12, easedProgress)),
    saturation: round(interpolate(0.62, 1, easedProgress)),
    brightness: round(interpolate(0.9, 1.03, easedProgress)),
    islandOpacity: round(interpolate(0.86, 1, easedProgress)),
    connectionOpacity: round(interpolate(0.1, 0.58, easedProgress)),
  };
}

export function getMemberAnimationTiming(
  memberId: string,
): MemberAnimationTiming {
  const hash = hashMemberId(memberId);
  const durationProgress = (hash % 1_801) / 1_800;
  const durationSeconds = round(interpolate(6.4, 8.2, durationProgress), 2);
  const phaseProgress = ((hash >>> 8) % 1_001) / 1_000;

  return {
    durationSeconds,
    delaySeconds: round(-durationSeconds * phaseProgress, 2),
    hazeDurationSeconds: round(durationSeconds + 3.6, 2),
  };
}
