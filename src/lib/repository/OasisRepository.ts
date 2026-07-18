import type {
  CreateRoomInput,
  DayRecord,
  MyRoomSummary,
  OasisState,
  Profile,
  RoomJoinResult,
  WaterLogResult,
} from "../../types";

export interface OasisRepository {
  createRoom(input: CreateRoomInput): Promise<RoomJoinResult>;
  joinRoom(
    roomId: string,
    profile: Profile,
    tossAnonymousKey?: string | null,
  ): Promise<RoomJoinResult>;
  /** 사용자 식별키로 현재 참여 중인 모든 방을 조회한다(여러 방 참여 지원). */
  getMyRooms(tossAnonymousKey: string): Promise<MyRoomSummary[]>;
  getOasisState(roomId: string, memberId?: string | null): Promise<OasisState>;
  logWaterCup(roomId: string, memberId: string): Promise<WaterLogResult>;
  confirmWaterCup(
    roomId: string,
    memberId: string,
    logId: string,
  ): Promise<WaterLogResult>;
  undoWaterCup(roomId: string, memberId: string, logId: string): Promise<void>;
  wakeUpFriends(roomId: string): Promise<void>;
  getWeeklyHistory(roomId: string): Promise<DayRecord[]>;
}
