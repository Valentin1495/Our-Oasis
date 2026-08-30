import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { supabaseRepository } from "../supabase/SupabaseOasisRepository";
import type { OasisRepository } from "../repository/OasisRepository";
import type {
  MyRoomSummary,
  OasisState,
  Profile,
  Room,
  WaterLogEntry,
} from "../../types";
import { getAnonymousUserKey } from "../toss/getAnonymousUserKey";
import { trackOasisEventOnce } from "../analytics/oasisAnalytics";
import { getOasisAchievements } from "../../features/oasis/oasisRules";

/** 기록 직후 5초 내에 되돌릴 수 있는 창. 버튼은 막지 않는다. */
interface UndoWindow {
  logEntry: WaterLogEntry;
  timerId: ReturnType<typeof setTimeout>;
}

export interface WaterLogFeedback {
  kind: "contribution" | "personal";
  dropsContributed: number;
  contributionDropsTotal: number;
  consumedMl: number;
  goalMl: number;
  warning: string | null;
}

interface OasisStore {
  // 의존성
  repository: OasisRepository;

  // 사용자 프로필 (현재 세션)
  profile: Profile | null;
  memberId: string | null;

  // 방
  currentRoom: Room | null;
  /**
   * 이 기기에서 참여했던 방 목록(최근 참여순). 앱인토스 익명 식별키 조회가
   * 실패하거나(브라우저 미리보기, 구버전 SDK 등) 느려도 "참여 중인 오아시스"
   * 목록을 항상 보여줄 수 있도록 서버 조회와 별개로 로컬에 보존한다.
   */
  joinedRooms: MyRoomSummary[];

  // 오아시스 상태
  oasisState: OasisState | null;
  isLoadingOasis: boolean;
  oasisError: string | null;

  // 물 기록 상태
  isLoggingWater: boolean;
  /** 되돌리기 가능한 창이 열려 있을 때 설정된다. 버튼은 막지 않는다. */
  undoWindow: UndoWindow | null;
  waterLogFeedback: WaterLogFeedback | null;
  recentConfirmedWaterAt: number[];
  waterLogFeedbackId: number;

  // 실시간 구독 채널
  realtimeChannel: RealtimeChannel | null;

  // 액션
  setProfile: (profile: Profile, memberId: string) => void;
  setCurrentRoom: (room: Room) => void;
  rememberJoinedRoom: (summary: MyRoomSummary) => void;
  forgetJoinedRoom: (roomId: string) => void;
  loadOasisState: (roomId: string) => Promise<void>;
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
  logWaterCup: () => Promise<void>;
  undoWaterCup: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  reset: () => void;
}

// loadOasisState는 초기 진입, 내 물 기록 직후, 다른 멤버의 실시간 변경 알림 등
// 여러 곳에서 서로 조율 없이 동시에 호출될 수 있다. 네트워크 응답 순서는 호출
// 순서와 다를 수 있어서, 요청마다 순번을 매겨 "가장 나중에 시작한 요청"의
// 응답만 반영하고 먼저 시작했지만 늦게 도착한(오래된) 응답은 버린다.
let loadOasisStateRequestId = 0;

const initialState = {
  profile: null,
  memberId: null,
  currentRoom: null,
  joinedRooms: [] as MyRoomSummary[],
  oasisState: null,
  isLoadingOasis: false,
  oasisError: null,
  isLoggingWater: false,
  undoWindow: null,
  waterLogFeedback: null,
  recentConfirmedWaterAt: [],
  waterLogFeedbackId: 0,
  realtimeChannel: null,
};

