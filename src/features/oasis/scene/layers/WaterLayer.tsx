import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
  dropAnimationTick: number;
}

/**
 * waterLevel: 0(없음) ~ 1(100%)
 * 웅덩이 중심: cx=160, cy≈200
 * 최소~최대 rx: 44~100, ry: 8~22
 */
export function WaterLayer({ model, dropAnimationTick }: Props) {
  if (!model.hasWater) return null;

  const wl = model.waterLevel; // 0.12 ~ 1.0
  const rx = 44 + wl * 56;    // 44 ~ 100
  const ry = 8 + wl * 14;     // 8 ~ 22

  // 물 색상 팔레트
  const waterMain =
    model.isPerfect
      ? "#33b8cc"
      : model.isCommunitySuccess
        ? "#3ec8be"
        : model.phase === "first-life"
          ? "#72ccc8"
          : "#43c8c0";

  const waterLight = model.isPerfect ? "#7de0ea" : "#88ddd8";

  return (
    <g aria-hidden="true">
      {/* === 물 본체 === */}
      <ellipse
        className={styles.waterShape}
        cx="160"
        cy="200"
        rx={rx}
        ry={ry}
        fill={waterMain}
      />

      {/* 물 표면 밝은 하이라이트 */}
      <ellipse
        className={styles.waterShape}
        cx="152"
        cy="196"
        rx={rx * 0.74}
        ry={Math.max(3, ry * 0.38)}
        fill={waterLight}
        opacity="0.55"
      />

      {/* 물결 라인 (25%+) */}
      {model.percent >= 25 && (
        <g
          fill="none"
          stroke="#d4fff8"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.65"
        >
          <path d="M120 197 Q134 193 148 197" />
          <path d="M170 203 Q185 199 200 203" />
        </g>
      )}

      {/* 내부 반짝임 타원 (75%+) */}
      {model.isCommunitySuccess && (
        <ellipse
          cx="160"
          cy="200"
          rx={rx * 0.52}
          ry={Math.max(3, ry * 0.38)}
          fill="none"
          stroke="#eafffa"
          strokeWidth="1.8"
          opacity="0.6"
        />
      )}

      {/* 완벽 달성 — 물 표면 반짝임 점 */}
      {model.isPerfect && (
        <>
          <circle cx="135" cy="198" r="2" fill="#ffffff" opacity="0.75" />
          <circle cx="182" cy="203" r="1.5" fill="#ffffff" opacity="0.6" />
          <circle cx="160" cy="195" r="1.5" fill="#ffffff" opacity="0.55" />
        </>
      )}

      {/* === 물방울 떨어지기 애니메이션 === */}
      {dropAnimationTick > 0 && (
        <g key={dropAnimationTick} className={styles.dropFall}>
          {/* 물방울 본체 */}
          <path
            d="M160 58 Q152 76 160 88 Q168 76 160 58Z"
            fill="#3e8ef7"
            opacity="0.9"
          />
          {/* 물방울 하이라이트 */}
          <ellipse
            cx="157"
            cy="72"
            rx="2.5"
            ry="5"
            fill="#88c8ff"
            opacity="0.6"
            transform="rotate(-12 157 72)"
          />
        </g>
      )}
    </g>
  );
}
