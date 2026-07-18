import type { OasisRepository } from "../repository/OasisRepository";
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
} from "../../types";
import { supabase } from "./client";
import type { DayRecordRow, RoomMemberRow, RoomRow } from "./types";
import {
  getCompletionState,
  getOasisStage,
} from "../../features/oasis/oasisRules";

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    name: row.name,
    durationDays: 7,
    maxMembers: 5,
    createdAt: row.created_at,
    dayIndex: row.day_index,
  };
}

function toMember(row: RoomMemberRow): Member {
  return {
    id: row.id,
    nickname: row.nickname,
    todayProgressPercent: row.today_progress_percent,
    contributedDropsToday: row.contributed_drops_today,
    hasWaterRecordToday: row.cups_logged_today > 0,
  };
}

function toDayRecord(row: DayRecordRow): DayRecord {
  return {
    roomId: row.room_id,
    dayIndex: row.day_index,
    localDate: row.date,
    totalDrops: row.total_drops,
    memberCountSnapshot: row.member_count_snapshot,
    maxDropsSnapshot: row.max_drops_snapshot,
    completionPercent: row.shared_progress_percent,
    participatingMemberCount: row.participating_member_count,
    isComplete: row.is_complete,
    isFullComplete: row.is_full_complete,
    allParticipated: row.all_participated,
  };
}

function toWaterLogResult(
  row: Record<string, unknown>,
  roomId: string,
  memberId: string,
  canUndo: boolean,
): WaterLogResult {
  return {
    logEntry: {
      logId: row.log_id as string,
      memberId,
      roomId,
      recordedAt: row.recorded_at as string,
      expiresAt: new Date(Date.now() + (canUndo ? 5000 : 0)).toISOString(),
    },
    newPersonalProgressPercent: row.new_personal_progress_percent as number,
    dropsContributed: row.drops_contributed as number,
    newSharedProgressPercent: row.new_shared_progress_percent as number,
    newConsumedMl: row.new_consumed_ml as number,
    contributionDropsTotal: row.contribution_drops_total as number,
    canUndo,
  };
}

/**
 * Supabase(Postgres)를 실제 백엔드로 사용하는 구현체.
 * 물 기록 대기/확정/취소는 동시성 문제를 피하기 위해 DB의 RPC 함수
 * (log_water_cup, confirm_water_cup, undo_water_cup)에서 원자적으로 처리한다.
 */
export class SupabaseOasisRepository implements OasisRepository {
  /**
   * 초대 멤버를 현재 일자의 공동 목표에 즉시 포함하고,
   * 저장된 일별 스냅샷을 현재 참여 멤버 기준으로 맞춘다.
   */
  private async activateMemberForCurrentDay(
    roomId: string,
    memberId: string,
  ): Promise<void> {
    const { data: roomRow, error: roomError } = await supabase
      .from("rooms")
      .select("day_index")
      .eq("id", roomId)
      .single();
    if (roomError || !roomRow) {
      throw new Error(roomError?.message ?? "방을 찾을 수 없어요.");
    }

    const dayIndex = roomRow.day_index as number;
    const { error: memberError } = await supabase
      .from("room_members")
      .update({ eligible_from_day_index: dayIndex })
      .eq("id", memberId)
      .eq("room_id", roomId)
      .gt("eligible_from_day_index", dayIndex);
    if (memberError) throw new Error(memberError.message);

    await this.refreshCurrentDaySnapshot(roomId, dayIndex);
  }

  private async refreshCurrentDaySnapshot(
    roomId: string,
    dayIndex: number,
  ): Promise<void> {
    const [
      { data: memberRows, error: memberError },
      { data: dayRow, error: dayError },
    ] = await Promise.all([
      supabase
        .from("room_members")
        .select(
          "id, eligible_from_day_index, contributed_drops_today",
        )
        .eq("room_id", roomId),
      supabase
        .from("day_records")
        .select("id, date")
        .eq("room_id", roomId)
        .eq("day_index", dayIndex)
        .single(),
    ]);
    if (memberError) throw new Error(memberError.message);
    if (dayError || !dayRow) {
      throw new Error(dayError?.message ?? "오늘의 기록을 찾을 수 없어요.");
    }

    const eligibleMembers = (memberRows ?? []).filter(
      (member) =>
        (member.eligible_from_day_index as number) <= dayIndex,
    );
    const eligibleIds = new Set(
      eligibleMembers.map((member) => member.id as string),
    );
    const totalDrops = eligibleMembers.reduce(
      (sum, member) =>
        sum + (member.contributed_drops_today as number),
      0,
    );
    const maxDrops = eligibleMembers.length * 4;
    const completion = getCompletionState(totalDrops, maxDrops);

    const { data: logRows, error: logError } = await supabase
      .from("water_logs")
      .select("member_id")
      .eq("room_id", roomId)
      .eq("local_date", dayRow.date)
      .not("confirmed_at", "is", null);
    if (logError) throw new Error(logError.message);

    const participatingMemberIds = new Set(
      (logRows ?? [])
        .map((log) => log.member_id as string)
        .filter((id) => eligibleIds.has(id)),
    );
    const participatingMemberCount = participatingMemberIds.size;

    const { error: updateError } = await supabase
      .from("day_records")
      .update({
        total_drops: totalDrops,
        member_count_snapshot: eligibleMembers.length,
        max_drops_snapshot: maxDrops,
        shared_progress_percent: Math.round(
          completion.completionPercent,
        ),
        participating_member_count: participatingMemberCount,
        is_complete: completion.isComplete,
        is_full_complete: completion.isFullComplete,
        all_participated:
          eligibleMembers.length > 0 &&
          participatingMemberCount === eligibleMembers.length,
      })
      .eq("id", dayRow.id);
    if (updateError) throw new Error(updateError.message);
  }

