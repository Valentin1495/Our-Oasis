import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Top } from "@toss/tds-mobile";
import { ScreenContainer } from "../components";
import { JoinRoomForm } from "../features/room";
import { useOasisStore } from "../lib/store/useOasisStore";
import { getAnonymousUserKey } from "../lib/toss/getAnonymousUserKey";
import {
  rememberMembershipStartDay,
  trackOasisEvent,
} from "../lib/analytics/oasisAnalytics";

export function JoinRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRoomId = searchParams.get("roomId") ?? "";

  const {
    profile,
    repository,
    setCurrentRoom,
    setProfile,
    rememberJoinedRoom,
  } = useOasisStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 초대 링크로 roomId를 들고 들어왔는데 프로필이 없으면,
    // 방 코드 입력 화면을 보여줄 필요 없이 바로 프로필 설정으로 보낸다.
    if (!profile && initialRoomId) {
      navigate(
        `/profile?next=join&roomId=${encodeURIComponent(initialRoomId)}`,
        {
          replace: true,
        },
      );
    }
  }, [profile, initialRoomId, navigate]);

  async function handleJoin(roomId: string) {
    if (!profile) {
      navigate(`/profile?next=join&roomId=${encodeURIComponent(roomId)}`);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const tossAnonymousKey = await getAnonymousUserKey();
      const { room, memberId, rejoined } = await repository.joinRoom(
        roomId,
        profile,
        tossAnonymousKey,
      );
      setCurrentRoom(room);
      // 서버가 발급한 실제 memberId로 store 동기화
      setProfile(profile, memberId);
      rememberJoinedRoom({
        room,
        memberId,
        nickname: profile.nickname,
        cupMl: profile.cupMl,
        dailyGoalMl: profile.dailyGoalMl,
      });
      rememberMembershipStartDay(room.id, room.dayIndex);
      if (!rejoined) {
        trackOasisEvent("invite_joined", {
          day_index: room.dayIndex,
          join_method: initialRoomId ? "invite_link" : "manual_code",
          room_capacity: room.maxMembers,
        });
      }
      navigate(`/oasis/${room.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 참여에 실패했어요.");
      setIsSubmitting(false);
    }
  }

  if (!profile && initialRoomId) {
    return null;
  }

  return (
    <ScreenContainer>
      <Top
        title={<Top.TitleParagraph size={22}>방 참여하기</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            친구에게 받은 초대 링크로 참여해요
          </Top.SubtitleParagraph>
        }
        upperGap={16}
        lowerGap={24}
      />
      <JoinRoomForm
        initialRoomId={initialRoomId}
        onSubmit={handleJoin}
        onInputChange={() => setError(null)}
        isSubmitting={isSubmitting}
        error={error}
      />
    </ScreenContainer>
  );
}
