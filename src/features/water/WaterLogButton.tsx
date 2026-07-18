import { useEffect, useState } from "react";
import { useOasisStore } from "../../lib/store/useOasisStore";
import type { DailyHydration } from "../../types";

interface Props {
  hydration: DailyHydration | null;
}

const DROP_ORDINALS = ["첫", "두", "세", "네"] as const;

function formatMl(value: number): string {
  return `${value.toLocaleString("ko-KR")}ml`;
}

export function WaterLogButton({ hydration }: Props) {
  const {
    logWaterCup,
    isLoggingWater,
    waterLogFeedback,
    dropAnimationTick,
    personalRecordAnimationTick,
  } = useOasisStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTick = dropAnimationTick + personalRecordAnimationTick;

  useEffect(() => {
    if (!waterLogFeedback || feedbackTick === 0) return;
    setShowFeedback(true);
    const timerId = setTimeout(() => setShowFeedback(false), 4000);
    return () => clearTimeout(timerId);
  }, [feedbackTick, waterLogFeedback]);

  const drops = hydration?.contributionDrops ?? 0;
  const isContributionComplete = drops >= 4;
  const consumedMl = hydration?.consumedMl ?? 0;
  const goalMl = hydration?.goalMl ?? 0;
  const goalComplete = goalMl > 0 && consumedMl >= goalMl;

  const feedbackMessage = waterLogFeedback
    ? waterLogFeedback.kind === "contribution"
      ? `${DROP_ORDINALS[Math.min(3, waterLogFeedback.contributionDropsTotal - 1)] ?? waterLogFeedback.contributionDropsTotal} 번째 물방울을 보탰어요`
      : waterLogFeedback.contributionDropsTotal >= 4
        ? "개인 기록에 추가했어요 · 오늘은 물방울 4개를 모두 보탰어요!"
        : "물 한 컵을 기록했어요 · 개인 기록에 추가했어요"
    : null;

  return (
    <div>
      {(hydration || (showFeedback && feedbackMessage)) && (
        <div
          style={{
            marginBottom: "8px",
            minHeight: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {showFeedback && feedbackMessage ? (
            <div
              key={feedbackTick}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                gap: "5px",
                color: "var(--oasis-mint-500)",
                fontSize: "13px",
                fontWeight: 700,
                lineHeight: 1.4,
                animation: "fade-in 0.2s ease",
              }}
            >
              <span aria-hidden="true">
                {waterLogFeedback?.kind === "personal" ? "✓" : "💧"}
              </span>
              <div>
                <div>{feedbackMessage}</div>
                {waterLogFeedback?.warning && (
                  <div
                    style={{
                      marginTop: "2px",
                      color: "var(--color-label-alternative)",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {waterLogFeedback.warning}
                  </div>
                )}
              </div>
            </div>
          ) : (
            hydration && (
              <div
                aria-label={`공동 기여 ${drops}/4${isContributionComplete ? " 완료" : ""}, 오늘 ${formatMl(consumedMl)}${goalMl > 0 ? ` / 목표 ${formatMl(goalMl)}` : ""}${goalComplete ? " 완료" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  color: "var(--color-label-assistive)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    color: isContributionComplete
                      ? "var(--oasis-mint-500)"
                      : undefined,
                    fontWeight: isContributionComplete ? 700 : 500,
                  }}
                >
                  공동 기여 {drops}/4
                  {isContributionComplete && " ✓"}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  style={{
                    color: goalComplete
                      ? "var(--oasis-mint-500)"
                      : undefined,
                    fontWeight: goalComplete ? 700 : 500,
                  }}
                >
                  오늘 {formatMl(consumedMl)}
                  {goalMl > 0 && ` / ${formatMl(goalMl)}`}
                  {goalComplete && " ✓"}
                </span>
              </div>
            )
          )}
        </div>
      )}

      <button
        type="button"
        onClick={logWaterCup}
        disabled={isLoggingWater}
        aria-label={
          isContributionComplete
            ? "물 섭취를 개인 기록에 추가하기, 오늘 공동 기여 4개 완료"
            : `물 한 컵 기록하기, 오늘 공동 기여 ${drops}/4`
        }
        style={{
          width: "100%",
          padding: "18px",
          backgroundColor: isLoggingWater
            ? "var(--oasis-mint-300)"
            : "var(--oasis-mint-500)",
          color: "#fff",
          fontSize: "17px",
          fontWeight: 700,
          border: "none",
          borderRadius: "14px",
          cursor: isLoggingWater ? "wait" : "pointer",
          transition: "background-color 0.15s ease, transform 0.1s ease",
          letterSpacing: "-0.01em",
        }}
      >
        {isLoggingWater
          ? "기록 중..."
          : isContributionComplete
            ? "💧 물 섭취 기록하기"
            : "💧 물 한 컵 마셨어요"}
      </button>
    </div>
  );
}