  async createRoom(input: CreateRoomInput): Promise<RoomJoinResult> {
    const { data: roomRow, error: roomError } = await supabase
      .from("rooms")
      .insert({ name: input.name })
      .select()
      .single();
    if (roomError || !roomRow) {
      throw new Error(roomError?.message ?? "방을 만들 수 없어요.");
    }

    const { data: memberRow, error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: roomRow.id,
        nickname: input.profile.nickname,
        cup_ml: input.profile.cupMl,
        daily_goal_ml: input.profile.dailyGoalMl,
        toss_anonymous_key: input.tossAnonymousKey ?? null,
        eligible_from_day_index: 1,
      })
      .select()
      .single();
    if (memberError || !memberRow) {
      throw new Error(memberError?.message ?? "멤버를 등록할 수 없어요.");
    }

    const dayRecords = Array.from({ length: 7 }, (_, i) => ({
      room_id: roomRow.id as string,
      day_index: i + 1,
      date: toLocalDate(new Date(Date.now() + i * 86400000)),
      member_count_snapshot: i === 0 ? 1 : 0,
      max_drops_snapshot: i === 0 ? 4 : 0,
    }));
    const { error: historyError } = await supabase
      .from("day_records")
      .insert(dayRecords);
    if (historyError) {
      throw new Error(historyError.message);
    }