export const useOasisStore = create<OasisStore>()(
  persist(
    (set, get) => ({
      repository: supabaseRepository,
      ...initialState,

      setProfile(profile, memberId) {
        set({ profile, memberId });
      },

      setCurrentRoom(room) {
        set((state) => {
          if (state.oasisState?.room.id === room.id) {
            return { currentRoom: room };
          }

          // 다른 방으로 이동할 때 직전 방의 장면이 새 방의 첫 화면으로
          // 잠깐 노출되지 않도록, 방 선택과 함께 방 전용 상태를 비운다.
          return {
            currentRoom: room,
            oasisState: null,
            oasisError: null,
            isLoadingOasis: false,
          };
        });
      },

      rememberJoinedRoom(summary) {
        set((state) => ({
          joinedRooms: [
            summary,
            ...state.joinedRooms.filter(
              (item) => item.room.id !== summary.room.id,
            ),
          ],
        }));
      },

      forgetJoinedRoom(roomId) {
        set((state) => ({
          joinedRooms: state.joinedRooms.filter(
            (item) => item.room.id !== roomId,
          ),
        }));
      },

      async loadOasisState(roomId) {
        const requestId = ++loadOasisStateRequestId;
        set({ isLoadingOasis: true, oasisError: null });
        try {
          const beforeLoad = get();
          const { repository } = beforeLoad;
          const sessionMemberId =
            beforeLoad.currentRoom?.id === roomId ? beforeLoad.memberId : null;
          const oasisState = await repository.getOasisState(
            roomId,
            sessionMemberId,
          );
          if (requestId !== loadOasisStateRequestId) return;

          const current = get();
          const hasValidSession =
            current.currentRoom?.id === roomId &&
            current.memberId !== null &&
            oasisState.members.some((member) => member.id === current.memberId);

          if (hasValidSession) {
            set({ oasisState, isLoadingOasis: false });
            return;
          }

          // 새로고침이나 직접 URL 진입으로 메모리 상태가 사라졌다면
          // 앱인토스 익명 식별키를 이용해 이 방의 멤버 세션을 복구한다.
          const tossAnonymousKey = await getAnonymousUserKey();
          const membership = tossAnonymousKey
            ? (await repository.getMyRooms(tossAnonymousKey)).find(
                (item) => item.room.id === roomId,
              )
            : undefined;

          if (requestId !== loadOasisStateRequestId) return;

          if (membership) {
            const restoredOasisState = await repository.getOasisState(
              roomId,
              membership.memberId,
            );
            if (requestId !== loadOasisStateRequestId) return;
            set({
              oasisState: restoredOasisState,
              currentRoom: membership.room,
              memberId: membership.memberId,
              profile: {
                id: membership.memberId,
                nickname: membership.nickname,
                cupMl: membership.cupMl,
                dailyGoalMl: membership.dailyGoalMl,
              },
              isLoadingOasis: false,
            });
            get().rememberJoinedRoom(membership);
            return;
          }

          // 익명 식별키로도 세션을 복구할 수 없었을 뿐, 로컬에 남아있는
          // joinedRooms 기록이 잘못됐다고 확정할 수는 없으므로(키 조회 실패
          // 등의 가능성) 여기서는 로컬 목록을 건드리지 않는다. 방이 실제로
          // 존재하지 않는 경우는 getOasisState가 던지는 예외에서 별도로
          // 처리한다.
          set({
            oasisState,
            currentRoom: null,
            memberId: null,
            profile: null,
            isLoadingOasis: false,
          });
        } catch (e) {
          if (requestId !== loadOasisStateRequestId) return;
          set({
            isLoadingOasis: false,
            oasisError:
              e instanceof Error ? e.message : "불러오기에 실패했어요.",
          });
        }
      },

      subscribeToRoom(roomId) {
        get().unsubscribeFromRoom();

        const channel = supabase
          .channel(`oasis-room-${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "room_members",
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              void get().loadOasisState(roomId);
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "day_records",
              filter: `room_id=eq.${roomId}`,
            },
            () => {
              void get().loadOasisState(roomId);
            },
          )
          .subscribe();

        set({ realtimeChannel: channel });
      },

      unsubscribeFromRoom() {
        const { realtimeChannel } = get();
        if (realtimeChannel) {
          void supabase.removeChannel(realtimeChannel);
        }
        set({ realtimeChannel: null });
      },

      async logWaterCup() {
        const { currentRoom, memberId, repository, oasisState } = get();
        if (
          !currentRoom ||
          currentRoom.id !== oasisState?.room.id ||
          !memberId
        ) {
          set({
            oasisError:
              "참여 정보를 찾을 수 없어요. 인트로에서 오아시스에 다시 입장해 주세요.",
          });
          return;
        }
        if (get().isLoggingWater) return;

        // 이미 열려있는 되돌리기 창은 조용히 닫는다. 이전 기록은 이미 DB에 확정된
        // 상태이므로 별도로 commit할 필요 없다.
        const existingUndo = get().undoWindow;
        if (existingUndo) {
          clearTimeout(existingUndo.timerId);
          set({ undoWindow: null });
        }

        set({ isLoggingWater: true, oasisError: null });
        try {
          const achievementsBefore = getOasisAchievements(oasisState);
          const wasHydrationEmpty =
            oasisState.myHydration !== null &&
            oasisState.myHydration.consumedMl <= 0;
          const result = await repository.logWaterCup(currentRoom.id, memberId);

          // 기록 즉시 오아시스 상태 반영
          await get().loadOasisState(currentRoom.id);

          const refreshedState = get().oasisState;
          const activeState =
            refreshedState?.room.id === currentRoom.id
              ? refreshedState
              : oasisState;
          const achievementsAfter = getOasisAchievements(activeState);
          const eventParams = {
            day_index: currentRoom.dayIndex,
            room_member_count: activeState.members.length,
            drops_contributed: result.dropsContributed,
            completion_percent: result.newSharedProgressPercent,
          };

          if (wasHydrationEmpty && result.newConsumedMl > 0) {
            trackOasisEventOnce(
              "first_water_logged",
              `${currentRoom.id}:${memberId}:day-${currentRoom.dayIndex}`,
              eventParams,
            );
          }
          if (
            !achievementsBefore.isTodayComplete &&
            result.newSharedProgressPercent >= 75
          ) {
            trackOasisEventOnce(
              "oasis_75_completed",
              `${currentRoom.id}:day-${currentRoom.dayIndex}`,
              eventParams,
            );
          }
          if (
            !achievementsBefore.isTodayFullComplete &&
            result.newSharedProgressPercent >= 100
          ) {
            trackOasisEventOnce(
              "oasis_100_completed",
              `${currentRoom.id}:day-${currentRoom.dayIndex}`,
              eventParams,
            );
          }
          if (
            !achievementsBefore.isWeeklyGoalComplete &&
            achievementsAfter.isWeeklyGoalComplete
          ) {
            trackOasisEventOnce("weekly_oasis_completed", currentRoom.id, {
              day_index: currentRoom.dayIndex,
              room_member_count: activeState.members.length,
              completed_days: achievementsAfter.completedDays,
              perfect_days: achievementsAfter.fullCompleteDays,
            });
          }

          const goalMl = get().profile?.dailyGoalMl ?? 0;
          const confirmedAt = Date.now();
          const recentConfirmedWaterAt = [
            ...get().recentConfirmedWaterAt.filter(
              (timestamp) => confirmedAt - timestamp <= 60_000,
            ),
            confirmedAt,
          ];
          const isRapidIncrease = recentConfirmedWaterAt.length >= 3;
          const feedback: WaterLogFeedback = {
            kind: result.dropsContributed > 0 ? "contribution" : "personal",
            dropsContributed: result.dropsContributed,
            contributionDropsTotal: result.contributionDropsTotal,
            consumedMl: result.newConsumedMl,
            goalMl,
            warning: isRapidIncrease
              ? "연속해서 기록했어요.\n섭취량을 확인해 주세요."
              : goalMl > 0 && result.newConsumedMl >= goalMl * 1.5
                ? "오늘 목표를 넘겼어요.\n섭취량을 확인해 주세요."
                : null,
          };

          // 5초 되돌리기 창 (버튼은 막지 않음)
          const timerId = setTimeout(() => {
            set({ undoWindow: null });
          }, 5000);

          set({
            isLoggingWater: false,
            undoWindow: { logEntry: result.logEntry, timerId },
            waterLogFeedback: feedback,
            recentConfirmedWaterAt,
            waterLogFeedbackId: get().waterLogFeedbackId + 1,
          });
        } catch (e) {
          set({
            isLoggingWater: false,
            oasisError: e instanceof Error ? e.message : "기록에 실패했어요.",
          });
        }
      },

      async undoWaterCup() {
        const { currentRoom, memberId, repository, undoWindow } = get();
        if (!currentRoom || !memberId || !undoWindow) return;

        clearTimeout(undoWindow.timerId);
        set({ undoWindow: null });

        try {
          await repository.undoWaterCup(
            currentRoom.id,
            memberId,
            undoWindow.logEntry.logId,
          );
          // 되돌리기 성공 → 오아시스 상태 다시 조회
          await get().loadOasisState(currentRoom.id);
        } catch (e) {
          // 창이 만료됐거나 이후 기록이 추가돼 되돌릴 수 없는 경우는 조용히 처리
          const message = e instanceof Error ? e.message : "";
          const isExpectedFailure =
            message.includes("시간이 지났") ||
            message.includes("새로운 기록이 있") ||
            message.includes("찾을 수 없");
          if (!isExpectedFailure) {
            set({
              oasisError: message || "실행 취소에 실패했어요.",
            });
          }
        }
      },

      async leaveRoom() {
        const { currentRoom, memberId, repository } = get();
        if (!currentRoom || !memberId) {
          set({ oasisError: "참여 중인 오아시스가 없어요." });
          throw new Error("참여 중인 오아시스가 없어요.");
        }

        try {
          await repository.leaveRoom(currentRoom.id, memberId);
          get().forgetJoinedRoom(currentRoom.id);
          get().reset();
        } catch (e) {
          set({
            oasisError:
              e instanceof Error ? e.message : "오아시스에서 나가지 못했어요.",
          });
          throw e instanceof Error
            ? e
            : new Error("오아시스에서 나가지 못했어요.");
        }
      },

      reset() {
        const { undoWindow, joinedRooms } = get();
        if (undoWindow) clearTimeout(undoWindow.timerId);
        get().unsubscribeFromRoom();
        // joinedRooms는 이 기기의 전체 참여 이력이므로, 방 하나를 나가거나
        // 세션을 초기화하더라도 다른 방 목록은 그대로 유지한다.
        set({ ...initialState, joinedRooms });
      },
    }),
    {
      name: "our-oasis-session",
      partialize: (state) => ({
        profile: state.profile,
        memberId: state.memberId,
        currentRoom: state.currentRoom,
        joinedRooms: state.joinedRooms,
      }),
    },
  ),
);
