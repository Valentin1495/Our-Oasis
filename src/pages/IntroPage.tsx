import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@toss/tds-mobile";
import { ScreenContainer, LoadingView } from "../components";
import { mergeRoomSummaries } from "../features/room";
import { useOasisStore } from "../lib/store/useOasisStore";
import { getAnonymousUserKey } from "../lib/toss/getAnonymousUserKey";
import type { MyRoomSummary } from "../types";

export function IntroPage() {
  const navigate = useNavigate();
  const {
    repository,
    setCurrentRoom,
    setProfile,
    rememberJoinedRoom,
    joinedRooms,
  } = useOasisStore();
  // 이 기기에 남아 있는 참여 기록을 먼저 보여주고, 서버 조회가 끝나면
  // 최신 정보로 병합한다. 익명 식별키 조회가 실패하거나(브라우저 미리보기,
  // 구버전 SDK 등) 네트워크가 느려도 목록 자체는 항상 보일 수 있게 한다.
  const [myRooms, setMyRooms] = useState<MyRoomSummary[]>(joinedRooms);
  const [isLoadingRooms, setIsLoadingRooms] = useState(
    joinedRooms.length === 0,
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const tossAnonymousKey = await getAnonymousUserKey();
      if (!tossAnonymousKey) {
        if (active) setIsLoadingRooms(false);
        return;
      }
      try {
        const serverRooms = await repository.getMyRooms(tossAnonymousKey);
        if (active) setMyRooms(mergeRoomSummaries(serverRooms, joinedRooms));
      } catch {
        // 서버 조회가 실패해도 로컬 기록은 그대로 남겨 목록이 비지 않게 한다.
      } finally {
        if (active) setIsLoadingRooms(false);
      }
    })();
    return () => {
      active = false;
    };
    // joinedRooms는 최초 렌더 기준 값으로 충분하다 — 이후 변경은 이 화면에서
    // 다시 조회할 필요 없는 로컬 상태 변화(예: 다른 방 입장)이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  function handleCreateRoom() {
    navigate("/profile?next=create");
  }

  function handleJoinRoom() {
    navigate("/profile?next=join");
  }

  function handleEnterRoom(room: MyRoomSummary) {
    setCurrentRoom(room.room);
    setProfile(
      {
        id: room.memberId,
        nickname: room.nickname,
        cupMl: room.cupMl,
        dailyGoalMl: room.dailyGoalMl,
      },
      room.memberId,
    );
    rememberJoinedRoom(room);
    navigate(`/oasis/${room.room.id}`);
  }

  const hasMyRooms = myRooms.length > 0;

  return (
    <ScreenContainer>
      {/* 헤더 영역 */}
      {isLoadingRooms ? (
        <LoadingView label="참여 중인 오아시스를 불러오는 중..." />
      ) : hasMyRooms ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "32px 20px 16px",
            gap: "16px",
            overflowY: "auto",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: "var(--color-label-normal)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            참여 중인 오아시스
          </h1>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {myRooms.map((r) => (
              <button
                key={r.room.id}
                type="button"
                onClick={() => handleEnterRoom(r)}
                aria-label={`${r.room.name} 오아시스로 입장하기`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "16px",
                  backgroundColor: "var(--oasis-mint-50, #eefaf8)",
                  border: "1px solid var(--oasis-mint-100, #d6efec)",
                  borderRadius: "14px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--color-label-normal)",
                    }}
                  >
                    🌴 {r.room.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "13px",
                      color: "var(--color-label-alternative)",
                      marginTop: "2px",
                    }}
                  >
                    {r.nickname}님으로 참여 중
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{ color: "var(--color-label-assistive)" }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 32px 32px",
            textAlign: "center",
            gap: "16px",
          }}
        >
          {/* 일러스트 대용 이모지 */}
          <div
            aria-hidden="true"
            style={{
              fontSize: "72px",
              lineHeight: 1,
              animation: "pulse-gentle 3s ease-in-out infinite",
            }}
          >
            🌴
          </div>

          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--color-label-normal)",
              lineHeight: 1.35,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            친구들과 우리만의
            <br />
            오아시스를 키워요
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "var(--color-label-alternative)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            매일 마신 물을 기록하면,
            <br />
            친구들과 함께 오아시스가 자라나요.
          </p>
        </div>
      )}

      {/* CTA 영역 */}
      <div
        style={{
          padding: "0 24px calc(40px + env(safe-area-inset-bottom, 0px))",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <Button
          size="xlarge"
          variant="fill"
          onClick={handleCreateRoom}
          aria-label="오아시스 방 만들기"
          style={{ width: "100%" }}
        >
          오아시스 생성하기
        </Button>

        <Button
          size="xlarge"
          variant="weak"
          onClick={handleJoinRoom}
          aria-label="초대받은 오아시스 방에 참여하기"
          style={{ width: "100%" }}
        >
          오아시스 참여하기
        </Button>
      </div>
    </ScreenContainer>
  );
}