    return {
      room: toRoom(roomRow as RoomRow),
      memberId: memberRow.id as string,
      rejoined: false,
    };
  }

  async joinRoom(
    roomId: string,
    profile: Profile,
    tossAnonymousKey?: string | null,
  ): Promise<RoomJoinResult> {
    const { data: roomRow, error: roomError } = await supabase
      .from("rooms")
      .select()
      .eq("id", roomId)
      .maybeSingle();
    if (roomError) throw new Error(roomError.message);
    if (!roomRow) throw new Error("방을 찾을 수 없어요.");

    // 같은 사용자 식별키로 이미 참여한 적이 있다면 새 멤버를 만들지 않고 복귀시킨다.
    if (tossAnonymousKey) {
      const { data: existingRow, error: existingError } = await supabase
        .from("room_members")
        .select()
        .eq("room_id", roomId)
        .eq("toss_anonymous_key", tossAnonymousKey)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (existingRow) {
        await this.activateMemberForCurrentDay(
          roomId,
          existingRow.id as string,
        );
        return {
          room: toRoom(roomRow as RoomRow),
          memberId: existingRow.id as string,
          rejoined: true,
        };
      }
    }

    const { count, error: countError } = await supabase
      .from("room_members")
      .select("id", { count: "exact", head: true })
      .eq("room_id", roomId);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= (roomRow as RoomRow).max_members) {
      throw new Error("방이 가득 찼어요.");
    }

    const { data: memberRow, error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: roomId,
        nickname: profile.nickname,
        cup_ml: profile.cupMl,
        daily_goal_ml: profile.dailyGoalMl,
        toss_anonymous_key: tossAnonymousKey ?? null,
        // 초대받은 멤버도 참여한 당일부터 공동 물방울을 기여한다.
        eligible_from_day_index: (roomRow as RoomRow).day_index,
      })
      .select()
      .single();
    if (memberError || !memberRow) {
      throw new Error(memberError?.message ?? "멤버를 등록할 수 없어요.");
    }
    await this.refreshCurrentDaySnapshot(
      roomId,
      (roomRow as RoomRow).day_index,
    );

    return {
      room: toRoom(roomRow as RoomRow),
      memberId: memberRow.id as string,
      rejoined: false,
    };
  }

  /** 사용자 식별키가 참여 중인 모든 방을 최근 활동순으로 조회한다. */
  async getMyRooms(tossAnonymousKey: string): Promise<MyRoomSummary[]> {
    const { data: memberRows, error: memberError } = await supabase
      .from("room_members")
      .select()
      .eq("toss_anonymous_key", tossAnonymousKey)
      .order("created_at", { ascending: false });
    if (memberError) throw new Error(memberError.message);
    if (!memberRows || memberRows.length === 0) return [];

    const roomIds = memberRows.map((r) => (r as RoomMemberRow).room_id);
    const { data: roomRows, error: roomError } = await supabase
      .from("rooms")
      .select()
      .in("id", roomIds);
    if (roomError) throw new Error(roomError.message);

    const roomsById = new Map(
      (roomRows ?? []).map((r) => [r.id as string, toRoom(r as RoomRow)]),
    );

    return memberRows
      .map((r) => {
        const row = r as RoomMemberRow;
        const room = roomsById.get(row.room_id);
        if (!room) return null;
        return {
          room,
          memberId: row.id,
          nickname: row.nickname,
          cupMl: row.cup_ml,
          dailyGoalMl: row.daily_goal_ml,
        };
      })
      .filter((v): v is MyRoomSummary => v !== null);
  }

  async getOasisState(
    roomId: string,
    memberId?: string | null,
  ): Promise<OasisState> {
    const [
      { data: roomRow, error: roomError },
      { data: memberRows, error: memberError },
      { data: historyRows, error: historyError },
    ] = await Promise.all([
      supabase.from("rooms").select().eq("id", roomId).maybeSingle(),
      supabase
        .from("room_members")
        .select()
        .eq("room_id", roomId)
        .order("created_at"),
      supabase
        .from("day_records")
        .select()
        .eq("room_id", roomId)
        .order("day_index"),
    ]);

    if (roomError) throw new Error(roomError.message);
    if (!roomRow) throw new Error("방을 찾을 수 없어요.");
    if (memberError) throw new Error(memberError.message);
    if (historyError) throw new Error(historyError.message);

    const members = (memberRows ?? []).map((r) => toMember(r as RoomMemberRow));
    const history = (historyRows ?? []).map((r) =>
      toDayRecord(r as DayRecordRow),
    );
    const today = history.find(
      (record) => record.dayIndex === (roomRow as RoomRow).day_index,
    );
    const totalDrops = today?.totalDrops ?? 0;
    const sharedProgressPercent = today?.completionPercent ?? 0;
    const myRow = memberId
      ? (memberRows ?? []).find((row) => row.id === memberId)
      : undefined;
    const myMember = myRow as RoomMemberRow | undefined;

    return {
      room: toRoom(roomRow as RoomRow),
      members,
      sharedProgressPercent,
      totalDrops,
      stage: getOasisStage(sharedProgressPercent),
      history,
      myHydration: myMember
        ? {
            consumedMl: myMember.cups_logged_today * myMember.cup_ml,
            goalMl: myMember.daily_goal_ml,
            contributionDrops: myMember.contributed_drops_today,
          }
        : null,
    };
  }

  async logWaterCup(roomId: string, memberId: string): Promise<WaterLogResult> {
    // 이전 버전에서 다음 날부터 참여하도록 저장된 초대 멤버도 즉시 복구한다.
    await this.activateMemberForCurrentDay(roomId, memberId);

    const { data, error } = await supabase.rpc("log_water_cup", {
      p_room_id: roomId,
      p_member_id: memberId,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("물 기록에 실패했어요.");

    return toWaterLogResult(row as Record<string, unknown>, roomId, memberId, true);
  }

  async undoWaterCup(
    roomId: string,
    memberId: string,
    logId: string,
  ): Promise<void> {
    const { error } = await supabase.rpc("undo_water_cup", {
      p_room_id: roomId,
      p_member_id: memberId,
      p_log_id: logId,
    });
    if (error) throw new Error(error.message);
  }

  async confirmWaterCup(
    roomId: string,
    memberId: string,
    logId: string,
  ): Promise<WaterLogResult> {
    const { data, error } = await supabase.rpc("confirm_water_cup", {
      p_room_id: roomId,
      p_member_id: memberId,
      p_log_id: logId,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("물 기록 확정 결과를 찾을 수 없어요.");
    return toWaterLogResult(
      row as Record<string, unknown>,
      roomId,
      memberId,
      false,
    );
  }

  async wakeUpFriends(roomId: string): Promise<void> {
    void roomId;
    // 실제 알림 발송(푸시 등)은 별도 백엔드 연동 후 구현한다.
  }

  async getWeeklyHistory(roomId: string): Promise<DayRecord[]> {
    const { data, error } = await supabase
      .from("day_records")
      .select()
      .eq("room_id", roomId)
      .order("day_index");
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toDayRecord(r as DayRecordRow));
  }
}

export const supabaseRepository = new SupabaseOasisRepository();
