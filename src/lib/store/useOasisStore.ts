import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { supabaseRepository } from "../supabase/SupabaseOasisRepository";
import type { OasisRepository } from "../repository/OasisRepository";
import type { OasisState, Profile, Room, WaterLogEntry } from "../../types";
import { getAnonymousUserKey } from "../toss/getAnonymousUserKey";

interface PendingUndo {
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

  // 오아시스 상태
  oasisState: OasisState | null;
  isLoadingOasis: boolean;
  oasisError: string | null;

  // 물 기록 상태
  isLoggingWater: boolean;
  pendingUndo: PendingUndo | null;
  waterLogFeedback: WaterLogFeedback | null;
  recentConfirmedWaterAt: number[];

  // 애니메이션 트리거
  dropAnimationTick: number;
  personalRecordAnimationTick: number;

  // 실시간 구독 채널
  realtimeChannel: RealtimeChannel | null;

  // 액션
  setProfile: (profile: Profile, memberId: string) => void;
  setCurrentRoom: (room: Room) => void;
  loadOasisState: (roomId: string) => Promise<void>;
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
  logWaterCup: () => Promise<void>;
  undoWaterCup: () => Promise<void>;
  confirmPendingUndo: () => Promise<void>;
  wakeUpFriends: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  profile: null,
  memberId: null,
  currentRoom: null,
  oasisState: null,
  isLoadingOasis: false,
  oasisError: null,
  isLoggingWater: false,
  pendingUndo: null,
  waterLogFeedback: null,
  recentConfirmedWaterAt: [],
  dropAnimationTick: 0,
  personalRecordAnimationTick: 0,
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
        set({ currentRoom: room });
      },

      async loadOasisState(roomId) {
        set({ isLoadingOasis: true, oasisError: null });
        try {
          const beforeLoad = get();
          const { repository } = beforeLoad;
          const sessionMemberId =
            beforeLoad.currentRoom?.id === roomId
              ? beforeLoad.memberId
              : null;
          const oasisState = await repository.getOasisState(
            roomId,
            sessionMemberId,
          );
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

          if (membership) {
            const restoredOasisState = await repository.getOasisState(
              roomId,
              membership.memberId,
            );
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
            return;
          }

          set({
            oasisState,
            currentRoom: null,
            memberId: null,
            profile: null,
            isLoadingOasis: false,
          });
        } catch (e) {
          set({
            isLoadingOasis: false,
            oasisError:
              e instanceof Error ? e.message : "불러오기에 실패했어요.",
          });
        }
      },

      /**
       * 다른 멤버가 물을 기록해 room_members/day_records가 바뀌면
       * 실시간으로 오아시스 상태를 다시 불러온다.
       * 단, 내 확정 대기(pendingUndo) 중에는 화면을 먼저 바꾸지 않는다.
       */
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
              if (get().pendingUndo) return;
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
              if (get().pendingUndo) return;
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
        const { currentRoom, memberId, repository, pendingUndo, oasisState } =
          get();
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

        set({ isLoggingWater: true, oasisError: null });
        try {
          // 연속 기록이면 앞선 컵을 먼저 확정한 후 새 대기 기록을 만든다.
          if (pendingUndo) {
            clearTimeout(pendingUndo.timerId);
            await get().confirmPendingUndo();
            if (get().oasisError) {
              set({ isLoggingWater: false });
              return;
            }
          }

          const result = await repository.logWaterCup(currentRoom.id, memberId);

          // 배너가 떠 있는 동안은 물방울/진행률/오아시스를 아직 바꾸지 않는다.
          const timerId = setTimeout(() => {
            void get().confirmPendingUndo();
          }, 5000);

          set({
            isLoggingWater: false,
            pendingUndo: { logEntry: result.logEntry, timerId },
          });
        } catch (e) {
          set({
            isLoggingWater: false,
            oasisError: e instanceof Error ? e.message : "기록에 실패했어요.",
          });
        }
      },

      /** 5초가 지나면 DB에서 실제 집계를 확정한다. 이 변경만 다른 사용자에게 실시간 전파된다. */
      async confirmPendingUndo() {
        const { pendingUndo, memberId, currentRoom, repository } = get();
        if (!pendingUndo || !memberId || !currentRoom) return;

        clearTimeout(pendingUndo.timerId);
        try {
          const result = await repository.confirmWaterCup(
            currentRoom.id,
            memberId,
            pendingUndo.logEntry.logId,
          );
          set({ pendingUndo: null });
          await get().loadOasisState(currentRoom.id);
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
            warning:
              isRapidIncrease
                ? "짧은 시간에 많은 양이 기록됐어요. 실제로 마신 양인지 확인해 주세요."
                : goalMl > 0 && result.newConsumedMl >= goalMl * 1.5
                  ? "오늘 목표를 많이 넘겼어요. 실제로 마신 양인지 확인해 주세요."
                : null,
          };
          if (result.dropsContributed > 0) {
            set({
              waterLogFeedback: feedback,
              recentConfirmedWaterAt,
              dropAnimationTick: get().dropAnimationTick + 1,
            });
          } else {
            set({
              waterLogFeedback: feedback,
              recentConfirmedWaterAt,
              personalRecordAnimationTick:
                get().personalRecordAnimationTick + 1,
            });
          }
        } catch (e) {
          set({
            pendingUndo: null,
            oasisError: e instanceof Error ? e.message : "확정에 실패했어요.",
          });
        }
      },

      async undoWaterCup() {
        const { currentRoom, memberId, repository, pendingUndo } = get();
        if (!currentRoom || !memberId || !pendingUndo) return;

        clearTimeout(pendingUndo.timerId);
        // 확정 전 취소이므로 집계 상태는 건드리지 않고 대기 로그만 삭제한다.
        set({ pendingUndo: null });

        try {
          await repository.undoWaterCup(
            currentRoom.id,
            memberId,
            pendingUndo.logEntry.logId,
          );
        } catch (e) {
          set({
            oasisError:
              e instanceof Error ? e.message : "실행 취소에 실패했어요.",
          });
        }
      },

      async wakeUpFriends() {
        const { currentRoom, repository } = get();
        if (!currentRoom) return;
        try {
          await repository.wakeUpFriends(currentRoom.id);
        } catch {
          // 알림 실패는 조용히 무시
        }
      },

      reset() {
        const { pendingUndo } = get();
        if (pendingUndo) clearTimeout(pendingUndo.timerId);
        get().unsubscribeFromRoom();
        set({ ...initialState });
      },
    }),
    {
      name: "our-oasis-session",
      partialize: (state) => ({
        profile: state.profile,
        memberId: state.memberId,
        currentRoom: state.currentRoom,
      }),
    },
  ),
);
