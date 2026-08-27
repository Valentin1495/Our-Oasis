import type { DayRecord, OasisStage, OasisState } from "../../types";

export const DAILY_OASIS_TARGET_PERCENT = 75;
export const WEEKLY_OASIS_TARGET_DAYS = 5;

export const OASIS_STAGES = {
  PUDDLE: 1,
  SPROUT: 2,
  PALM: 3,
  COMPLETE: 4,
  PERFECT: 5,
} as const satisfies Record<string, OasisStage>;

export interface CompletionState {
  completionPercent: number;
  requiredDrops: number;
  isComplete: boolean;
  isFullComplete: boolean;
}

/** 표시 퍼센트와 성공 판정을 같은 정수 물방울 규칙에서 계산한다. */
export function getCompletionState(
  totalDrops: number,
  maxDrops: number,
): CompletionState {
  if (maxDrops <= 0) {
    return {
      completionPercent: 0,
      requiredDrops: 0,
      isComplete: false,
      isFullComplete: false,
    };
  }

  const safeDrops = Math.max(0, totalDrops);
  const completionPercent = Math.min(100, (safeDrops / maxDrops) * 100);
  const requiredDrops = Math.ceil(maxDrops * 0.75);

  return {
    completionPercent,
    requiredDrops,
    isComplete: safeDrops >= requiredDrops,
    isFullComplete: safeDrops >= maxDrops,
  };
}

export function getOasisStage(percent: number): OasisStage {
  if (percent < 25) return OASIS_STAGES.PUDDLE;
  if (percent < 50) return OASIS_STAGES.SPROUT;
  if (percent < 75) return OASIS_STAGES.PALM;
  if (percent < 100) return OASIS_STAGES.COMPLETE;
  return OASIS_STAGES.PERFECT;
}

export function isDailyOasisComplete(percent: number): boolean {
  return percent >= DAILY_OASIS_TARGET_PERCENT;
}

export interface ParticipationLog {
  memberId: string;
  confirmed: boolean;
}

/** 취소되지 않고 확정된 실제 물 기록을 1회 이상 남긴 멤버만 센다. */
export function didAllEligibleMembersParticipate(
  eligibleMemberIds: readonly string[],
  logs: readonly ParticipationLog[],
): boolean {
  if (eligibleMemberIds.length === 0) return false;
  const confirmedMembers = new Set(
    logs.filter((log) => log.confirmed).map((log) => log.memberId),
  );
  return eligibleMemberIds.every((memberId) => confirmedMembers.has(memberId));
}

export function countCompletedDays(history: DayRecord[]): number {
  return history.filter((day) => day.isComplete).length;
}

export function getWeeklyRewards(history: DayRecord[]) {
  const completedDays = history.filter((day) => day.isComplete).length;
  const fullCompleteDays = history.filter((day) => day.isFullComplete).length;
  const allParticipatedDays = history.filter(
    (day) => day.allParticipated,
  ).length;

  return {
    completedDays,
    fullCompleteDays,
    allParticipatedDays,
    fullCompleteStarCount: fullCompleteDays,
    allParticipatedStarCount: allParticipatedDays,
    isFinalOasisUnlocked: completedDays >= WEEKLY_OASIS_TARGET_DAYS,
    isRareFinalOasisUnlocked: completedDays >= 7,
    isSpecialCharacterSettled: allParticipatedDays >= 5,
  };
}

export type PendingRewardScene =
  | "rare-final-oasis"
  | "special-character"
  | "rare-final-oasis-with-special-character";

/** 아직 연출이 준비되지 않은 최종 보상 장면의 조합을 결정한다. */
export function getPendingRewardScene({
  isRareFinalOasisUnlocked,
  isSpecialCharacterSettled,
}: {
  isRareFinalOasisUnlocked: boolean;
  isSpecialCharacterSettled: boolean;
}): PendingRewardScene | null {
  if (isRareFinalOasisUnlocked && isSpecialCharacterSettled) {
    return "rare-final-oasis-with-special-character";
  }
  if (isRareFinalOasisUnlocked) return "rare-final-oasis";
  if (isSpecialCharacterSettled) return "special-character";
  return null;
}

export function getOasisAchievements(state: OasisState) {
  const today = state.history.find(
    (day) => day.dayIndex === state.room.dayIndex,
  );
  const weekly = getWeeklyRewards(state.history);

  return {
    isTodayComplete:
      today?.isComplete ?? isDailyOasisComplete(state.sharedProgressPercent),
    isTodayFullComplete:
      today?.isFullComplete ?? state.sharedProgressPercent >= 100,
    allMembersParticipatedToday: today?.allParticipated ?? false,
    ...weekly,
  };
}
