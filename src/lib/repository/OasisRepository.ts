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
  /** 기록 직후 5초 창 내에서만 되돌릴 수 있다. 창이 지났거나 이후 기록이 추가됐으면 서버가 에러를 반환한다. */
  undoWaterCup(roomId: string, memberId: string, logId: string): Promise<void>;
  leaveRoom(roomId: string, memberId: string): Promise<void>;
  getWeeklyHistory(roomId: string): Promise<DayRecord[]>;
}
