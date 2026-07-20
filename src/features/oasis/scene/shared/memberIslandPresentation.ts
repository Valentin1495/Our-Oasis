export type MemberIslandStatus =
  "pending" | "participated" | "contributing" | "complete";

export type MemberLabelSide = "left" | "center" | "right";

export interface MemberAccent {
  accent: string;
  soft: string;
  ink: string;
}

export const MEMBER_ACCENT_PALETTE: readonly MemberAccent[] = [
  { accent: "#e27676", soft: "#ffe3df", ink: "#8d3f43" },
  { accent: "#2ba79d", soft: "#dff8f3", ink: "#176d68" },
  { accent: "#4c91d8", soft: "#e0efff", ink: "#285f99" },
  { accent: "#8a72ca", soft: "#eee8ff", ink: "#584494" },
  { accent: "#d49332", soft: "#fff0cf", ink: "#875d16" },
] as const;

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
  let hash = 0;

  for (const character of memberId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return (
    MEMBER_ACCENT_PALETTE[hash % MEMBER_ACCENT_PALETTE.length] ??
    MEMBER_ACCENT_PALETTE[0]
  );
}
