import type { OasisSceneVariant } from "./OasisScene";
import styles from "./OasisDebugPanel.module.css";

const PRESET_PERCENTS = [0, 1, 24, 25, 49, 50, 74, 75, 99, 100] as const;

interface Props {
  actualPercent: number;
  previewPercent: number | null;
  reducedMotion: boolean;
  sceneVariant: OasisSceneVariant;
  onPreviewPercentChange: (percent: number) => void;
  onReducedMotionChange: (reducedMotion: boolean) => void;
  onSceneVariantChange: (variant: OasisSceneVariant) => void;
  onExitPreview: () => void;
}

export function OasisDebugPanel({
  actualPercent,
  previewPercent,
  reducedMotion,
  sceneVariant,
  onPreviewPercentChange,
  onReducedMotionChange,
  onSceneVariantChange,
  onExitPreview,
}: Props) {
  if (!import.meta.env.DEV) return null;

  const displayedPercent = previewPercent ?? actualPercent;
  const isPreviewing =
    previewPercent !== null ||
    reducedMotion ||
    sceneVariant !== "prototype";

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

        <fieldset className={styles.variantGroup}>
          <legend>장면 버전</legend>
          <label>
            <input
              type="radio"
              name="oasis-scene-variant"
              value="prototype"
              checked={sceneVariant === "prototype"}
              onChange={() => onSceneVariantChange("prototype")}
            />
            프로토타입
          </label>
          <label>
            <input
              type="radio"
              name="oasis-scene-variant"
              value="legacy"
              checked={sceneVariant === "legacy"}
              onChange={() => onSceneVariantChange("legacy")}
            />
            기존 버전
          </label>
        </fieldset>

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
