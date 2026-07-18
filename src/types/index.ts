export interface Profile {
  id: string;
  nickname: string;
  cupMl: number;
  dailyGoalMl: number;
}

export interface Room {
  id: string;
  name: string;
  durationDays: 7;
  maxMembers: 5;
  createdAt: string;
  dayIndex: number;
}

// ml 수치와 순위를 다른 멤버에게 공개하지 않기 위해
// Member 타입에는 ml 필드를 포함하지 않는다.
export interface Member {
  id: string;
  nickname: string;
  todayProgressPercent: number;
  contributedDropsToday: number;
  hasWaterRecordToday: boolean;
}

// 공동 달성률 기준 5단계
export type OasisStage = 1 | 2 | 3 | 4 | 5;

export interface DayRecord {
  roomId: string;
  dayIndex: number;
  localDate: string;
  totalDrops: number;
  memberCountSnapshot: number;
  maxDropsSnapshot: number;
  completionPercent: number;
  participatingMemberCount: number;
  isComplete: boolean;
  isFullComplete: boolean;
  allParticipated: boolean;
}

export interface DailyHydration {
  consumedMl: number;
  goalMl: number;
  contributionDrops: number;
}

export interface OasisState {
  room: Room;
  members: Member[];
  sharedProgressPercent: number;
  totalDrops: number;
  stage: OasisStage;
  history: DayRecord[];
  /** 현재 사용자에게만 보여 주는 개인 섭취 기록. */
  myHydration: DailyHydration | null;
}

export interface WaterLogEntry {
  logId: string;
  memberId: string;
  roomId: string;
  recordedAt: string;
  expiresAt: string;
}

export interface WaterLogResult {
  logEntry: WaterLogEntry;
  newPersonalProgressPercent: number;
  dropsContributed: number;
  newSharedProgressPercent: number;
  newConsumedMl: number;
  contributionDropsTotal: number;
  canUndo: boolean;
}

export interface CreateRoomInput {
  name: string;
  profile: Profile;
  /** 앱인토스 getAnonymousKey()로 발급받은 내부 사용자 식별자 (있으면). */
  tossAnonymousKey?: string | null;
}

export interface RoomJoinResult {
  room: Room;
  memberId: string;
  /** true면 이미 참여했던 사용자가 같은 멤버로 복귀한 것이다(신규 참여 아님). */
  rejoined: boolean;
}

/** 인트로 화면에서 "참여 중인 방" 목록을 보여줄 때 쓰는 요약 정보. */
export interface MyRoomSummary {
  room: Room;
  memberId: string;
  nickname: string;
  cupMl: number;
  dailyGoalMl: number;
}
