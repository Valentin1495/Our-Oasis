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
} from "../components";
import {
  DayResultModal,
  OasisDebugPanel,
  OasisScene,
  ParticipantDrops,
  deriveOasisProgressMessage,
  getOasisAchievements,
  getOasisStage,
  getTodayMaxDrops,
  type OasisSceneVariant,
} from "../features/oasis";
import {
  canInviteMoreMembers,
  copyInviteLink,
} from "../features/room";
import { UndoBanner, WaterLogButton } from "../features/water";
import { useOasisStore } from "../lib/store/useOasisStore";
import styles from "./OasisMainPage.module.css";

type InviteStatus = "idle" | "copying" | "copied" | "error";

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
    dropAnimationTick,
  } = useOasisStore();

  const [showDayResult, setShowDayResult] = useState(false);
  const [bottomCTAHeight, setBottomCTAHeight] = useState(112);
  const [scenePreviewPercent, setScenePreviewPercent] = useState<number | null>(
    null,
  );
  const [scenePreviewReducedMotion, setScenePreviewReducedMotion] =
    useState(false);
  const [sceneVariant, setSceneVariant] =
    useState<OasisSceneVariant>("shared");
  const [isSceneAnimating, setIsSceneAnimating] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");

  const bottomCTARef = useRef<HTMLDivElement>(null);
  const inviteResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const sceneAnimationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastAnimatedTickRef = useRef(0);

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
  }, [oasisState, isSceneAnimating]);

  useEffect(() => {
    if (!roomId) return;
    void loadOasisState(roomId);
  }, [roomId, loadOasisState]);

  useEffect(() => {
    if (!roomId) return;
    subscribeToRoom(roomId);
    return () => unsubscribeFromRoom();
  }, [roomId, subscribeToRoom, unsubscribeFromRoom]);

  useEffect(() => {
    if (
      dropAnimationTick === 0 ||
      dropAnimationTick === lastAnimatedTickRef.current
    ) {
      return;
    }
    lastAnimatedTickRef.current = dropAnimationTick;

    const prefersReducedMotion =
      scenePreviewReducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsSceneAnimating(false);
      return;
    }

    setIsSceneAnimating(true);
    if (sceneAnimationTimerRef.current) {
      clearTimeout(sceneAnimationTimerRef.current);
    }
    sceneAnimationTimerRef.current = setTimeout(
      () => setIsSceneAnimating(false),
      1200,
    );
  }, [dropAnimationTick, scenePreviewReducedMotion]);

  useEffect(
    () => () => {
      if (inviteResetTimerRef.current) {
        clearTimeout(inviteResetTimerRef.current);
      }
      if (sceneAnimationTimerRef.current) {
        clearTimeout(sceneAnimationTimerRef.current);
      }
    },
    [],
  );

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
  const daysLeft = Math.max(0, room.durationDays - room.dayIndex);
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
  const maxDrops = getTodayMaxDrops(oasisState);
  const displayedTotalDrops = isScenePreview
    ? Math.round((maxDrops * displayedScenePercent) / 100)
    : totalDrops;
  const progressMessage = deriveOasisProgressMessage({
    percent: displayedScenePercent,
    totalDrops: displayedTotalDrops,
    maxDrops,
  });
  const canInvite = canInviteMoreMembers(
    members.length,
    room.maxMembers,
  );

  const exitScenePreview = () => {
    setScenePreviewPercent(null);
    setScenePreviewReducedMotion(false);
    setSceneVariant("shared");
  };

  const handleInvite = async () => {
    if (inviteStatus === "copying") return;
    setInviteStatus("copying");
    const didCopy = await copyInviteLink(roomId);
    setInviteStatus(didCopy ? "copied" : "error");

    if (inviteResetTimerRef.current) {
      clearTimeout(inviteResetTimerRef.current);
    }
    inviteResetTimerRef.current = setTimeout(
      () => setInviteStatus("idle"),
      2500,
    );
  };

  const handleViewHistory = () => {
    setShowDayResult(false);
    navigate(`/oasis/${roomId}/history`);
  };

  const inviteLabel =
    inviteStatus === "copying"
      ? "복사 중..."
      : inviteStatus === "copied"
        ? "복사 완료"
        : inviteStatus === "error"
          ? "다시 시도"
          : "친구 초대";

  return (
    <ScreenContainer
      hasBottomCTA
      className={`${styles.page} ${scenePreviewReducedMotion ? styles.reducedMotion : ""}`}
      style={
        {
          height: "100dvh",
          minHeight: 0,
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          backgroundColor: "#fbf7f0",
          "--bottom-cta-height": `${bottomCTAHeight}px`,
        } as CSSProperties
      }
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>우리들의 오아시스</h1>
          <p className={styles.subtitle}>
            {room.name} · 오늘 친구들과 함께 채워요
          </p>
        </div>
        <span
          className={styles.dayBadge}
          aria-label={`챌린지 ${daysLeft}일 남음`}
        >
          D-{daysLeft}
        </span>
      </header>

      <main className={styles.content}>
        <section
          className={styles.visualSection}
          aria-label="오늘의 공유 오아시스"
        >
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

          <ParticipantDrops
            members={members}
            currentMemberId={memberId}
          />
        </section>

        <section
          className={styles.progressStatus}
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            key={`${progressMessage.headline}-${progressMessage.detail ?? ""}`}
            className={styles.progressStatusContent}
          >
            <h2 className={styles.progressHeadline}>
              {progressMessage.headline}
            </h2>
            {progressMessage.detail && (
              <p className={styles.progressDetail}>
                {progressMessage.detail}
              </p>
            )}
          </div>
        </section>

        {oasisError && <InlineError message={oasisError} />}

        <nav className={styles.secondaryActions} aria-label="오아시스 메뉴">
          <button
            type="button"
            className={styles.textAction}
            onClick={() => setShowDayResult(true)}
          >
            오늘 기록
          </button>

          {canInvite && (
            <>
              <span className={styles.actionDivider} aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                className={styles.textAction}
                onClick={() => void handleInvite()}
                disabled={inviteStatus === "copying"}
              >
                {inviteLabel}
              </button>
            </>
          )}
        </nav>

        <p
          className={styles.inviteFeedback}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {inviteStatus === "copied"
            ? "초대 링크를 복사했어요"
            : inviteStatus === "error"
              ? "링크를 복사하지 못했어요"
              : ""}
        </p>
      </main>

      <div ref={bottomCTARef} className={styles.bottomCTA}>
        <WaterLogButton
          hydration={oasisState.myHydration}
          isVisualFeedbackPlaying={isSceneAnimating}
        />
      </div>

      <UndoBanner bottomOffset={bottomCTAHeight} />

      <DayResultModal
        open={showDayResult}
        oasisState={oasisState}
        onClose={() => setShowDayResult(false)}
        onViewHistory={handleViewHistory}
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
