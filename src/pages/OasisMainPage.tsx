import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  EmptyState,
  InlineError,
  LoadingView,
  ScreenContainer,
  SectionTitle,
} from "../components";
import {
  DayResultModal,
  MemberList,
  OasisDebugPanel,
  OasisScene,
  SharedProgressBar,
  getOasisAchievements,
  getOasisStage,
  type OasisSceneVariant,
} from "../features/oasis";
import { UndoBanner, WaterLogButton } from "../features/water";
import { useOasisStore } from "../lib/store/useOasisStore";

export function OasisMainPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    oasisState,
    isLoadingOasis,
    oasisError,
    memberId,
    loadOasisState,
    subscribeToRoom,
    unsubscribeFromRoom,
    wakeUpFriends,
    dropAnimationTick,
  } = useOasisStore();

  const [showDayResult, setShowDayResult] = useState(false);
  const [bottomCTAHeight, setBottomCTAHeight] = useState(180);
  const [scenePreviewPercent, setScenePreviewPercent] = useState<number | null>(
    null,
  );
  const [scenePreviewReducedMotion, setScenePreviewReducedMotion] =
    useState(false);
  const [sceneVariant, setSceneVariant] =
    useState<OasisSceneVariant>("prototype");
  const bottomCTARef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bottomCTA = bottomCTARef.current;
    if (!bottomCTA) return;

    const updateBottomCTAHeight = () => {
      setBottomCTAHeight(Math.ceil(bottomCTA.getBoundingClientRect().height));
    };

    updateBottomCTAHeight();
    const resizeObserver = new ResizeObserver(updateBottomCTAHeight);
    resizeObserver.observe(bottomCTA);

    return () => resizeObserver.disconnect();
  }, [oasisState]);

  useEffect(() => {
    if (!roomId) return;
    void loadOasisState(roomId);
  }, [roomId, loadOasisState]);

  // 다른 멤버의 물 기록이 실시간으로 반영되도록 구독한다.
  useEffect(() => {
    if (!roomId) return;
    subscribeToRoom(roomId);
    return () => unsubscribeFromRoom();
  }, [roomId, subscribeToRoom, unsubscribeFromRoom]);

  if (!roomId) return null;

  if (isLoadingOasis && !oasisState) return <LoadingView rows={5} />;

  if (oasisError && !oasisState) {
    return (
      <ScreenContainer>
        <InlineError
          message={oasisError}
          onRetry={() => loadOasisState(roomId)}
        />
      </ScreenContainer>
    );
  }

  if (!oasisState) {
    return (
      <ScreenContainer>
        <EmptyState
          title="오아시스를 불러올 수 없어요"
          description="잠시 후 다시 시도해 주세요."
        />
      </ScreenContainer>
    );
  }

  const { room, members, sharedProgressPercent, totalDrops, stage } =
    oasisState;
  const daysLeft = room.durationDays - room.dayIndex;
  const {
    allMembersParticipatedToday,
    isTodayFullComplete,
    isFinalOasisUnlocked,
    isSpecialCharacterSettled,
  } = getOasisAchievements(oasisState);
  const isScenePreview =
    import.meta.env.DEV && scenePreviewPercent !== null;
  const displayedScenePercent = isScenePreview
    ? scenePreviewPercent
    : sharedProgressPercent;
  const displayedSceneStage = isScenePreview
    ? getOasisStage(displayedScenePercent)
    : stage;

  const exitScenePreview = () => {
    setScenePreviewPercent(null);
    setScenePreviewReducedMotion(false);
    setSceneVariant("prototype");
  };

  return (
    <ScreenContainer
      hasBottomCTA
      style={
        {
          height: "100dvh",
          minHeight: 0,
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          "--bottom-cta-height": `${bottomCTAHeight}px`,
        } as CSSProperties
      }
    >
      {/* 상단: 방 이름 + 남은 날짜 */}
      <div
        style={{
          padding: "16px 20px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--color-label-normal)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {room.name}
        </h1>
        <span
          style={{
            fontSize: "13px",
            color: "var(--oasis-mint-500)",
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: "12px",
          }}
          aria-label={`챌린지 ${daysLeft}일 남음`}
        >
          D-{daysLeft}
        </span>
      </div>

      {/* 오아시스 씬 */}
      <div style={{ padding: "8px 20px 16px" }}>
        <OasisScene
          stage={displayedSceneStage}
          sharedProgressPercent={displayedScenePercent}
          dropAnimationTick={isScenePreview ? 0 : dropAnimationTick}
          isFullComplete={
            isScenePreview
              ? displayedScenePercent >= 100
              : isTodayFullComplete
          }
          showSpecialCharacter={
            !isScenePreview &&
            (allMembersParticipatedToday || isSpecialCharacterSettled)
          }
          isFinalOasisUnlocked={!isScenePreview && isFinalOasisUnlocked}
          reducedMotion={scenePreviewReducedMotion}
          variant={sceneVariant}
        />
      </div>

      {/* 공동 진행률 */}
      <SharedProgressBar
        percent={sharedProgressPercent}
        totalDrops={totalDrops}
      />

      {oasisError && <InlineError message={oasisError} />}

      {/* 멤버 목록 */}
      <div style={{ marginTop: "24px" }}>
        <SectionTitle>멤버</SectionTitle>
        <MemberList
          members={members}
          currentMemberId={memberId}
        />
      </div>

      {/* 오늘의 결과 버튼 */}
      <div style={{ padding: "16px 20px 0" }}>
        <button
          type="button"
          onClick={() => setShowDayResult(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--oasis-blue-400)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 0",
            textDecoration: "underline",
          }}
          aria-label="오늘의 결과 보기"
        >
          오늘의 결과 보기
        </button>
        {" · "}
        <button
          type="button"
          onClick={() => navigate(`/oasis/${roomId}/history`)}
          style={{
            background: "none",
            border: "none",
            color: "var(--oasis-blue-400)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "8px 0",
            textDecoration: "underline",
          }}
          aria-label="7일 기록 보기"
        >
          7일 기록
        </button>
      </div>

      {/* 하단 고정 CTA */}
      <div
        ref={bottomCTARef}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 20px calc(12px + env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--color-background)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 50,
        }}
      >
        <WaterLogButton hydration={oasisState.myHydration} />
        <button
          type="button"
          onClick={wakeUpFriends}
          aria-label="아직 참여하지 않은 친구 깨우기"
          style={{
            background: "none",
            border: "1.5px solid var(--color-border)",
            borderRadius: "12px",
            padding: "12px",
            color: "var(--color-label-alternative)",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          친구 깨우기
        </button>
      </div>

      {/* 실행취소 배너 */}
      <UndoBanner bottomOffset={bottomCTAHeight} />

      {/* 오늘 결과 모달 */}
      <DayResultModal
        open={showDayResult}
        oasisState={oasisState}
        onClose={() => setShowDayResult(false)}
      />

      {import.meta.env.DEV && (
        <OasisDebugPanel
          actualPercent={sharedProgressPercent}
          previewPercent={scenePreviewPercent}
          reducedMotion={scenePreviewReducedMotion}
          sceneVariant={sceneVariant}
          onPreviewPercentChange={setScenePreviewPercent}
          onReducedMotionChange={setScenePreviewReducedMotion}
          onSceneVariantChange={setSceneVariant}
          onExitPreview={exitScenePreview}
        />
      )}
    </ScreenContainer>
  );
}
