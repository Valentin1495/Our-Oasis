import {
  computeContributionDropsFromMl,
  computePersonalProgressPercent,
  getContributionDrops,
} from "../features/water/computeContributionDrops";
import type { OasisRepository } from "../lib/repository/OasisRepository";
import type {
  CreateRoomInput,
  DayRecord,
  Member,
  MyRoomSummary,
  OasisState,
  Profile,
  Room,
  RoomJoinResult,
  WaterLogResult,
} from "../types";
import {
  getCompletionState,
  getOasisStage,
} from "../features/oasis/oasisRules";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function now(): string {
  return new Date().toISOString();
}

function localDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function delay(ms = 400): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface MemberState {
  member: Member;
  cupsLogged: number;
  profile: Profile;
  tossAnonymousKey?: string | null;
  eligibleFromDayIndex: number;
}

interface RoomState {
  room: Room;
  members: Map<string, MemberState>;
  totalDrops: number;
  history: DayRecord[];
  confirmedMembersToday: Set<string>;
}

export class MockOasisRepository implements OasisRepository {
  private rooms = new Map<string, RoomState>();
  private pendingWaterLogs = new Map<
    string,
    { roomId: string; memberId: string; recordedAt: string }
  >();

  async createRoom(input: CreateRoomInput): Promise<RoomJoinResult> {
    await delay();
    const roomId = uid();
    const room: Room = {
      id: roomId,
      name: input.name,
      durationDays: 7,
      maxMembers: 5,
      createdAt: now(),
      dayIndex: 1,
    };
    const memberId = uid();
    const member: Member = {
      id: memberId,
      nickname: input.profile.nickname,
      todayProgressPercent: 0,
      contributedDropsToday: 0,
      hasWaterRecordToday: false,
    };
    const memberState: MemberState = {
      member,
      cupsLogged: 0,
      profile: { ...input.profile, id: memberId },
      tossAnonymousKey: input.tossAnonymousKey ?? null,
      eligibleFromDayIndex: 1,
    };

    // 빈 히스토리 7일치 생성
    const history: DayRecord[] = Array.from({ length: 7 }, (_, i) => ({
      roomId,
      dayIndex: i + 1,
      localDate: localDate(new Date(Date.now() + i * 86400000)),
      totalDrops: 0,
      memberCountSnapshot: i === 0 ? 1 : 0,
      maxDropsSnapshot: i === 0 ? 4 : 0,
      completionPercent: 0,
      participatingMemberCount: 0,
      isComplete: false,
      isFullComplete: false,
      allParticipated: false,
    }));

    this.rooms.set(roomId, {
      room,
      members: new Map([[memberId, memberState]]),
      totalDrops: 0,
      history,
      confirmedMembersToday: new Set(),
    });

    return { room, memberId, rejoined: false };
  }

  async joinRoom(
    roomId: string,
    profile: Profile,
    tossAnonymousKey?: string | null,
  ): Promise<RoomJoinResult> {
    await delay();
    const state = this.rooms.get(roomId);
    if (!state) throw new Error("방을 찾을 수 없어요.");

    if (tossAnonymousKey) {
      const existing = Array.from(state.members.values()).find(
        (ms) => ms.tossAnonymousKey === tossAnonymousKey,
      );
      if (existing) {
        return {
          room: state.room,
          memberId: existing.member.id,
          rejoined: true,
        };
      }
    }

    if (state.members.size >= state.room.maxMembers)
      throw new Error("방이 가득 찼어요.");

    const memberId = uid();
    const member: Member = {
      id: memberId,
      nickname: profile.nickname,
      todayProgressPercent: 0,
      contributedDropsToday: 0,
      hasWaterRecordToday: false,
    };
    state.members.set(memberId, {
      member,
      cupsLogged: 0,
      profile: { ...profile, id: memberId },
      tossAnonymousKey: tossAnonymousKey ?? null,
      eligibleFromDayIndex: state.room.dayIndex,
    });
    const today = state.history.find(
      (day) => day.dayIndex === state.room.dayIndex,
    );
    if (today) {
      today.memberCountSnapshot = Array.from(
        state.members.values(),
      ).filter(
        (member) =>
          member.eligibleFromDayIndex <= state.room.dayIndex,
      ).length;
      today.maxDropsSnapshot = today.memberCountSnapshot * 4;
      const completion = getCompletionState(
        today.totalDrops,
        today.maxDropsSnapshot,
      );
      today.completionPercent = completion.completionPercent;
      today.isComplete = completion.isComplete;
      today.isFullComplete = completion.isFullComplete;
      today.allParticipated =
        today.memberCountSnapshot > 0 &&
        today.participatingMemberCount ===
          today.memberCountSnapshot;
    }

    return { room: state.room, memberId, rejoined: false };
  }

  async getMyRooms(tossAnonymousKey: string): Promise<MyRoomSummary[]> {
    await delay(200);
    const result: MyRoomSummary[] = [];
    for (const state of this.rooms.values()) {
      for (const ms of state.members.values()) {
        if (ms.tossAnonymousKey === tossAnonymousKey) {
          result.push({
            room: state.room,
            memberId: ms.member.id,
            nickname: ms.member.nickname,
            cupMl: ms.profile.cupMl,
            dailyGoalMl: ms.profile.dailyGoalMl,
          });
        }
      }
    }
    return result;
  }

