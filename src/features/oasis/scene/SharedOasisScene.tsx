import { type CSSProperties } from "react";
import { deriveOasisSceneModel } from "./oasisSceneModel";
import styles from "./SharedOasisScene.module.css";

interface Props {
  percent: number;
  dropAnimationTick: number;
  reducedMotion?: boolean;
}

const PHASE_LABELS = {
  dry: "작은 물웅덩이가 물을 기다리는 오아시스",
  "first-life": "작은 연못에 친구들의 물이 모이고 있어요",
  growing: "연못 가장자리에 작은 잎이 자랐어요",
  thriving: "연못과 잎이 함께 자라고 있어요",
  "community-success": "꽃봉오리가 자라는 완성된 오아시스",
  perfect: "꽃이 활짝 핀 완벽한 오아시스",
} as const;

export function SharedOasisScene({
  percent,
  dropAnimationTick,
  reducedMotion = false,
}: Props) {
  const model = deriveOasisSceneModel(percent);
  const pondScale = 0.2 + model.waterLevel * 0.8;

  return (
    <div
      className={`${styles.scene} ${reducedMotion ? styles.reducedMotion : ""}`}
      data-success={model.isCommunitySuccess}
      data-perfect={model.isPerfect}
      role="img"
      aria-label={`${PHASE_LABELS[model.phase]}, 공동 달성률 ${Math.round(model.percent)}%`}
    >
      <svg
        className={styles.svg}
        viewBox="0 0 300 194"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M20 104 C22 65 56 36 101 31 C140 18 194 29 229 53 C261 75 274 110 257 141 C239 170 198 181 158 176 C116 184 68 169 40 143 C25 131 18 117 20 104Z"
          fill="#e8d5b6"
          opacity="0.86"
        />

        <g
          className={styles.pondGrowth}
          style={
            {
              "--pond-scale": pondScale,
              opacity: 1,
            } as CSSProperties
          }
        >
          <path
            d="M42 102 C45 75 69 53 104 48 C134 37 174 43 202 58 C229 72 242 95 234 119 C226 143 198 157 166 155 C133 163 96 154 69 139 C51 129 39 115 42 102Z"
            fill="#77c9c3"
          />

          {model.percent >= 50 && (
            <path
              className={styles.deepWater}
              d="M80 104 C84 87 102 74 126 70 C148 64 177 70 194 82 C209 93 213 108 204 120 C193 134 170 139 148 136 C125 142 99 136 86 124 C79 118 77 110 80 104Z"
              fill="#4ab3af"
              opacity={0.16 + model.waterLevel * 0.14}
            />
          )}
        </g>

        <path
          d="M197 126 C205 115 223 112 236 120 C247 127 247 141 236 149 C224 158 203 155 195 145 C190 139 192 132 197 126Z"
          fill="#e8d5b6"
        />

        {model.edgePlantLevel > 0 && (
          <EdgePlant
            level={model.edgePlantLevel === 2 ? 2 : 1}
            bloomState={model.bloomState}
            bloomProgress={model.bloomProgress}
          />
        )}

        {model.isPerfect && (
          <g className={styles.perfectReveal}>
            <g
              fill="none"
              stroke="#bde9e3"
              strokeWidth="2.25"
              strokeLinecap="round"
              opacity="0.95"
            >
              <path d="M91 115 Q107 106 123 115" />
            </g>
            <g fill="#f2b985">
              <Sparkle x={55} y={70} size={4.5} />
              <Sparkle x={239} y={79} size={3.8} />
            </g>
          </g>
        )}

        {dropAnimationTick > 0 && (
          <g key={dropAnimationTick}>
            <g className={styles.dropFall}>
              <path
              d="M104 8 Q96 22 104 30 Q112 22 104 8Z"
                fill="#4ab3af"
              />
            </g>
            <ellipse
              className={styles.impactRipple}
              cx="104"
              cy="105"
              rx="6"
              ry="3"
              fill="none"
              stroke="#d8f4ed"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      <p className={styles.percentLabel} aria-hidden="true">
        오늘의 오아시스 · {Math.round(model.percent)}%
      </p>
    </div>
  );
}

function EdgePlant({
  level,
  bloomState,
  bloomProgress,
}: {
  level: 1 | 2;
  bloomState: "none" | "bud" | "flower";
  bloomProgress: number;
}) {
  return (
    <g className={styles.plantReveal}>
      <path
        d="M219 145 Q215 127 220 108"
        fill="none"
        stroke="#789d7b"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <ellipse
        cx="210"
        cy="129"
        rx="10"
        ry="5"
        fill="#88a986"
        transform="rotate(28 210 129)"
      />
      <ellipse
        cx="226"
        cy="120"
        rx="10"
        ry="5"
        fill="#789d7b"
        transform="rotate(-30 226 120)"
      />

      {level >= 2 && (
        <>
          <path
            d="M214 141 Q201 132 196 119"
            fill="none"
            stroke="#86a684"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <ellipse
            cx="196"
            cy="119"
            rx="8"
            ry="4"
            fill="#94b08f"
            transform="rotate(36 196 119)"
          />
        </>
      )}

      {bloomState === "bud" && (
        <g
          className={styles.budGrowth}
          style={
            {
              "--bud-scale": bloomProgress,
            } as CSSProperties
          }
        >
          <path
            d="M212 108 Q220 93 228 108 Q225 116 220 117 Q215 116 212 108Z"
            fill="#e99079"
          />
        </g>
      )}

      {bloomState === "flower" && <Flower />}
    </g>
  );
}

function Flower() {
  return (
    <g transform="translate(220 105)">
      <g className={styles.flowerReveal}>
        <ellipse cx="-7" cy="0" rx="7" ry="6" fill="#e99079" />
        <ellipse cx="7" cy="0" rx="7" ry="6" fill="#e99079" />
        <ellipse cx="0" cy="-7" rx="6" ry="7" fill="#efa087" />
        <ellipse cx="0" cy="7" rx="6" ry="7" fill="#e78873" />
        <circle r="4" fill="#f2b985" />
      </g>
    </g>
  );
}

function Sparkle({
  x,
  y,
  size,
}: {
  x: number;
  y: number;
  size: number;
}) {
  const inner = size * 0.32;
  return (
    <path
      d={`M${x} ${y - size} L${x + inner} ${y - inner} L${x + size} ${y} L${x + inner} ${y + inner} L${x} ${y + size} L${x - inner} ${y + inner} L${x - size} ${y} L${x - inner} ${y - inner}Z`}
    />
  );
}
