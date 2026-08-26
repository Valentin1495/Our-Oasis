import { describe, expect, it } from "vitest";
import type { Member } from "../../types";
import {
  deriveOasisProgressMessage,
  deriveParticipantSummary,
  getTodayMaxDrops,
} from "./oasisMainViewModel";

describe("deriveOasisProgressMessage", () => {
  it("0%에서는 첫 물을 기다린다", () => {
    expect(
      deriveOasisProgressMessage({
        percent: 0,
        totalDrops: 0,
        maxDrops: 20,
      }),
    ).toMatchObject({
      headline: "첫 물 한 잔을 기다리고 있어요",
      detail: null,
      remainingDrops: 15,
    });
  });

  it("75% 성공까지 남은 물 잔 수를 계산한다", () => {
    expect(
      deriveOasisProgressMessage({
        percent: 60,
        totalDrops: 12,
        maxDrops: 20,
      }),
    ).toMatchObject({
      headline: "친구들의 물이 모이고 있어요",
      detail: "완성까지 물 3잔 남았어요",
      remainingDrops: 3,
    });
  });

  it("75%부터 완벽 달성까지 남은 물 잔 수를 계산한다", () => {
    expect(
      deriveOasisProgressMessage({
        percent: 75,
        totalDrops: 15,
        maxDrops: 20,
      }),
    ).toMatchObject({
      headline: "오늘의 오아시스를 완성했어요",
      detail: "완벽 달성까지 물 5잔 남았어요",
      remainingDrops: 5,
    });
  });

  it("100%는 완벽 성공 문구를 반환한다", () => {
    expect(
      deriveOasisProgressMessage({
        percent: 100,
        totalDrops: 20,
        maxDrops: 20,
      }),
    ).toEqual({
      headline: "우리들의 오아시스, 완벽하게 채웠어요",
      detail: null,
      remainingDrops: 0,
    });
  });
});

describe("getTodayMaxDrops", () => {
  const room = {
    id: "room",
    name: "테스트 오아시스",
    durationDays: 7,
    maxMembers: 5,
    createdAt: "2026-07-18T00:00:00.000Z",
    dayIndex: 2,
  } as const;

  it("오늘 기록의 snapshot을 우선 사용한다", () => {
    expect(
      getTodayMaxDrops({
        room,
        history: [
          {
            roomId: room.id,
            dayIndex: 2,
            localDate: "2026-07-18",
            totalDrops: 8,
            memberCountSnapshot: 4,
            maxDropsSnapshot: 16,
            completionPercent: 50,
            participatingMemberCount: 3,
            isComplete: false,
            isFullComplete: false,
            allParticipated: false,
          },
        ],
        members: [],
      }),
    ).toBe(16);
  });

  it("오늘 기록의 snapshot이 0이면 아직 초기화되지 않은 것으로 보고 멤버당 4개로 계산한다", () => {
    const members: Member[] = Array.from({ length: 2 }, (_, index) => ({
      id: `${index}`,
      nickname: `${index}`,
      todayProgressPercent: 0,
      contributedDropsToday: 0,
      hasWaterRecordToday: false,
    }));

    expect(
      getTodayMaxDrops({
        room,
        history: [
          {
            roomId: room.id,
            dayIndex: 2,
            localDate: "2026-07-18",
            totalDrops: 0,
            memberCountSnapshot: 0,
            maxDropsSnapshot: 0,
            completionPercent: 0,
            participatingMemberCount: 0,
            isComplete: false,
            isFullComplete: false,
            allParticipated: false,
          },
        ],
        members,
      }),
    ).toBe(8);
  });

  it("오늘 기록이 없으면 멤버당 4개로 계산한다", () => {
    const members: Member[] = Array.from({ length: 3 }, (_, index) => ({
      id: `${index}`,
      nickname: `${index}`,
      todayProgressPercent: 0,
      contributedDropsToday: 0,
      hasWaterRecordToday: false,
    }));

    expect(
      getTodayMaxDrops({
        room,
        history: [],
        members,
      }),
    ).toBe(12);
  });
});

describe("deriveParticipantSummary", () => {
  const member = (
    id: string,
    hasWaterRecordToday: boolean,
  ): Member => ({
    id,
    nickname: id,
    todayProgressPercent: hasWaterRecordToday ? 25 : 0,
    contributedDropsToday: hasWaterRecordToday ? 1 : 0,
    hasWaterRecordToday,
  });

  it("참여자가 없을 때 첫 물방울 문구를 표시한다", () => {
    expect(
      deriveParticipantSummary([member("a", false), member("b", false)]),
    ).toMatchObject({
      participatingCount: 0,
      allParticipated: false,
      label: "첫 물방울을 기다리고 있어요",
    });
  });

  it("일부 참여 인원을 요약한다", () => {
    expect(
      deriveParticipantSummary([member("a", true), member("b", false)]),
    ).toMatchObject({
      participatingCount: 1,
      totalCount: 2,
      label: "오늘 1명이 함께 채웠어요",
    });
  });

  it("전원 참여를 별도 문구로 표현한다", () => {
    expect(
      deriveParticipantSummary([member("a", true), member("b", true)]),
    ).toMatchObject({
      allParticipated: true,
      label: "오늘 모두 함께 채웠어요",
    });
  });
});