  async getOasisState(
    roomId: string,
    memberId?: string | null,
  ): Promise<OasisState> {
    await delay();
    const state = this.rooms.get(roomId);
    if (!state) throw new Error("방을 찾을 수 없어요.");

    const members = Array.from(state.members.values()).map((s) => s.member);
    const today = this.getTodayRecord(state);
    const sharedProgressPercent = today?.completionPercent ?? 0;
    const me = memberId ? state.members.get(memberId) : undefined;

    return {
      room: state.room,
      members,
      sharedProgressPercent,
      totalDrops: today?.totalDrops ?? 0,
      stage: getOasisStage(sharedProgressPercent),
      history: [...state.history],
      myHydration: me
        ? {
            consumedMl: me.cupsLogged * me.profile.cupMl,
            goalMl: me.profile.dailyGoalMl,
            contributionDrops: me.member.contributedDropsToday,
          }
        : null,
    };
  }

  async logWaterCup(roomId: string, memberId: string): Promise<WaterLogResult> {
    await delay(300);
    const state = this.rooms.get(roomId);
    if (!state) throw new Error("방을 찾을 수 없어요.");

    const ms = state.members.get(memberId);
    if (!ms) throw new Error("멤버를 찾을 수 없어요.");

    const projectedCups = ms.cupsLogged + 1;
    const newConsumedMl = projectedCups * ms.profile.cupMl;
    const newPercent = computePersonalProgressPercent(
      projectedCups,
      ms.profile.cupMl,
      ms.profile.dailyGoalMl,
    );
    const isEligible = ms.eligibleFromDayIndex <= state.room.dayIndex;
    const drops = isEligible
      ? computeContributionDropsFromMl(
          newConsumedMl,
          ms.profile.dailyGoalMl,
          ms.member.contributedDropsToday,
        )
      : 0;

    const today = this.ensureTodaySnapshot(state);
    const maxDrops = today.maxDropsSnapshot;
    const projectedTotalDrops = state.totalDrops + drops;
    const sharedProgress =
      maxDrops === 0
        ? 0
        : Math.min(100, Math.round((projectedTotalDrops / maxDrops) * 100));

    const logId = uid();
    const recordedAt = now();
    const expiresAt = new Date(Date.now() + 5000).toISOString();
    this.pendingWaterLogs.set(logId, { roomId, memberId, recordedAt });

    return {
      logEntry: { logId, memberId, roomId, recordedAt, expiresAt },
      newPersonalProgressPercent: newPercent,
      dropsContributed: drops,
      newSharedProgressPercent: sharedProgress,
      newConsumedMl,
      contributionDropsTotal: ms.member.contributedDropsToday + drops,
      canUndo: true,
    };
  }

  async confirmWaterCup(
    roomId: string,
    memberId: string,
    logId: string,
  ): Promise<WaterLogResult> {
    await delay(200);
    const pending = this.pendingWaterLogs.get(logId);
    if (
      !pending ||
      pending.roomId !== roomId ||
      pending.memberId !== memberId
    ) {
      throw new Error("확정할 물 기록을 찾을 수 없어요.");
    }

    const state = this.rooms.get(roomId);
    const ms = state?.members.get(memberId);
    if (!state || !ms) throw new Error("멤버를 찾을 수 없어요.");

    ms.cupsLogged += 1;
    const newConsumedMl = ms.cupsLogged * ms.profile.cupMl;
    const newPercent = computePersonalProgressPercent(
      ms.cupsLogged,
      ms.profile.cupMl,
      ms.profile.dailyGoalMl,
    );
    const isEligible = ms.eligibleFromDayIndex <= state.room.dayIndex;
    const drops = isEligible
      ? computeContributionDropsFromMl(
          newConsumedMl,
          ms.profile.dailyGoalMl,
          ms.member.contributedDropsToday,
        )
      : 0;

    ms.member = {
      ...ms.member,
      todayProgressPercent: newPercent,
      contributedDropsToday: ms.member.contributedDropsToday + drops,
      hasWaterRecordToday: true,
    };
    state.totalDrops += drops;

    const todayRecord = this.ensureTodaySnapshot(state);
    if (isEligible) state.confirmedMembersToday.add(memberId);
    const completion = getCompletionState(
      state.totalDrops,
      todayRecord.maxDropsSnapshot,
    );
    todayRecord.totalDrops = state.totalDrops;
    todayRecord.completionPercent = completion.completionPercent;
    todayRecord.participatingMemberCount = state.confirmedMembersToday.size;
    todayRecord.isComplete = completion.isComplete;
    todayRecord.isFullComplete = completion.isFullComplete;
    todayRecord.allParticipated =
      todayRecord.memberCountSnapshot > 0 &&
      todayRecord.participatingMemberCount ===
        todayRecord.memberCountSnapshot;

    this.pendingWaterLogs.delete(logId);
    return {
      logEntry: {
        logId,
        memberId,
        roomId,
        recordedAt: pending.recordedAt,
        expiresAt: now(),
      },
      newPersonalProgressPercent: newPercent,
      dropsContributed: drops,
      newSharedProgressPercent: todayRecord.completionPercent,
      newConsumedMl,
      contributionDropsTotal: ms.member.contributedDropsToday,
      canUndo: false,
    };
  }

