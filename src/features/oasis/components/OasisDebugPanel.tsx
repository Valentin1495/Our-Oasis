import styles from "./OasisDebugPanel.module.css";

const PRESET_PERCENTS = [0, 1, 24, 25, 49, 50, 74, 75, 99, 100] as const;

interface Props {
  actualPercent: number;
  previewPercent: number | null;
  reducedMotion: boolean;
  memberCount: number;
  onPreviewPercentChange: (percent: number) => void;
  onMemberCountChange: (count: number) => void;
  onPreviewMemberProgression: () => void;
  onSimulateContribution: (origin: "local" | "remote", drops: number) => void;
  onSimulateParticipation: () => void;
  onSimulateThreshold: (threshold: 75 | 100) => void;
  onReducedMotionChange: (reducedMotion: boolean) => void;
  onExitPreview: () => void;
}

export function OasisDebugPanel({
  actualPercent,
  previewPercent,
  reducedMotion,
  memberCount,
  onPreviewPercentChange,
  onMemberCountChange,
  onPreviewMemberProgression,
  onSimulateContribution,
  onSimulateParticipation,
  onSimulateThreshold,
  onReducedMotionChange,
  onExitPreview,
}: Props) {
  if (!import.meta.env.DEV) return null;

  const displayedPercent = previewPercent ?? actualPercent;
  const isPreviewing = previewPercent !== null || reducedMotion;

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        장면 미리보기 · {Math.round(displayedPercent)}%
      </summary>

      <div className={styles.content}>
        <p className={styles.description}>
          화면만 바뀌며 실제 기록과 실시간 상태에는 영향을 주지 않아요.
        </p>

        <label className={styles.rangeLabel} htmlFor="oasis-preview-percent">
          <span>달성률</span>
          <output htmlFor="oasis-preview-percent">
            {Math.round(displayedPercent)}%
          </output>
        </label>
        <input
          id="oasis-preview-percent"
          className={styles.range}
          type="range"
          min="0"
          max="100"
          step="1"
          value={displayedPercent}
          onChange={(event) =>
            onPreviewPercentChange(Number(event.currentTarget.value))
          }
        />

        <div className={styles.presets} aria-label="달성률 경계값 프리셋">
          {PRESET_PERCENTS.map((percent) => (
            <button
              key={percent}
              className={styles.presetButton}
              type="button"
              aria-pressed={previewPercent === percent}
              onClick={() => onPreviewPercentChange(percent)}
            >
              {percent}
            </button>
          ))}
        </div>

        <label className={styles.rangeLabel} htmlFor="oasis-preview-members">
          <span>미리보기 멤버</span>
          <output htmlFor="oasis-preview-members">{memberCount}명</output>
        </label>
        <input
          id="oasis-preview-members"
          className={styles.range}
          type="range"
          min="1"
          max="5"
          step="1"
          value={memberCount}
          onChange={(event) =>
            onMemberCountChange(Number(event.currentTarget.value))
          }
        />

        <button
          className={styles.comparisonButton}
          type="button"
          onClick={onPreviewMemberProgression}
        >
          멤버 0~4 비교
        </button>

        <fieldset className={styles.eventGroup}>
          <legend>이벤트 시뮬레이션</legend>
          <button
            type="button"
            onClick={() => onSimulateContribution("local", 1)}
          >
            내 물 +1
          </button>
          <button
            type="button"
            onClick={() => onSimulateContribution("remote", 1)}
          >
            친구 +1
          </button>
          <button
            type="button"
            onClick={() => onSimulateContribution("remote", 3)}
          >
            친구 +3
          </button>
          <button type="button" onClick={onSimulateParticipation}>
            참여만
          </button>
        </fieldset>

        <div className={styles.thresholdButtons}>
          <button type="button" onClick={() => onSimulateThreshold(75)}>
            75% 통과
          </button>
          <button type="button" onClick={() => onSimulateThreshold(100)}>
            100% 통과
          </button>
        </div>

        <label className={styles.option}>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) =>
              onReducedMotionChange(event.currentTarget.checked)
            }
          />
          reduced motion 미리보기
        </label>

        <button
          className={styles.exitButton}
          type="button"
          disabled={!isPreviewing}
          onClick={onExitPreview}
        >
          실제 현재 상태로 복귀
        </button>
      </div>
    </details>
  );
}
