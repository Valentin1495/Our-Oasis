import { describe, expect, it } from "vitest";
import type { DayRecord } from "../../types";
import { getContributionDrops } from "../water/computeContributionDrops";
import {
  OASIS_STAGES,
  didAllEligibleMembersParticipate,
  getCompletionState,
  getOasisStage,
  getWeeklyRewards,
  isDailyOasisComplete,
} from "./oasisRules";

function day(
  dayIndex: number,
  overrides: Partial<DayRecord> = {},
): DayRecord {
  return {
    roomId: "room",
    dayIndex,
    localDate: `2026-07-${String(dayIndex).padStart(2, "0")}`,
    totalDrops: 0,
    memberCountSnapshot: 4,
    maxDropsSnapshot: 16,
    completionPercent: 0,
    participatingMemberCount: 0,
    isComplete: false,
    isFullComplete: false,
    allParticipated: false,
    ...overrides,
  };
}

describe("isDailyOasisComplete", () => {
  it.each([
    [74.99, false],
    [75, true],
    [100, true],
  ])("%s%% 경계를 판정한다", (percent, expected) => {
    expect(isDailyOasisComplete(percent)).toBe(expected);
  });
});

describe("getOasisStage", () => {
  it.each([
    [0, OASIS_STAGES.PUDDLE],
    [24.99, OASIS_STAGES.PUDDLE],
    [25, OASIS_STAGES.SPROUT],
    [49.99, OASIS_STAGES.SPROUT],
    [50, OASIS_STAGES.PALM],
    [74.99, OASIS_STAGES.PALM],
    [75, OASIS_STAGES.COMPLETE],
    [99.99, OASIS_STAGES.COMPLETE],
    [100, OASIS_STAGES.PERFECT],
    [120, OASIS_STAGES.PERFECT],
  ])("%s%%의 단계를 반환한다", (percent, expected) => {
    expect(getOasisStage(percent)).toBe(expected);
  });
});

describe("getCompletionState", () => {
  it.each([
    [6, 8],
    [9, 12],
    [12, 16],
    [15, 20],
  ])("%s/%s 물방울에서 기본 완성된다", (totalDrops, maxDrops) => {
    expect(getCompletionState(totalDrops, maxDrops)).toMatchObject({
      completionPercent: 75,
      isComplete: true,
      isFullComplete: false,
    });
  });

  it("100%에서는 기본 완성과 최고 등급 완성이 모두 참이다", () => {
    expect(getCompletionState(16, 16)).toMatchObject({
      completionPercent: 100,
      isComplete: true,
      isFullComplete: true,
    });
  });
});

describe("개인 물방울", () => {
  it.each([
    [499, 0],
    [500, 1],
    [1000, 2],
    [1500, 3],
    [2000, 4],
    [2500, 4],
  ])("2000ml 목표에서 %sml는 %s개다", (consumedMl, drops) => {
    expect(getContributionDrops(consumedMl, 2000)).toBe(drops);
  });
});

describe("전원 참여", () => {
  const members = ["a", "b"];

  it("각 멤버가 확정 기록을 한 번 이상 남기면 참이다", () => {
    expect(
      didAllEligibleMembersParticipate(members, [
        { memberId: "a", confirmed: true },
        { memberId: "b", confirmed: true },
      ]),
    ).toBe(true);
  });

  it("기록이 없는 멤버가 있으면 거짓이다", () => {
    expect(
      didAllEligibleMembersParticipate(members, [
        { memberId: "a", confirmed: true },
      ]),
    ).toBe(false);
  });

  it("물방울 획득 여부와 관계없이 확정된 첫 기록을 참여로 센다", () => {
    expect(
      didAllEligibleMembersParticipate(["a"], [
        { memberId: "a", confirmed: true },
      ]),
    ).toBe(true);
  });

  it("취소된 기록만 있으면 참여로 세지 않는다", () => {
    expect(
      didAllEligibleMembersParticipate(["a"], [
        { memberId: "a", confirmed: false },
      ]),
    ).toBe(false);
  });
});

describe("주간 보상", () => {
  it("완성 5일, 완성 7일, 전원 참여 5일을 각각 계산한다", () => {
    const fiveDays = Array.from({ length: 7 }, (_, index) =>
      day(index + 1, {
        isComplete: index < 5,
        isFullComplete: index < 2,
        allParticipated: index < 5,
      }),
    );
    expect(getWeeklyRewards(fiveDays)).toMatchObject({
      isFinalOasisUnlocked: true,
      isRareFinalOasisUnlocked: false,
      isSpecialCharacterSettled: true,
      fullCompleteStarCount: 2,
      allParticipatedStarCount: 5,
    });

    const sevenDays = fiveDays.map((record) => ({
      ...record,
      isComplete: true,
    }));
    expect(getWeeklyRewards(sevenDays).isRareFinalOasisUnlocked).toBe(true);
  });
});
