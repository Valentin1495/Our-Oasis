import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOasisStore } from "./useOasisStore";
import type { OasisRepository } from "../repository/OasisRepository";
import type { OasisState, Room, WaterLogResult } from "../../types";

const room: Room = {
  id: "room-1",
  name: "테스트 오아시스",
  durationDays: 7,
  maxMembers: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
  dayIndex: 1,
};

function makeOasisState(overrides: Partial<OasisState> = {}): OasisState {
  return {
    room,
    members: [
      {
        id: "member-1",
        nickname: "나",
        todayProgressPercent: 0,
        contributedDropsToday: 0,
        hasWaterRecordToday: false,
      },
    ],
    sharedProgressPercent: 0,
    totalDrops: 0,
    stage: 1,
    history: [],
    myHydration: { consumedMl: 0, goalMl: 2000, contributionDrops: 0 },
    ...overrides,
  };
}

function makeLogResult(overrides: Partial<WaterLogResult> = {}): WaterLogResult {
  return {
    logEntry: {
      logId: "log-1",
      memberId: "member-1",
      roomId: room.id,
      recordedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5000).toISOString(),
    },
    newPersonalProgressPercent: 13,
    dropsContributed: 1,
    newSharedProgressPercent: 25,
    newConsumedMl: 250,
    contributionDropsTotal: 1,
    canUndo: true,
    ...overrides,
  };
}

