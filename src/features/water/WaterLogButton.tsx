import { useOasisStore } from "../../lib/store/useOasisStore";
import type { DailyHydration } from "../../types";
import { isWaterActionLocked } from "./waterLock";
import { shouldShowWaterSummary } from "./waterSummary";
import styles from "./WaterLogButton.module.css";

interface Props {
  hydration: DailyHydration | null;
  isVisualFeedbackPlaying?: boolean;
}

function formatMl(value: number): string {
  return `${value.toLocaleString("ko-KR")}ml`;
}

export function WaterLogButton({
  hydration,
  isVisualFeedbackPlaying = false,
}: Props) {
  const { logWaterCup, isLoggingWater, undoWindow } = useOasisStore();

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
  const showSummary = shouldShowWaterSummary(hydration, undoWindow !== null);

  return (
    <div className={styles.container}>
      {hydration && showSummary && (
        <div className={styles.status}>
          <div
            className={styles.summary}
            aria-label={`공동 기여 ${drops}/4${isContributionComplete ? " 완료" : ""}, 오늘 ${formatMl(consumedMl)}${goalMl > 0 ? ` / 목표 ${formatMl(goalMl)}` : ""}${goalComplete ? " 완료" : ""}`}
          >
            <span className={styles.summaryItem}>
              <span className={styles.summaryLabel}>공동 기여</span>
              <strong
                className={
                  isContributionComplete
                    ? styles.summaryComplete
                    : styles.summaryValue
                }
              >
                {drops}/4{isContributionComplete && " ✓"}
              </strong>
            </span>
            <span className={styles.summaryDivider} aria-hidden="true" />
            <span className={styles.summaryItem}>
              <span className={styles.summaryLabel}>오늘</span>
              <strong
                className={
                  goalComplete ? styles.summaryComplete : styles.summaryValue
                }
              >
                {formatMl(consumedMl)}
                {goalComplete && " ✓"}
              </strong>
              {goalMl > 0 && (
                <span className={styles.summaryGoal}>/ {formatMl(goalMl)}</span>
              )}
            </span>
          </div>
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
