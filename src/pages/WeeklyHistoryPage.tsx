import { useEffect } from "react";
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
} from "../features/oasis";

export function WeeklyHistoryPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { oasisState, isLoadingOasis, oasisError, loadOasisState } =
    useOasisStore();

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
  const {
    completedDays,
    fullCompleteDays,
    allParticipatedDays,
    isWeeklyGoalComplete,
    areAllSevenDaysComplete,
  } = getWeeklyProgress(history);

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
          aria-label="오아시스 메인으로 돌아가기"
        >
          메인으로 돌아가기
        </button>
      </div>
    </ScreenContainer>
  );
}