function makeRepository(
  overrides: Partial<OasisRepository> = {},
): OasisRepository {
  return {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    getMyRooms: vi.fn().mockResolvedValue([]),
    getOasisState: vi.fn().mockResolvedValue(makeOasisState()),
    logWaterCup: vi.fn().mockResolvedValue(makeLogResult()),
    undoWaterCup: vi.fn().mockResolvedValue(undefined),
    leaveRoom: vi.fn(),
    getWeeklyHistory: vi.fn(),
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useOasisStore", () => {
  beforeEach(() => {
    useOasisStore.setState({
      oasisState: null,
      isLoadingOasis: false,
      oasisError: null,
      isLoggingWater: false,
      undoWindow: null,
      waterLogFeedback: null,
      recentConfirmedWaterAt: [],
      waterLogFeedbackId: 0,
      currentRoom: room,
      memberId: "member-1",
      profile: { id: "member-1", nickname: "나", cupMl: 250, dailyGoalMl: 2000 },
      joinedRooms: [],
    });
  });

  describe("joinedRooms (로컬 참여 목록)", () => {
    const summary = {
      room,
      memberId: "member-1",
      nickname: "나",
      cupMl: 250,
      dailyGoalMl: 2000,
    };

    it("rememberJoinedRoom으로 추가하면 목록에 나타난다", () => {
      useOasisStore.getState().rememberJoinedRoom(summary);
      expect(useOasisStore.getState().joinedRooms).toEqual([summary]);
    });

    it("같은 방을 다시 기억하면 중복 없이 최신 정보로 갱신된다", () => {
      useOasisStore.getState().rememberJoinedRoom(summary);
      const updated = { ...summary, nickname: "새 닉네임" };
      useOasisStore.getState().rememberJoinedRoom(updated);

      const rooms = useOasisStore.getState().joinedRooms;
      expect(rooms).toHaveLength(1);
      expect(rooms[0].nickname).toBe("새 닉네임");
    });

    it("forgetJoinedRoom으로 해당 방만 제거한다", () => {
      const other = { ...summary, room: { ...room, id: "room-2" } };
      useOasisStore.setState({ joinedRooms: [summary, other] });

      useOasisStore.getState().forgetJoinedRoom(room.id);

      expect(useOasisStore.getState().joinedRooms).toEqual([other]);
    });

    it("reset()을 호출해도 joinedRooms는 보존된다", () => {
      useOasisStore.setState({ joinedRooms: [summary] });

      useOasisStore.getState().reset();

      expect(useOasisStore.getState().joinedRooms).toEqual([summary]);
      expect(useOasisStore.getState().currentRoom).toBeNull();
    });

    it("leaveRoom에 성공하면 그 방을 joinedRooms에서 지운다", async () => {
      const other = { ...summary, room: { ...room, id: "room-2" } };
      useOasisStore.setState({
        oasisState: makeOasisState(),
        joinedRooms: [summary, other],
        repository: makeRepository({ leaveRoom: vi.fn().mockResolvedValue(undefined) }),
      });

      await useOasisStore.getState().leaveRoom();

      expect(useOasisStore.getState().joinedRooms).toEqual([other]);
    });
  });

  describe("setCurrentRoom", () => {
    it("다른 방을 선택하면 이전 방의 오아시스 상태를 즉시 비운다", () => {
      const nextRoom = { ...room, id: "room-2", name: "새 오아시스" };
      useOasisStore.setState({
        oasisState: makeOasisState({ totalDrops: 4 }),
        oasisError: "이전 오류",
      });

      useOasisStore.getState().setCurrentRoom(nextRoom);

      expect(useOasisStore.getState().currentRoom).toEqual(nextRoom);
      expect(useOasisStore.getState().oasisState).toBeNull();
      expect(useOasisStore.getState().oasisError).toBeNull();
    });

    it("같은 방을 다시 선택하면 현재 오아시스 상태를 유지한다", () => {
      const currentOasisState = makeOasisState({ totalDrops: 2 });
      useOasisStore.setState({ oasisState: currentOasisState });

      useOasisStore.getState().setCurrentRoom(room);

      expect(useOasisStore.getState().oasisState).toBe(currentOasisState);
    });
  });

  describe("loadOasisState", () => {
    it("먼저 시작했지만 늦게 도착한 응답으로 나중 요청 결과를 덮어쓰지 않는다", async () => {
      const first = deferred<OasisState>();
      const second = deferred<OasisState>();
      const getOasisState = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      useOasisStore.setState({ repository: makeRepository({ getOasisState }) });

      const firstCall = useOasisStore.getState().loadOasisState(room.id);
      const secondCall = useOasisStore.getState().loadOasisState(room.id);

      second.resolve(makeOasisState({ totalDrops: 2 }));
      await secondCall;
      first.resolve(makeOasisState({ totalDrops: 0 }));
      await firstCall;

      expect(useOasisStore.getState().oasisState?.totalDrops).toBe(2);
    });

    it("가장 나중에 시작한 요청의 응답은 정상적으로 반영된다", async () => {
      const getOasisState = vi
        .fn()
        .mockResolvedValueOnce(makeOasisState({ totalDrops: 1 }))
        .mockResolvedValueOnce(makeOasisState({ totalDrops: 3 }));
      useOasisStore.setState({ repository: makeRepository({ getOasisState }) });

      await useOasisStore.getState().loadOasisState(room.id);
      await useOasisStore.getState().loadOasisState(room.id);

      expect(useOasisStore.getState().oasisState?.totalDrops).toBe(3);
    });
  });

  describe("logWaterCup", () => {
    it("탭 즉시 오아시스 상태와 피드백이 갱신된다", async () => {
      const afterState = makeOasisState({ totalDrops: 1, sharedProgressPercent: 25 });
      const getOasisState = vi.fn().mockResolvedValue(afterState);
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository({ getOasisState }),
      });

      await useOasisStore.getState().logWaterCup();

      expect(useOasisStore.getState().oasisState?.totalDrops).toBe(1);
      expect(useOasisStore.getState().waterLogFeedback?.dropsContributed).toBe(1);
      expect(useOasisStore.getState().isLoggingWater).toBe(false);
    });

    it("기록 직후 되돌리기 창이 열리고 버튼은 막히지 않는다", async () => {
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository(),
      });

      await useOasisStore.getState().logWaterCup();

      expect(useOasisStore.getState().undoWindow).not.toBeNull();
      // 버튼 잠금 여부는 isLoggingWater만 보므로, 기록 완료 후 false여야 한다
      expect(useOasisStore.getState().isLoggingWater).toBe(false);
    });

    it("연속으로 두 번 탭하면 각각 독립적으로 기록된다 (중복 없음)", async () => {
      const logWaterCup = vi
        .fn()
        .mockResolvedValueOnce(makeLogResult({ dropsContributed: 1, contributionDropsTotal: 1 }))
        .mockResolvedValueOnce(makeLogResult({ dropsContributed: 1, contributionDropsTotal: 2, logEntry: { logId: "log-2", memberId: "member-1", roomId: room.id, recordedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 5000).toISOString() } }));
      const getOasisState = vi.fn().mockResolvedValue(makeOasisState());
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository({ logWaterCup, getOasisState }),
      });

      // 두 번째 탭은 이전 되돌리기 창을 닫고 새 기록을 생성한다
      await useOasisStore.getState().logWaterCup();
      await useOasisStore.getState().logWaterCup();

      expect(logWaterCup).toHaveBeenCalledTimes(2);
      expect(useOasisStore.getState().oasisError).toBeNull();
    });

    it("RPC 실패 시 에러를 저장하고 isLoggingWater를 해제한다", async () => {
      const logWaterCup = vi.fn().mockRejectedValue(new Error("네트워크 오류"));
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository({ logWaterCup }),
      });

      await useOasisStore.getState().logWaterCup();

      expect(useOasisStore.getState().isLoggingWater).toBe(false);
      expect(useOasisStore.getState().oasisError).toBe("네트워크 오류");
    });

    it("이미 기록 중이면 중복 호출을 무시한다", async () => {
      const logWaterCupFn = vi.fn().mockResolvedValue(makeLogResult());
      const getOasisState = vi.fn().mockResolvedValue(makeOasisState());
      useOasisStore.setState({
        oasisState: makeOasisState(),
        isLoggingWater: true,
        repository: makeRepository({ logWaterCup: logWaterCupFn, getOasisState }),
      });

      await useOasisStore.getState().logWaterCup();

      expect(logWaterCupFn).not.toHaveBeenCalled();
    });
  });

  describe("undoWaterCup", () => {
    it("되돌리기 창이 열려 있을 때 취소하면 DB를 되돌리고 상태를 다시 조회한다", async () => {
      const undoWaterCupFn = vi.fn().mockResolvedValue(undefined);
      const getOasisState = vi.fn().mockResolvedValue(makeOasisState());
      useOasisStore.setState({
        oasisState: makeOasisState(),
        undoWindow: {
          logEntry: {
            logId: "log-1",
            memberId: "member-1",
            roomId: room.id,
            recordedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 5000).toISOString(),
          },
          timerId: setTimeout(() => {}, 10000),
        },
        repository: makeRepository({ undoWaterCup: undoWaterCupFn, getOasisState }),
      });

      await useOasisStore.getState().undoWaterCup();

      expect(undoWaterCupFn).toHaveBeenCalledWith(room.id, "member-1", "log-1");
      expect(useOasisStore.getState().undoWindow).toBeNull();
      expect(getOasisState).toHaveBeenCalled();
    });

    it("되돌리기 창이 없으면 아무것도 하지 않는다", async () => {
      const undoWaterCupFn = vi.fn();
      useOasisStore.setState({
        oasisState: makeOasisState(),
        undoWindow: null,
        repository: makeRepository({ undoWaterCup: undoWaterCupFn }),
      });

      await useOasisStore.getState().undoWaterCup();

      expect(undoWaterCupFn).not.toHaveBeenCalled();
    });

    it("창 만료로 실패하면 에러 없이 조용히 닫힌다", async () => {
      const undoWaterCupFn = vi
        .fn()
        .mockRejectedValue(new Error("되돌리기 가능한 시간이 지났어요."));
      useOasisStore.setState({
        oasisState: makeOasisState(),
        undoWindow: {
          logEntry: {
            logId: "log-1",
            memberId: "member-1",
            roomId: room.id,
            recordedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(),
          },
          timerId: setTimeout(() => {}, 0),
        },
        repository: makeRepository({ undoWaterCup: undoWaterCupFn }),
      });

      await useOasisStore.getState().undoWaterCup();

      expect(useOasisStore.getState().oasisError).toBeNull();
      expect(useOasisStore.getState().undoWindow).toBeNull();
    });
  });

  describe("leaveRoom", () => {
    it("나가기에 성공하면 현재 방 세션을 비운다", async () => {
      const leaveRoom = vi.fn().mockResolvedValue(undefined);
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository({ leaveRoom }),
      });

      await useOasisStore.getState().leaveRoom();

      expect(leaveRoom).toHaveBeenCalledWith(room.id, "member-1");
      expect(useOasisStore.getState().currentRoom).toBeNull();
      expect(useOasisStore.getState().memberId).toBeNull();
      expect(useOasisStore.getState().oasisState).toBeNull();
    });

    it("나가기에 실패하면 세션을 유지하고 에러를 남긴다", async () => {
      const leaveRoom = vi
        .fn()
        .mockRejectedValue(new Error("방에 참여 중이 아니에요."));
      useOasisStore.setState({
        oasisState: makeOasisState(),
        repository: makeRepository({ leaveRoom }),
      });

      await expect(useOasisStore.getState().leaveRoom()).rejects.toThrow(
        "방에 참여 중이 아니에요.",
      );

      expect(useOasisStore.getState().currentRoom).toEqual(room);
      expect(useOasisStore.getState().memberId).toBe("member-1");
      expect(useOasisStore.getState().oasisError).toBe("방에 참여 중이 아니에요.");
    });
  });
});
