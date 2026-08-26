import { describe, expect, it } from "vitest";
import { mergeRoomSummaries } from "./myRoomsList";
import type { MyRoomSummary } from "../../types";

function makeSummary(overrides: Partial<MyRoomSummary> = {}): MyRoomSummary {
  return {
    room: {
      id: "room-1",
      name: "테스트 오아시스",
      durationDays: 7,
      maxMembers: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      dayIndex: 1,
    },
    memberId: "member-1",
    nickname: "나",
    cupMl: 250,
    dailyGoalMl: 2000,
    ...overrides,
  };
}

describe("mergeRoomSummaries", () => {
  it("서버 조회가 실패해도(빈 배열) 로컬 기록만으로 목록을 만든다", () => {
    const local = [makeSummary()];
    expect(mergeRoomSummaries([], local)).toEqual(local);
  });

  it("서버와 로컬에 같은 방이 있으면 서버 데이터를 우선한다", () => {
    const server = [makeSummary({ nickname: "서버닉네임" })];
    const local = [makeSummary({ nickname: "로컬닉네임" })];
    const merged = mergeRoomSummaries(server, local);
    expect(merged).toHaveLength(1);
    expect(merged[0].nickname).toBe("서버닉네임");
  });

  it("로컬에만 있는 방은 그대로 유지한다", () => {
    const server = [makeSummary({ room: { ...makeSummary().room, id: "room-server" } })];
    const local = [makeSummary({ room: { ...makeSummary().room, id: "room-local" } })];
    const merged = mergeRoomSummaries(server, local);
    expect(merged.map((item) => item.room.id).sort()).toEqual([
      "room-local",
      "room-server",
    ]);
  });
});