  async undoWaterCup(
    roomId: string,
    memberId: string,
    logId: string,
  ): Promise<void> {
    await delay(200);
    const pending = this.pendingWaterLogs.get(logId);
    if (pending?.roomId === roomId && pending.memberId === memberId) {
      this.pendingWaterLogs.delete(logId);
    }
  }

  async wakeUpFriends(roomId: string): Promise<void> {
    void roomId;
    await delay(300);
    // 실제 알림 발송은 백엔드 구현 후 처리
  }

  async getWeeklyHistory(roomId: string): Promise<DayRecord[]> {
    await delay();
    const state = this.rooms.get(roomId);
    if (!state) throw new Error("방을 찾을 수 없어요.");
    return [...state.history];
  }

  private getTodayRecord(state: RoomState): DayRecord | undefined {
    return state.history.find(
      (day) => day.dayIndex === state.room.dayIndex,
    );
  }

  private ensureTodaySnapshot(state: RoomState): DayRecord {
    const today = this.getTodayRecord(state);
    if (!today) throw new Error("오늘의 기록을 찾을 수 없어요.");
    if (today.memberCountSnapshot === 0) {
      today.memberCountSnapshot = Array.from(state.members.values()).filter(
        (member) => member.eligibleFromDayIndex <= state.room.dayIndex,
      ).length;
      today.maxDropsSnapshot = today.memberCountSnapshot * 4;
    }
    return today;
  }

  /** 테스트·데모용: 미리 채워진 방과 첫 번째 멤버 ID를 반환 */
  seedDemoRoom(): { roomId: string; memberId: string } {
    const demoRoomId = "demo-room";
    const profiles: Profile[] = [
      { id: "m1", nickname: "하늘", cupMl: 250, dailyGoalMl: 2000 },
      { id: "m2", nickname: "바람", cupMl: 350, dailyGoalMl: 1500 },
      { id: "m3", nickname: "별", cupMl: 200, dailyGoalMl: 1000 },
    ];

    const room: Room = {
      id: demoRoomId,
      name: "우리 팀 오아시스",
      durationDays: 7,
      maxMembers: 5,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      dayIndex: 3,
    };

    const members = new Map<string, MemberState>();
    for (const p of profiles) {
      const cups = Math.floor(Math.random() * 5);
      const progress = computePersonalProgressPercent(
        cups,
        p.cupMl,
        p.dailyGoalMl,
      );
      members.set(p.id, {
        member: {
          id: p.id,
          nickname: p.nickname,
          todayProgressPercent: progress,
          contributedDropsToday: getContributionDrops(
            cups * p.cupMl,
            p.dailyGoalMl,
          ),
          hasWaterRecordToday: cups > 0,
        },
        cupsLogged: cups,
        profile: p,
        eligibleFromDayIndex: 1,
      });
    }

    const totalDrops = Array.from(members.values()).reduce(
      (sum, ms) => sum + ms.member.contributedDropsToday,
      0,
    );

    const history: DayRecord[] = Array.from({ length: 7 }, (_, i) => {
      const dayTotalDrops = i < 3 ? Math.floor(Math.random() * 8) : 0;
      const completion = getCompletionState(dayTotalDrops, profiles.length * 4);
      return {
        roomId: demoRoomId,
        dayIndex: i + 1,
        localDate: localDate(new Date(Date.now() + (i - 2) * 86400000)),
        totalDrops: dayTotalDrops,
        memberCountSnapshot: profiles.length,
        maxDropsSnapshot: profiles.length * 4,
        completionPercent: completion.completionPercent,
        participatingMemberCount: 0,
        isComplete: completion.isComplete,
        isFullComplete: completion.isFullComplete,
        allParticipated: false,
      };
    });
    const today = history[room.dayIndex - 1];
    const confirmedMembersToday = new Set(
      Array.from(members.values())
        .filter((member) => member.member.hasWaterRecordToday)
        .map((member) => member.member.id),
    );
    if (today) {
      const completion = getCompletionState(
        totalDrops,
        today.maxDropsSnapshot,
      );
      today.totalDrops = totalDrops;
      today.completionPercent = completion.completionPercent;
      today.participatingMemberCount = confirmedMembersToday.size;
      today.isComplete = completion.isComplete;
      today.isFullComplete = completion.isFullComplete;
      today.allParticipated =
        confirmedMembersToday.size === today.memberCountSnapshot;
    }

    this.rooms.set(demoRoomId, {
      room,
      members,
      totalDrops,
      history,
      confirmedMembersToday,
    });
    // 첫 번째 프로필(m1)을 현재 사용자로 간주
    return { roomId: demoRoomId, memberId: "m1" };
  }
}

export const mockRepository = new MockOasisRepository();
