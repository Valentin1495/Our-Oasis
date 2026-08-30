import { describe, expect, it, vi } from "vitest";
import {
  rememberMembershipStartDay,
  trackDayTwoReturnOnce,
  trackOasisEvent,
  trackOasisEventOnce,
} from "./oasisAnalytics";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("oasisAnalytics", () => {
  it("log_name과 퍼널 파라미터를 SDK에 전달한다", () => {
    const logger = vi.fn();

    trackOasisEvent(
      "room_created",
      { day_index: 1, room_member_count: 1 },
      logger,
    );

    expect(logger).toHaveBeenCalledWith({
      log_name: "room_created",
      day_index: 1,
      room_member_count: 1,
    });
  });

  it("분석 SDK가 동기적으로 실패해도 사용자 흐름으로 오류를 전파하지 않는다", () => {
    const logger = vi.fn(() => {
      throw new Error("analytics unavailable");
    });

    expect(() => trackOasisEvent("invite_shared", {}, logger)).not.toThrow();
  });

  it("최초 참여 일차는 덮어쓰지 않는다", () => {
    const storage = createMemoryStorage();

    rememberMembershipStartDay("room-1", 1, storage);
    rememberMembershipStartDay("room-1", 3, storage);

    expect(storage.getItem("oasis:analytics:membership-start:room-1")).toBe(
      "1",
    );
  });

  it("같은 전환 이벤트는 dedupe key별로 한 번만 기록한다", () => {
    const storage = createMemoryStorage();
    const track = vi.fn();

    expect(
      trackOasisEventOnce(
        "oasis_75_completed",
        "room-1:day-1",
        { day_index: 1 },
        storage,
        track,
      ),
    ).toBe(true);
    expect(
      trackOasisEventOnce(
        "oasis_75_completed",
        "room-1:day-1",
        { day_index: 1 },
        storage,
        track,
      ),
    ).toBe(false);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("가입 다음 일차 재방문을 한 번만 기록한다", () => {
    const storage = createMemoryStorage();
    const track = vi.fn();
    rememberMembershipStartDay("room-1", 1, storage);

    expect(
      trackDayTwoReturnOnce({
        roomId: "room-1",
        memberId: "member-1",
        dayIndex: 2,
        memberCount: 3,
        storage,
        track,
      }),
    ).toBe(true);
    expect(
      trackDayTwoReturnOnce({
        roomId: "room-1",
        memberId: "member-1",
        dayIndex: 2,
        memberCount: 3,
        storage,
        track,
      }),
    ).toBe(false);

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("day_2_returned", {
      day_index: 2,
      days_since_first_seen: 1,
      room_member_count: 3,
    });
  });

  it("기존 사용자에게 기준점이 없으면 현재 일차는 이벤트 없이 저장한다", () => {
    const storage = createMemoryStorage();
    const track = vi.fn();

    expect(
      trackDayTwoReturnOnce({
        roomId: "room-1",
        memberId: "member-1",
        dayIndex: 4,
        memberCount: 3,
        storage,
        track,
      }),
    ).toBe(false);
    expect(track).not.toHaveBeenCalled();
    expect(storage.getItem("oasis:analytics:membership-start:room-1")).toBe(
      "4",
    );
  });

  it("가입 바로 다음 일차를 놓친 뒤 돌아오면 day 2로 잘못 집계하지 않는다", () => {
    const storage = createMemoryStorage();
    const track = vi.fn();
    rememberMembershipStartDay("room-1", 1, storage);

    expect(
      trackDayTwoReturnOnce({
        roomId: "room-1",
        memberId: "member-1",
        dayIndex: 3,
        memberCount: 3,
        storage,
        track,
      }),
    ).toBe(false);
    expect(track).not.toHaveBeenCalled();
  });
});
