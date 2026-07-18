import { AnimalLayer } from "./layers/AnimalLayer";
import { CelebrationLayer } from "./layers/CelebrationLayer";
import { DesertLayer } from "./layers/DesertLayer";
import { SkyLayer } from "./layers/SkyLayer";
import { VegetationLayer } from "./layers/VegetationLayer";
import { WaterLayer } from "./layers/WaterLayer";
import {
  deriveOasisSceneModel,
  type OasisPhase,
} from "./oasisSceneModel";
import styles from "./PrototypeOasisScene.module.css";

interface Props {
  percent: number;
  dropAnimationTick: number;
  reducedMotion?: boolean;
  showSpecialCharacter?: boolean;
  showFinalReward?: boolean;
}

const PHASE_LABELS: Record<OasisPhase, string> = {
  dry: "메마른 사막",
  "first-life": "첫 생명이 깨어났어요",
  growing: "오아시스가 자라고 있어요",
  thriving: "생명력이 가득 차고 있어요",
  "community-success": "오늘의 오아시스가 살아났어요",
  perfect: "완벽한 오아시스",
};

export function PrototypeOasisScene({
  percent,
  dropAnimationTick,
  reducedMotion = false,
  showSpecialCharacter = false,
  showFinalReward = false,
}: Props) {
  const model = deriveOasisSceneModel(percent);
  const phaseLabel = PHASE_LABELS[model.phase];

  return (
    <div
      className={`${styles.scene} ${reducedMotion ? styles.reducedMotion : ""}`}
      data-success={model.isCommunitySuccess}
      data-perfect={model.isPerfect}
      role="img"
      aria-label={`오아시스 현재 상태: ${phaseLabel}, 공동 달성률 ${Math.round(model.percent)}%${showSpecialCharacter ? ", 특별 캐릭터가 함께 있어요" : ""}`}
    >
      <div className={styles.sceneFrame}>
        <svg
          viewBox="0 0 320 240"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.svg}
          aria-hidden="true"
        >
          <SkyLayer model={model} />
          <DesertLayer model={model} />
          <WaterLayer
            model={model}
            dropAnimationTick={dropAnimationTick}
          />
          <VegetationLayer model={model} />
          <AnimalLayer
            model={model}
            showSpecialCharacter={showSpecialCharacter}
          />
          <CelebrationLayer
            model={model}
            showFinalReward={showFinalReward}
          />
        </svg>
      </div>

      <p className={styles.stageLabel} aria-hidden="true">
        {phaseLabel}
      </p>
    </div>
  );
}

