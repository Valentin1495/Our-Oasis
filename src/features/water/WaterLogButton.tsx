import { useEffect, useState } from "react";
import { useOasisStore } from "../../lib/store/useOasisStore";
import type { DailyHydration } from "../../types";
import { isWaterActionLocked } from "./waterLock";
import styles from "./WaterLogButton.module.css";

interface Props {
  hydration: DailyHydration | null;
  isVisualFeedbackPlaying?: boolean;
}

const DROP_ORDINALS = ["첫", "두", "세", "네"] as const;

function formatMl(value: number): string {
  return `${value.toLocaleString("ko-KR")}ml`;
}

export function WaterLogButton({
  hydration,
  isVisualFeedbackPlaying = false,
}: Props) {
  const { logWaterCup, isLoggingWater, waterLogFeedback, waterLogFeedbackId } =
    useOasisStore();
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!waterLogFeedback || waterLogFeedbackId === 0) return;
    setShowFeedback(true);
    const timerId = setTimeout(() => setShowFeedback(false), 4000);
    return () => clearTimeout(timerId);
  }, [waterLogFeedbackId, waterLogFeedback]);

  const drops = hydration?.contributionDrops ?? 0;
  const isContributionComplete = drops >= 4;
  const consumedMl = hydration?.consumedMl ?? 0;
  const goalMl = hydration?.goalMl ?? 0;
  const goalComplete = goalMl > 0 && consumedMl >= goalMl;
  const isProcessing = isLoggingWater || isVisualFeedbackPlaying;
  const isButtonDisabled = isWaterActionLocked({
    isLoggingWater,
    isVisualFeedbackPlaying,
  });

  const feedbackMessage = waterLogFeedback
    ? waterLogFeedback.kind === "contribution"
      ? `${DROP_ORDINALS[Math.min(3, waterLogFeedback.contributionDropsTotal - 1)] ?? waterLogFeedback.contributionDropsTotal} 번째 물방울을 보탰어요`
      : waterLogFeedback.contributionDropsTotal >= 4
        ? "개인 기록에 추가했어요 · 오늘은 물방울 4개를 모두 보탰어요!"
        : "물 한 컵을 기록했어요 · 개인 기록에 추가했어요"
    : null;

  return (
    <div className={styles.container}>
      {(hydration || (showFeedback && feedbackMessage)) && (
        <div className={styles.status}>
          {showFeedback && feedbackMessage ? (
            <div
              key={waterLogFeedbackId}
              className={styles.feedback}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span aria-hidden="true">
                {waterLogFeedback?.kind === "personal" ? "✓" : "💧"}
              </span>
              <div>
                <div>{feedbackMessage}</div>
                {waterLogFeedback?.warning && (
                  <div className={styles.warning}>
                    {waterLogFeedback.warning}
                  </div>
                )}
              </div>
            </div>
          ) : (
            hydration && (
              <div
                className={styles.summary}
                aria-label={`공동 기여 ${drops}/4${isContributionComplete ? " 완료" : ""}, 오늘 ${formatMl(consumedMl)}${goalMl > 0 ? ` / 목표 ${formatMl(goalMl)}` : ""}${goalComplete ? " 완료" : ""}`}
              >
                <span
                  className={
                    isContributionComplete ? styles.summaryComplete : undefined
                  }
                >
                  공동 기여 {drops}/4
                  {isContributionComplete && " ✓"}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={goalComplete ? styles.summaryComplete : undefined}
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
        className={styles.springButton}
        onClick={logWaterCup}
        disabled={isButtonDisabled}
        aria-label={
          isProcessing
            ? "물 기록 처리 중"
            : isContributionComplete
              ? "물 섭취를 개인 기록에 추가하기, 오늘 공동 기여 4개 완료"
              : `공유 오아시스에 물 한 잔 채우기, 오늘 공동 기여 ${drops}/4`
        }
      >
        <span className={styles.springRim} aria-hidden="true">
          <span className={styles.springWater}>
            <svg viewBox="0 0 32 40">
              <path d="M16 1C12 8 4 17 4 25a12 12 0 0 0 24 0C28 17 20 8 16 1Z" />
              <path d="M10 27c1 4 4 6 8 6" />
            </svg>
          </span>
        </span>
        <span className={styles.buttonLabel}>
          {isProcessing
            ? "기록 중..."
            : isContributionComplete
              ? "물 한 잔 기록하기"
              : "물 한 잔 채우기"}
        </span>
      </button>
    </div>
  );
}
