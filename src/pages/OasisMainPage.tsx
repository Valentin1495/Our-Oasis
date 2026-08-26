import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Toast, ConfirmDialog } from "@toss/tds-mobile";
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
  createOasisSceneSnapshot,
  deriveOasisProgressMessage,
  getOasisAchievements,
  getOasisStatus,
  getTodayMaxDrops,
  useOasisSceneController,
  type OasisSceneMember,
} from "../features/oasis";
import {
  canInviteMoreMembers,
  copyInviteLink,
  wakeUpFriends,
} from "../features/room";
import { UndoBanner, WaterLogButton } from "../features/water";
import { useOasisStore } from "../lib/store/useOasisStore";
import styles from "./OasisMainPage.module.css";

type InviteStatus = "idle" | "copying" | "copied" | "error";
type WakeUpStatus = "idle" | "sending" | "shared" | "copied" | "failed";

const WAKE_UP_HINT_STORAGE_KEY = "oasis:wake-up-hint-learned";

const oasisPageStyle: CSSProperties = {
  height: "100dvh",
  minHeight: 0,
  overflowY: "auto",
  overscrollBehaviorY: "contain",
  backgroundColor: "#c78e57",
};

export function OasisMainPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    oasisState,
    isLoadingOasis,
    oasisError,
    memberId,
    isLoggingWater,
    undoWindow,
    loadOasisState,
    leaveRoom,
    subscribeToRoom,
    unsubscribeFromRoom,
    forgetJoinedRoom,
  } = useOasisStore();

  const [showDayResult, setShowDayResult] = useState(false);
  const [bottomCTAHeight, setBottomCTAHeight] = useState(112);
  const [scenePreviewPercent, setScenePreviewPercent] = useState<number | null>(
    null,
  );
  const [scenePreviewReducedMotion, setScenePreviewReducedMotion] =
    useState(false);
  const [scenePreviewMembers, setScenePreviewMembers] = useState<
    OasisSceneMember[] | null
  >(null);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");
  const [wakeUpStatus, setWakeUpStatus] = useState<WakeUpStatus>("idle");
  const [celebrateMemberName, setCelebrateMemberName] = useState<
    string | null
  >(null);
  const [wakeUpHintLearned, setWakeUpHintLearned] = useState(() => {
    try {
      return localStorage.getItem(WAKE_UP_HINT_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const bottomCTARef = useRef<HTMLDivElement>(null);
  const wakeUpResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(
    () => () => {
      if (wakeUpResetTimerRef.current) clearTimeout(wakeUpResetTimerRef.current);
    },
    [],
  );

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

  useEffect(() => {
    // 방이 실제로 존재하지 않는다고 서버가 확인해 준 경우에만 이 기기의
    // 참여 목록에서 지운다. 그 외 실패(네트워크 오류 등)는 일시적일 수
    // 있으므로 목록을 건드리지 않는다.
    if (roomId && oasisError === "방을 찾을 수 없어요.") {
      forgetJoinedRoom(roomId);
    }
  }, [roomId, oasisError, forgetJoinedRoom]);

  useEffect(() => {
    if (!roomId) return;
    subscribeToRoom(roomId);
    return () => unsubscribeFromRoom();
  }, [roomId, subscribeToRoom, unsubscribeFromRoom]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setSystemReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const isScenePreview = import.meta.env.DEV && scenePreviewPercent !== null;
  const targetSceneSnapshot = useMemo(() => {
    if (!oasisState) return null;

    const previewMembers = scenePreviewMembers ?? oasisState.members;
    const maxDrops = isScenePreview
      ? previewMembers.length * 4
      : getTodayMaxDrops(oasisState);
    const achievements = getOasisAchievements(oasisState);
    const percent = isScenePreview
      ? scenePreviewPercent
      : oasisState.sharedProgressPercent;
    const totalDrops = isScenePreview
      ? Math.round((maxDrops * percent) / 100)
      : oasisState.totalDrops;

    return createOasisSceneSnapshot({
      totalDrops,
      maxDrops,
      displayPercent: percent,
      isCommunitySuccess: isScenePreview
        ? percent >= 75
        : achievements.isTodayComplete,
      isPerfect: isScenePreview
        ? percent >= 100
        : achievements.isTodayFullComplete,
      members: previewMembers,
      currentMemberId: memberId,
    });
  }, [
    isScenePreview,
    memberId,
    oasisState,
    scenePreviewMembers,
    scenePreviewPercent,
  ]);
  const effectiveReducedMotion =
    scenePreviewReducedMotion || systemReducedMotion;
  const sceneController = useOasisSceneController(targetSceneSnapshot, {
    reducedMotion: effectiveReducedMotion,
  });

  if (!roomId) return null;

  // 로딩/에러 상태도 오아시스 화면과 같은 배경을 사용해, 로딩이 끝나고
  // 장면이 나타날 때 흰 화면 → 모래빛 배경으로 바뀌는 깜빡임을 없앤다.
  if (isLoadingOasis && !oasisState) {
    return (
      <ScreenContainer className={styles.page} style={oasisPageStyle}>
        <LoadingView rows={5} />
      </ScreenContainer>
    );
  }

  if (oasisError && !oasisState) {
    return (
      <ScreenContainer className={styles.page} style={oasisPageStyle}>
        <InlineError
          message={oasisError}
          onRetry={() => loadOasisState(roomId)}
        />
      </ScreenContainer>
    );
  }

  if (!oasisState) {
    return (
      <ScreenContainer className={styles.page} style={oasisPageStyle}>
        <EmptyState
          title="오아시스를 불러올 수 없어요"
          description="잠시 후 다시 시도해 주세요."
        />
      </ScreenContainer>
    );
  }

  // oasisState가 있으면 위의 useMemo도 항상 snapshot을 만든다.
  if (!targetSceneSnapshot) return null;

  const { room, members, sharedProgressPercent } = oasisState;
  const daysLeft = Math.max(0, room.durationDays - room.dayIndex);
  const displayedSceneSnapshot =
    sceneController.displayedSnapshot ?? targetSceneSnapshot;
  const displayedScenePercent = displayedSceneSnapshot.progress.displayPercent;
  const displayedOasisStatus = getOasisStatus(displayedScenePercent);
  const maxDrops = getTodayMaxDrops(oasisState);
  const displayedTotalDrops = displayedSceneSnapshot.progress.totalDrops;
  const progressMessage = deriveOasisProgressMessage({
    percent: displayedScenePercent,
    totalDrops: displayedTotalDrops,
    maxDrops,
  });
  const canInvite = canInviteMoreMembers(members.length, room.maxMembers);

  const exitScenePreview = () => {
    setScenePreviewPercent(null);
    setScenePreviewMembers(null);
    setScenePreviewReducedMotion(false);
  };

  const getDebugMembers = (count: number): OasisSceneMember[] => {
    const unsortedMembers = scenePreviewMembers ?? targetSceneSnapshot.members;
    const sourceMembers = [...unsortedMembers].sort((left, right) => {
      if (left.id === targetSceneSnapshot.currentMemberId) return -1;
      if (right.id === targetSceneSnapshot.currentMemberId) return 1;
      return 0;
    });
    return Array.from({ length: count }, (_, index) => {
      const existing = sourceMembers[index];
      if (existing) return existing;
      return {
        id: `debug-member-${index + 1}`,
        nickname: `친구${index + 1}`,
        contributedDropsToday: 0,
        hasWaterRecordToday: false,
      };
    });
  };

  const handlePreviewMemberCountChange = (count: number) => {
    const membersForPreview = getDebugMembers(count);
    const maxPreviewDrops = count * 4;
    const totalPreviewDrops = Math.min(
      maxPreviewDrops,
      Math.round(
        (displayedSceneSnapshot.progress.displayPercent / 100) *
          maxPreviewDrops,
      ),
    );
    setScenePreviewMembers(membersForPreview);
    setScenePreviewPercent(
      maxPreviewDrops > 0 ? (totalPreviewDrops / maxPreviewDrops) * 100 : 0,
    );
  };

  const handlePreviewMemberProgression = () => {
    const comparisonMembers = getDebugMembers(5).map((member, index) => ({
      ...member,
      contributedDropsToday: index,
      hasWaterRecordToday: index > 0,
    }));
    const totalDrops = comparisonMembers.reduce(
      (sum, member) => sum + member.contributedDropsToday,
      0,
    );

    setScenePreviewMembers(comparisonMembers);
    setScenePreviewPercent((totalDrops / (comparisonMembers.length * 4)) * 100);
  };

  const handlePreviewContribution = (
    origin: "local" | "remote",
    requestedDrops: number,
  ) => {
    const source = targetSceneSnapshot;
    const currentMemberIndex = source.members.findIndex(
      (member) => member.id === source.currentMemberId,
    );
    const remoteMemberIndex = source.members.findIndex(
      (member) => member.id !== source.currentMemberId,
    );
    const actorIndex =
      origin === "local"
        ? Math.max(0, currentMemberIndex)
        : remoteMemberIndex >= 0
          ? remoteMemberIndex
          : 0;
    const actor = source.members[actorIndex];
    if (!actor) return;

    const addedDrops = Math.min(
      requestedDrops,
      4 - actor.contributedDropsToday,
      source.progress.maxDrops - source.progress.totalDrops,
    );
    if (addedDrops <= 0) return;

    const nextMembers = source.members.map((member, index) =>
      index === actorIndex
        ? {
            ...member,
            contributedDropsToday: member.contributedDropsToday + addedDrops,
            hasWaterRecordToday: true,
          }
        : member,
    );
    const nextTotal = source.progress.totalDrops + addedDrops;
    setScenePreviewMembers(nextMembers);
    setScenePreviewPercent(
      source.progress.maxDrops > 0
        ? (nextTotal / source.progress.maxDrops) * 100
        : 0,
    );
  };

  const handlePreviewParticipation = () => {
    const source = targetSceneSnapshot;
    const actorIndex = source.members.findIndex(
      (member) =>
        member.id !== source.currentMemberId && !member.hasWaterRecordToday,
    );
    if (actorIndex < 0) return;
    setScenePreviewMembers(
      source.members.map((member, index) =>
        index === actorIndex
          ? { ...member, hasWaterRecordToday: true }
          : member,
      ),
    );
    setScenePreviewPercent(source.progress.displayPercent);
  };

  const handlePreviewThreshold = (threshold: 75 | 100) => {
    const sourceMembers = getDebugMembers(
      Math.max(2, targetSceneSnapshot.members.length),
    );
    const maxPreviewDrops = sourceMembers.length * 4;
    const targetDrops =
      threshold === 75 ? Math.ceil(maxPreviewDrops * 0.75) : maxPreviewDrops;
    const beforeDrops = Math.max(0, targetDrops - 1);
    let remaining = beforeDrops;
    const beforeMembers = sourceMembers.map((member) => {
      const contributedDropsToday = Math.min(4, remaining);
      remaining -= contributedDropsToday;
      return {
        ...member,
        contributedDropsToday,
        hasWaterRecordToday:
          member.hasWaterRecordToday || contributedDropsToday > 0,
      };
    });
    const actorIndex = beforeMembers.findIndex(
      (member) =>
        member.id !== targetSceneSnapshot.currentMemberId &&
        member.contributedDropsToday < 4,
    );
    const safeActorIndex =
      actorIndex >= 0
        ? actorIndex
        : beforeMembers.findIndex((member) => member.contributedDropsToday < 4);

    setScenePreviewMembers(beforeMembers);
    setScenePreviewPercent((beforeDrops / maxPreviewDrops) * 100);

    requestAnimationFrame(() => {
      setScenePreviewMembers(
        beforeMembers.map((member, index) =>
          index === safeActorIndex
            ? {
                ...member,
                contributedDropsToday: member.contributedDropsToday + 1,
                hasWaterRecordToday: true,
              }
            : member,
        ),
      );
      setScenePreviewPercent((targetDrops / maxPreviewDrops) * 100);
    });
  };

  const handleInvite = async () => {
    if (inviteStatus === "copying") return;
    setInviteStatus("copying");
    const didCopy = await copyInviteLink(roomId);
    setInviteStatus(didCopy ? "copied" : "error");
  };

  // 공동 기여는 멤버당 하루 최대 4개. 오늘 총 물방울(75%/100% 판정 기준)에
  // 직접 영향을 주는 건 "한 번도 안 마심"이 아니라 "아직 4개를 다 채우지
  // 않음"이므로, 이미 일부 기여한 멤버도 깨우기 대상에 포함한다.
  const hasWakeUpTarget = members.some(
    (member) => member.id !== memberId && member.contributedDropsToday < 4,
  );

  const markWakeUpHintLearned = () => {
    if (wakeUpHintLearned) return;
    setWakeUpHintLearned(true);
    try {
      localStorage.setItem(WAKE_UP_HINT_STORAGE_KEY, "1");
    } catch {
      // 프라이빗 모드 등 저장이 불가능해도 힌트 노출 자체는 계속 동작해야 한다.
    }
  };

  const handleWakeUpMember = (targetMemberId: string) => {
    markWakeUpHintLearned();
    if (wakeUpStatus === "sending" || targetMemberId === memberId) return;
    const target = members.find((member) => member.id === targetMemberId);
    if (!target) return;
    if (target.contributedDropsToday >= 4) {
      setCelebrateMemberName(target.nickname);
      return;
    }
    setWakeUpStatus("sending");
    wakeUpFriends(roomId, room.name, [target.nickname])
      .then((result) => {
        setWakeUpStatus(result);
        if (wakeUpResetTimerRef.current) {
          clearTimeout(wakeUpResetTimerRef.current);
        }
        wakeUpResetTimerRef.current = setTimeout(
          () => setWakeUpStatus("idle"),
          2500,
        );
      })
      .catch(() => setWakeUpStatus("failed"));
  };

  const handleViewHistory = () => {
    setShowDayResult(false);
    navigate(`/oasis/${roomId}/history`);
  };

  const handleConfirmLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveRoom();
      navigate("/", { replace: true });
    } catch {
      setIsLeaving(false);
    }
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
      className={`${styles.page} ${
        displayedOasisStatus === "PERFECT_SUCCESS"
          ? styles.perfectSuccess
          : displayedOasisStatus === "SHARED_SUCCESS"
            ? styles.sharedSuccess
            : ""
      } ${scenePreviewReducedMotion ? styles.reducedMotion : ""}`}
      style={
        {
          ...oasisPageStyle,
          "--stage-action-height": `${bottomCTAHeight}px`,
        } as CSSProperties
      }
    >
      <span className={styles.textureVeil} aria-hidden="true" />
      <span className={styles.statusLight} aria-hidden="true" />

      <header className={styles.header}>
        <button
          type="button"
          className={styles.homeButton}
          aria-label="참여 중인 오아시스 목록으로 이동"
          onClick={() => navigate("/")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m4 11 8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z" />
          </svg>
        </button>

        <div className={styles.headerCopy}>
          <h1 className={styles.title}>{room.name}</h1>
          <div className={styles.subtitleRow}>
            <p className={styles.subtitle}>우리들의 오아시스</p>
            {memberId && (
              <button
                type="button"
                className={styles.leaveButton}
                onClick={() => setLeaveDialogOpen(true)}
                disabled={isLeaving}
                aria-label="이 오아시스에서 나가기"
              >
                나가기
              </button>
            )}
          </div>
        </div>

        <span
          className={styles.dayBadge}
          aria-label={`챌린지 ${daysLeft}일 남음`}
        >
          D-{daysLeft}
        </span>
      </header>

      <section className={styles.progressStatus} aria-live="polite">
        <div
          key={`${progressMessage.headline}-${progressMessage.detail ?? ""}`}
          className={styles.progressStatusContent}
        >
          <span className={styles.progressMark} aria-hidden="true">
            {displayedOasisStatus === "PERFECT_SUCCESS"
              ? "✦"
              : displayedOasisStatus === "SHARED_SUCCESS"
                ? "✓"
                : "💧"}
          </span>
          <span className={styles.progressCopy}>
            <strong>{progressMessage.headline}</strong>
            {progressMessage.detail && <small>{progressMessage.detail}</small>}
          </span>
        </div>
      </section>

      {oasisError && (
        <div className={styles.inlineError}>
          <InlineError message={oasisError} />
        </div>
      )}

      <main className={styles.visualSection} aria-label="오늘의 공유 오아시스">
        <OasisScene
          snapshot={displayedSceneSnapshot}
          event={sceneController.activeEvent}
          phase={sceneController.phase}
          impactIndex={sceneController.impactIndex}
          announcement={sceneController.announcement}
          reducedMotion={effectiveReducedMotion}
          isAnimating={sceneController.isAnimating}
          isInteractionDisabled={
            isScenePreview ||
            isLoggingWater ||
            undoWindow !== null ||
            wakeUpStatus === "sending"
          }
          onWakeUpMember={isScenePreview ? undefined : handleWakeUpMember}
          showWakeUpHint={
            !isScenePreview && !wakeUpHintLearned && hasWakeUpTarget
          }
          onTravelComplete={sceneController.completeTravel}
          onImpactComplete={sceneController.completeImpact}
        />
      </main>

      <nav
        ref={bottomCTARef}
        className={styles.actionDock}
        aria-label="오아시스 메뉴"
      >
        <div className={styles.secondaryActionSlot}>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => setShowDayResult(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
              <path d="m8 14 2.5 2.5L16 11" />
            </svg>
            <span>오늘 기록</span>
          </button>
        </div>

        <WaterLogButton
          hydration={oasisState.myHydration}
          isVisualFeedbackPlaying={sceneController.isAnimating}
        />

        <div className={styles.secondaryActionSlot}>
          {canInvite ? (
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => void handleInvite()}
              disabled={inviteStatus === "copying"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19c.5-4 2.4-6 5.5-6s5 2 5.5 6M18 7v6M15 10h6" />
              </svg>
              <span>{inviteLabel}</span>
            </button>
          ) : (
            <span
              className={styles.secondaryActionPlaceholder}
              aria-hidden="true"
            />
          )}
        </div>
      </nav>

      <Toast
        position="bottom"
        open={inviteStatus === "copied" || inviteStatus === "error"}
        text={
          inviteStatus === "error"
            ? "링크를 복사하지 못했어요"
            : "초대 링크를 복사했어요"
        }
        duration={2500}
        onClose={() => setInviteStatus("idle")}
        aria-live="polite"
        style={{ bottom: `${bottomCTAHeight + 8}px` }}
      />

      <Toast
        position="bottom"
        open={
          wakeUpStatus === "shared" ||
          wakeUpStatus === "copied" ||
          wakeUpStatus === "failed"
        }
        text={
          wakeUpStatus === "failed"
            ? "깨우기 메시지를 보내지 못했어요"
            : wakeUpStatus === "copied"
              ? "깨우기 메시지를 복사했어요"
              : "친구에게 깨우기 메시지를 보냈어요"
        }
        duration={2500}
        onClose={() => setWakeUpStatus("idle")}
        aria-live="polite"
        style={{ bottom: `${bottomCTAHeight + 8}px` }}
      />

      <Toast
        position="bottom"
        open={celebrateMemberName !== null}
        text={
          celebrateMemberName
            ? `${celebrateMemberName}님은 오늘 물방울을 모두 채웠어요`
            : ""
        }
        duration={2000}
        onClose={() => setCelebrateMemberName(null)}
        aria-live="polite"
        style={{ bottom: `${bottomCTAHeight + 8}px` }}
      />

      <UndoBanner bottomOffset={bottomCTAHeight} />

      <DayResultModal
        open={showDayResult}
        oasisState={oasisState}
        onClose={() => setShowDayResult(false)}
        onViewHistory={handleViewHistory}
      />

      <ConfirmDialog
        open={leaveDialogOpen}
        title={
          <ConfirmDialog.Title>이 오아시스에서 나갈까요?</ConfirmDialog.Title>
        }
        description={
          <ConfirmDialog.Description>
            오늘 내가 만든 물방울은 오아시스에서 빠지고, 다시 들어오려면 초대가
            필요해요.
          </ConfirmDialog.Description>
        }
        cancelButton={
          <ConfirmDialog.CancelButton
            onClick={() => setLeaveDialogOpen(false)}
            disabled={isLeaving}
          >
            머무르기
          </ConfirmDialog.CancelButton>
        }
        confirmButton={
          <ConfirmDialog.ConfirmButton
            color="danger"
            loading={isLeaving}
            onClick={() => void handleConfirmLeave()}
          >
            나가기
          </ConfirmDialog.ConfirmButton>
        }
        onClose={() => {
          if (!isLeaving) setLeaveDialogOpen(false);
        }}
        closeOnDimmerClick={!isLeaving}
      />

      {/* {import.meta.env.DEV && (
        <OasisDebugPanel
          actualPercent={sharedProgressPercent}
          previewPercent={scenePreviewPercent}
          reducedMotion={scenePreviewReducedMotion}
          memberCount={targetSceneSnapshot.members.length}
          onPreviewPercentChange={setScenePreviewPercent}
          onMemberCountChange={handlePreviewMemberCountChange}
          onPreviewMemberProgression={handlePreviewMemberProgression}
          onSimulateContribution={handlePreviewContribution}
          onSimulateParticipation={handlePreviewParticipation}
          onSimulateThreshold={handlePreviewThreshold}
          onReducedMotionChange={setScenePreviewReducedMotion}
          onExitPreview={exitScenePreview}
        />
      )} */}
    </ScreenContainer>
  );
}
