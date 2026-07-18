import { useState } from "react";
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

  // 개발 환경 전용: redesigned / original 전환 토글
  const [showOriginal, setShowOriginal] = useState(false);

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
          {/* ── 개선된 일러스트 (기본) ── */}
          {!showOriginal && (
            <>
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
            </>
          )}

          {/* ── 기존 일러스트 (개발 환경 비교용) ── */}
          {showOriginal && import.meta.env.DEV && (
            <LegacyInlineLayers
              model={model}
              dropAnimationTick={dropAnimationTick}
              showSpecialCharacter={showSpecialCharacter}
              showFinalReward={showFinalReward}
            />
          )}
        </svg>
      </div>

      <p className={styles.stageLabel} aria-hidden="true">
        {phaseLabel}
      </p>

      {/* ── 개발 환경 전용: 비교 토글 ── */}
      {import.meta.env.DEV && (
        <div className={styles.devCompareToggle} role="group" aria-label="일러스트 비교">
          <button
            className={styles.devCompareButton}
            type="button"
            aria-pressed={!showOriginal}
            onClick={() => setShowOriginal(false)}
          >
            Redesigned
          </button>
          <button
            className={styles.devCompareButton}
            type="button"
            aria-pressed={showOriginal}
            onClick={() => setShowOriginal(true)}
          >
            Original
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   기존 일러스트 인라인 레이어 (개발 비교용, 운영 빌드에서는 트리셰이킹됨)
   deriveOasisSceneModel 결과에서 기존 로직을 재현한다.
────────────────────────────────────────────────────────────────────────── */
function LegacyInlineLayers({
  model,
  dropAnimationTick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSpecialCharacter: _showSpecialCharacter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showFinalReward: _showFinalReward,
}: {
  model: ReturnType<typeof deriveOasisSceneModel>;
  dropAnimationTick: number;
  showSpecialCharacter: boolean;
  showFinalReward: boolean;
}) {
  const wl = model.waterLevel;
  const waterRx = 42 + wl * 58;
  const waterRy = 5 + wl * 19;
  const waterColor =
    model.phase === "first-life"
      ? "#73c7c3"
      : model.isPerfect
        ? "#3ebfd0"
        : "#43c8c1";

  const SKY_COLORS: Record<string, string> = {
    dry: "#f7e5c2",
    "first-life": "#eff4df",
    growing: "#e8f5e8",
    thriving: "#e1f4ef",
    "community-success": "#ffefc7",
    perfect: "#fff3bd",
  };

  const sandColor = model.isCommunitySuccess ? "#d9be82" : "#ddb77d";
  const basinColor = model.hasWater ? "#a9875f" : "#b58e5d";

  return (
    <>
      {/* Sky */}
      <g>
        <rect width="320" height="240" rx="24" fill={SKY_COLORS[model.phase]} />
        {model.hasWarmLight && (
          <circle cx="258" cy="48" r={model.isPerfect ? 34 : 29} fill="#fff8d9" opacity="0.7" />
        )}
        <circle
          cx="258"
          cy="48"
          r={model.isPerfect ? 18 : 15}
          fill={model.isPerfect ? "#ffd45c" : model.hasWarmLight ? "#ffcf73" : "#f5d59a"}
        />
        {model.vegetationLevel >= 2 && (
          <>
            <g transform="translate(48 53) scale(1)" opacity="0.7">
              <ellipse cx="0" cy="5" rx="22" ry="8" fill="#ffffff" />
              <circle cx="-9" cy="1" r="9" fill="#ffffff" />
              <circle cx="7" cy="-2" r="12" fill="#ffffff" />
            </g>
            <g transform="translate(205 82) scale(0.72)" opacity="0.5">
              <ellipse cx="0" cy="5" rx="22" ry="8" fill="#ffffff" />
              <circle cx="-9" cy="1" r="9" fill="#ffffff" />
              <circle cx="7" cy="-2" r="12" fill="#ffffff" />
            </g>
          </>
        )}
      </g>
      {/* Desert */}
      <g>
        <path d="M0 151 Q55 128 112 148 T224 145 T320 150 V240 H0Z" fill="#e8ca94" />
        <path d="M0 181 Q66 158 128 180 T250 176 T320 174 V240 H0Z" fill={sandColor} />
        <ellipse cx="160" cy="201" rx="112" ry="31" fill={basinColor} />
        <ellipse cx="160" cy="198" rx="103" ry="25" fill="#c5a06d" />
        {!model.hasWater && (
          <g fill="none" stroke="#9d774c" strokeWidth="2" strokeLinecap="round" opacity="0.75">
            <path d="M126 193 l-13 -9 m13 9 l-7 11 m7 -11 l12 -5" />
            <path d="M188 203 l13 -10 m-13 10 l7 10 m-7 -10 l-13 -5" />
            <path d="M157 183 l4 9 10 3" />
          </g>
        )}
        <g fill="#a98052">
          <ellipse cx="35" cy="196" rx="8" ry="4" />
          <ellipse cx="287" cy="190" rx="10" ry="5" />
        </g>
      </g>
      {/* Water */}
      {model.hasWater && (
        <g>
          <ellipse cx="160" cy="198" rx={waterRx} ry={waterRy} fill={waterColor} />
          <ellipse cx="160" cy="195" rx={waterRx * 0.82} ry={Math.max(2.5, waterRy * 0.42)} fill="#85ddd7" opacity="0.6" />
          {model.percent >= 25 && (
            <g fill="none" stroke="#d8fffb" strokeWidth="2" strokeLinecap="round" opacity="0.75">
              <path d="M118 194 Q130 190 143 194" />
              <path d="M171 201 Q184 197 197 201" />
            </g>
          )}
          {model.isCommunitySuccess && (
            <ellipse cx="160" cy="198" rx={waterRx * 0.56} ry={Math.max(3, waterRy * 0.4)} fill="none" stroke="#effff8" strokeWidth="2" opacity="0.7" />
          )}
          {dropAnimationTick > 0 && (
            <g key={dropAnimationTick}>
              <path d="M160 62 Q151 80 160 91 Q169 80 160 62Z" fill="#3e8ef7" opacity="0.9" />
            </g>
          )}
        </g>
      )}
      {/* Label overlay for comparison */}
      <text x="160" y="24" textAnchor="middle" fontSize="10" fill="#888" fontFamily="sans-serif">
        Original
      </text>
    </>
  );
}
