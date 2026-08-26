import { describe, expect, it } from "vitest";
import { MockOasisRepository } from "./MockOasisRepository";

describe("물 기록 즉시 확정", () => {
  it("탭 즉시 집계에 반영된다 (confirm 단계 없음)", async () => {
    const repository = new MockOasisRepository();
    const creator = {
      id: "creator",
      nickname: "방장",
      cupMl: 500,
      dailyGoalMl: 2000,
    };
    const created = await repository.createRoom({
      name: "테스트 오아시스",
      profile: creator,
    });

    const result = await repository.logWaterCup(
      created.room.id,
      created.memberId,
    );

    expect(result.dropsContributed).toBe(1);
    expect(result.contributionDropsTotal).toBe(1);
    expect(result.canUndo).toBe(true);

    const state = await repository.getOasisState(
      created.room.id,
      created.memberId,
    );
    const today = state.history.find(
      (day) => day.dayIndex === state.room.dayIndex,
    );
    expect(today?.totalDrops).toBe(1);
  });

  it("초대받은 당일부터 한 잔마다 물방울을 기여한다", async () => {
    const repository = new MockOasisRepository();
    const creator = {
      id: "creator",
      nickname: "방장",
      cupMl: 500,
      dailyGoalMl: 2000,
    };
    const invited = {
      id: "invited",
      nickname: "초대 멤버",
      cupMl: 500,
      dailyGoalMl: 2000,
    };

    const created = await repository.createRoom({
      name: "테스트 오아시스",
      profile: creator,
    });
    const joined = await repository.joinRoom(created.room.id, invited);

    const result = await repository.logWaterCup(
      created.room.id,
      joined.memberId,
    );
    const state = await repository.getOasisState(
      created.room.id,
      joined.memberId,
    );
    const today = state.history.find(
      (day) => day.dayIndex === state.room.dayIndex,
    );

    expect(result.dropsContributed).toBe(1);
    expect(result.contributionDropsTotal).toBe(1);
    expect(today).toMatchObject({
      memberCountSnapshot: 2,
      maxDropsSnapshot: 8,
      totalDrops: 1,
    });
  });
});

describe("되돌리기", () => {
  it("기록 직후에 되돌리면 집계가 감소한다", async () => {
    const repository = new MockOasisRepository();
    const created = await repository.createRoom({
      name: "테스트 오아시스",
      profile: { id: "creator", nickname: "방장", cupMl: 250, dailyGoalMl: 2000 },
    });

    const result = await repository.logWaterCup(created.room.id, created.memberId);

    await repository.undoWaterCup(
      created.room.id,
      created.memberId,
      result.logEntry.logId,
    );

    const state = await repository.getOasisState(created.room.id, created.memberId);
    const today = state.history.find((day) => day.dayIndex === state.room.dayIndex);
    expect(today?.totalDrops).toBe(0);
    expect(state.myHydration?.consumedMl).toBe(0);
  });

  it("이후에 새 기록이 있으면 이전 기록을 되돌릴 수 없다", async () => {
    const repository = new MockOasisRepository();
    const created = await repository.createRoom({
      name: "테스트 오아시스",
      profile: { id: "creator", nickname: "방장", cupMl: 250, dailyGoalMl: 2000 },
    });

    const first = await repository.logWaterCup(created.room.id, created.memberId);
    await repository.logWaterCup(created.room.id, created.memberId);

    await expect(
      repository.undoWaterCup(
        created.room.id,
        created.memberId,
        first.logEntry.logId,
      ),
    ).rejects.toThrow("이미 새로운 기록이 있어서 되돌릴 수 없어요.");
  });
});

describe("방 나가기", () => {
  it("나가면 내 물방울이 빠지고 남은 멤버 기준으로 오늘 오아시스를 다시 계산한다", async () => {
    const repository = new MockOasisRepository();
    const created = await repository.createRoom({
      name: "테스트 오아시스",
      profile: {
        id: "creator",
        nickname: "방장",
        cupMl: 250,
        dailyGoalMl: 2000,
      },
    });
    const joined = await repository.joinRoom(created.room.id, {
      id: "invited",
      nickname: "초대 멤버",
      cupMl: 250,
      dailyGoalMl: 2000,
    });

    await repository.logWaterCup(created.room.id, joined.memberId);
    await repository.leaveRoom(created.room.id, joined.memberId);

    const remaining = await repository.getOasisState(
      created.room.id,
      created.memberId,
    );
    const today = remaining.history.find(
      (day) => day.dayIndex === remaining.room.dayIndex,
    );

    expect(remaining.members.map((member) => member.id)).toEqual([
      created.memberId,
    ]);
    expect(today).toMatchObject({
      memberCountSnapshot: 1,
      maxDropsSnapshot: 4,
      totalDrops: 0,
    });
  });

  it("마지막 멤버가 나가면 방을 삭제한다", async () => {
    const repository = new MockOasisRepository();
    const created = await repository.createRoom({
      name: "혼자 있는 오아시스",
      profile: {
        id: "solo",
        nickname: "혼자",
        cupMl: 250,
        dailyGoalMl: 2000,
      },
      tossAnonymousKey: "solo-key",
    });

    await repository.leaveRoom(created.room.id, created.memberId);

    await expect(
      repository.getOasisState(created.room.id, created.memberId),
    ).rejects.toThrow("방을 찾을 수 없어요.");
    await expect(repository.getMyRooms("solo-key")).resolves.toEqual([]);
  });
});
