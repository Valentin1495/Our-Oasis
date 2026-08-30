import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Top, ProgressBar } from "@toss/tds-mobile";
import {
  EmptyState,
  InlineError,
  LoadingView,
  ScreenContainer,
} from "../components";
import { useOasisStore } from "../lib/store/useOasisStore";
import {
  WEEKLY_OASIS_TARGET_DAYS,
  getWeeklyProgress,
  shareOasisResult,
  type ResultShareOutcome,
} from "../features/oasis";
import { trackOasisEvent } from "../lib/analytics/oasisAnalytics";

export function WeeklyHistoryPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { oasisState, isLoadingOasis, oasisError, loadOasisState } =
    useOasisStore();
  const [shareStatus, setShareStatus] = useState<
    "idle" | "sharing" | ResultShareOutcome
  >("idle");

  useEffect(() => {
    if (!roomId) return;
    void loadOasisState(roomId);
  }, [roomId, loadOasisState]);

  if (!roomId) return null;

  if (isLoadingOasis && !oasisState) {
    return <LoadingView label="7일 기록을 불러오는 중..." />;
  }

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
        <EmptyState title="기록을 불러올 수 없어요" />
      </ScreenContainer>
    );
  }

  const { history, room } = oasisState;
  const roomMemberCount = oasisState.members.length;
  const {
    completedDays,
    fullCompleteDays,
    allParticipatedDays,
    isWeeklyGoalComplete,
    areAllSevenDaysComplete,
  } = getWeeklyProgress(history);
  const weeklyResultGrade = areAllSevenDaysComplete
    ? "seven_day_perfect"
    : "weekly_success";
  const weeklyShareLabel = areAllSevenDaysComplete
    ? "7일 완성 기록 자랑하기"
    : "함께 키운 기록 자랑하기";
  const shareFeedback =
    shareStatus === "shared"
      ? "공유 화면을 열었어요."
      : shareStatus === "copied"
        ? "결과 메시지를 복사했어요."
        : shareStatus === "failed"
          ? "공유하지 못했어요. 다시 시도해 주세요."
          : null;

  async function handleShareWeeklyResult() {
    if (!isWeeklyGoalComplete || shareStatus === "sharing") return;
    setShareStatus("sharing");
    const outcome = await shareOasisResult({
      kind: weeklyResultGrade,
      roomId: room.id,
      roomName: room.name,
      completedDays,
      perfectDays: fullCompleteDays,
      allParticipatedDays,
    });
    setShareStatus(outcome);

    if (outcome !== "failed") {
      trackOasisEvent("weekly_result_shared", {
        result_grade: weeklyResultGrade,
        share_method: outcome === "shared" ? "native_share" : "clipboard",
        completed_days: completedDays,
        perfect_days: fullCompleteDays,
        all_participated_days: allParticipatedDays,
        room_member_count: roomMemberCount,
      });
    }
  }

  return (
    <ScreenContainer>
      <Top
        title={<Top.TitleParagraph size={22}>7일 기록</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>{room.name}</Top.SubtitleParagraph>
        }
        upperGap={16}
        lowerGap={24}
      />

      <div style={{ padding: "0 20px 16px" }}>
        <div
          style={{
            padding: "16px",
            borderRadius: "14px",
            backgroundColor: isWeeklyGoalComplete
              ? "var(--oasis-mint-100)"
              : "var(--color-surface)",
            border: `1px solid ${isWeeklyGoalComplete ? "var(--oasis-mint-300)" : "var(--color-border)"}`,
          }}
          aria-label={`주간 공동 목표 ${completedDays}일 완성, 목표 ${WEEKLY_OASIS_TARGET_DAYS}일`}
        >
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--color-label-normal)",
            }}
          >
            {areAllSevenDaysComplete
              ? "✨ 7일 모두 오아시스를 완성했어요"
              : isWeeklyGoalComplete
                ? "🎉 5일 공동 목표를 달성했어요"
                : `이번 주 공동 목표 ${completedDays}/${WEEKLY_OASIS_TARGET_DAYS}일`}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "13px",
              color: "var(--color-label-assistive)",
            }}
          >
            하루 물방울을 75% 이상 채우면 1일 완성이에요.
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: "13px",
              color: "var(--color-label-alternative)",
            }}
          >
            100% 완벽 달성 {fullCompleteDays}일 · 전원 참여{" "}
            {allParticipatedDays}일
          </p>
        </div>
        {isWeeklyGoalComplete && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => void handleShareWeeklyResult()}
              disabled={shareStatus === "sharing"}
              aria-label={weeklyShareLabel}
              style={{
                width: "100%",
                minHeight: "52px",
                padding: "14px 16px",
                border: 0,
                borderRadius: "14px",
                backgroundColor: areAllSevenDaysComplete
                  ? "var(--oasis-perfect-500)"
                  : "var(--oasis-mint-700)",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: shareStatus === "sharing" ? "default" : "pointer",
                opacity: shareStatus === "sharing" ? 0.65 : 1,
              }}
            >
              {shareStatus === "sharing" ? "공유 준비 중..." : weeklyShareLabel}
            </button>
            <span
              aria-live="polite"
              style={{
                minHeight: "20px",
                fontSize: "13px",
                lineHeight: "20px",
                color:
                  shareStatus === "failed"
                    ? "var(--color-status-negative, #e42939)"
                    : "var(--color-label-alternative)",
                textAlign: "center",
              }}
            >
              {shareFeedback}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {history.map((day) => {
          const isToday = day.dayIndex === room.dayIndex;
          const isPast = day.dayIndex < room.dayIndex;
          const isFuture = day.dayIndex > room.dayIndex;
          const isComplete = day.isComplete;

          return (
            <div
              key={day.dayIndex}
              style={{
                padding: "16px",
                backgroundColor: isToday
                  ? "var(--oasis-mint-100)"
                  : "var(--color-surface)",
                borderRadius: "12px",
                border: `1px solid ${isToday ? "var(--oasis-mint-300)" : "var(--color-border)"}`,
                opacity: isFuture ? 0.5 : 1,
              }}
              aria-label={`${day.dayIndex}일차, 달성률 ${day.completionPercent}%${isComplete ? ", 오아시스 완성" : ""}${day.isFullComplete ? ", 최고 등급" : ""}${day.allParticipated ? ", 전원 참여" : ""}`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-label-normal)",
                  }}
                >
                  {day.dayIndex}일차
                  {isToday && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "11px",
                        color: "var(--oasis-mint-500)",
                      }}
                    >
                      오늘
                    </span>
                  )}
                  {!isFuture && isComplete && (
                    <span
                      style={{
                        marginLeft: "6px",
                        fontSize: "11px",
                        color: "var(--oasis-mint-500)",
                      }}
                    >
                      완성
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color:
                      isPast || isToday
                        ? "var(--oasis-mint-500)"
                        : "var(--color-label-assistive)",
                  }}
                >
                  {isFuture ? "-" : `${day.completionPercent}%`}
                </span>
              </div>
              {!isFuture && (
                <>
                  <ProgressBar
                    progress={day.completionPercent / 100}
                    size="normal"
                  />
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "12px",
                      color: "var(--color-label-assistive)",
                    }}
                  >
                    물방울 {day.totalDrops}개
                    {day.isFullComplete && " · 100% 완벽 달성"}
                    {day.allParticipated && " · 전원 참여"}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "24px 20px" }}>
        <button
          type="button"
          onClick={() => navigate(`/oasis/${roomId}`)}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: "var(--oasis-mint-500)",
            color: "#fff",
            fontSize: "17px",
            fontWeight: 700,
            border: "none",
            borderRadius: "14px",
            cursor: "pointer",
          }}
          aria-label="오아시스로 돌아가기"
        >
          돌아가기
        </button>
      </div>
    </ScreenContainer>
  );
}
