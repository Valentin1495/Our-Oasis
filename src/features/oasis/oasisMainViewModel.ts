import type { Member, OasisState } from "../../types";

export interface OasisProgressMessage {
  headline: string;
  detail: string | null;
  remainingDrops: number;
}

interface ProgressMessageInput {
  percent: number;
  totalDrops: number;
  maxDrops: number;
}

export function deriveOasisProgressMessage({
  percent,
  totalDrops,
  maxDrops,
}: ProgressMessageInput): OasisProgressMessage {
  const safePercent = Math.min(100, Math.max(0, percent));
  const safeMaxDrops = Math.max(0, maxDrops);
  const safeTotalDrops = Math.min(
    safeMaxDrops,
    Math.max(0, totalDrops),
  );
  const successTarget = Math.ceil(safeMaxDrops * 0.75);

  if (safePercent >= 100) {
    return {
      headline: "우리들의 오아시스, 완벽하게 채웠어요",
      detail: null,
      remainingDrops: 0,
    };
  }

  if (safePercent >= 75) {
    const remainingDrops = Math.max(0, safeMaxDrops - safeTotalDrops);
    return {
      headline: "오늘의 오아시스를 완성했어요",
      detail:
        safeMaxDrops > 0
          ? `완벽 달성까지 물 ${remainingDrops}잔 남았어요`
          : null,
      remainingDrops,
    };
  }

  if (safePercent > 0) {
    const remainingDrops = Math.max(0, successTarget - safeTotalDrops);
    return {
      headline: "친구들의 물이 모이고 있어요",
      detail:
        safeMaxDrops > 0
          ? `완성까지 물 ${remainingDrops}잔 남았어요`
          : null,
      remainingDrops,
    };
  }

  return {
    headline: "첫 물 한 잔을 기다리고 있어요",
    detail: null,
    remainingDrops: successTarget,
  };
}

export function getTodayMaxDrops(
  state: Pick<OasisState, "room" | "history" | "members">,
): number {
  const today = state.history.find(
    (record) => record.dayIndex === state.room.dayIndex,
  );
  return today?.maxDropsSnapshot ?? state.members.length * 4;
}

export interface ParticipantSummary {
  participatingCount: number;
  totalCount: number;
  allParticipated: boolean;
  label: string;
}

export function deriveParticipantSummary(
  members: readonly Member[],
): ParticipantSummary {
  const participatingCount = members.filter(
    (member) => member.hasWaterRecordToday,
  ).length;
  const totalCount = members.length;
  const allParticipated =
    totalCount > 0 && participatingCount === totalCount;

  return {
    participatingCount,
    totalCount,
    allParticipated,
    label:
      participatingCount === 0
        ? "첫 물방울을 기다리고 있어요"
        : allParticipated
          ? "오늘 모두 함께 채웠어요"
          : `오늘 ${participatingCount}명이 함께 채웠어요`,
  };
}
