import { describe, expect, it } from "vitest";
import { MockOasisRepository } from "./MockOasisRepository";

describe("초대 멤버 공동 기여", () => {
  it("초대받은 당일부터 개인 목표 구간에 따라 물방울을 기여한다", async () => {
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

    const pending = await repository.logWaterCup(
      created.room.id,
      joined.memberId,
    );
    const confirmed = await repository.confirmWaterCup(
      created.room.id,
      joined.memberId,
      pending.logEntry.logId,
    );
    const state = await repository.getOasisState(
      created.room.id,
      joined.memberId,
    );
    const today = state.history.find(
      (day) => day.dayIndex === state.room.dayIndex,
    );

    expect(confirmed.dropsContributed).toBe(1);
    expect(confirmed.contributionDropsTotal).toBe(1);
    expect(today).toMatchObject({
      memberCountSnapshot: 2,
      maxDropsSnapshot: 8,
      totalDrops: 1,
    });
  });
});
