import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
}

/**
 * 누적 식생 레이어
 * level 1 → Sprout (새싹)
 * level 2 → GrassTufts + SmallBushes (풀과 관목)
 * level 3 → PalmTree 한 그루 (왼쪽) + 갈대
 * level 4 → PalmTree 두 그루 + 보조 관목 추가
 * level 5 → 양쪽 풀다발 추가 (완벽 달성)
 */
export function VegetationLayer({ model }: Props) {
  const level = model.vegetationLevel;

  return (
    <g aria-hidden="true">
      {/* Level 1 — 새싹 (웅덩이 왼쪽 가장자리) */}
      {level >= 1 && (
        <g className={styles.layerReveal}>
          <Sprout x={118} y={188} scale={level === 1 ? 1 : 0.82} />
        </g>
      )}

      {/* Level 2 — 풀 다발 + 작은 관목 */}
      {level >= 2 && (
        <g className={styles.layerReveal}>
          {/* 왼쪽 풀 */}
          <GrassTuft x={72} y={190} />
          {/* 오른쪽 풀 */}
          <GrassTuft x={252} y={188} flip />
          {/* 오른쪽 작은 관목 */}
          <RoundBush x={238} y={183} scale={0.7} />
          {/* 왼쪽 관목 (작게) */}
          <RoundBush x={84} y={187} scale={0.6} />
        </g>
      )}

      {/* Level 3 — 야자수 1그루 + 갈대 */}
      {level >= 3 && (
        <g className={styles.layerReveal}>
          <PalmTree x={80} y={180} scale={0.82} />
          <Reeds x={208} y={187} />
          <RoundBush x={265} y={180} scale={0.85} />
        </g>
      )}

      {/* Level 4 — 야자수 2그루 + 추가 관목 */}
      {level >= 4 && (
        <g className={styles.layerReveal}>
          <PalmTree x={252} y={181} scale={0.72} flip />
          <RoundBush x={104} y={186} scale={0.9} />
          <Reeds x={222} y={189} />
        </g>
      )}

      {/* Level 5 — 완벽 달성: 꽃이 핀 풀 추가 */}
      {level >= 5 && (
        <g className={styles.layerReveal}>
          <GrassTuft x={44} y={188} />
          <GrassTuft x={278} y={186} flip />
        </g>
      )}
    </g>
  );
}

/* ─────────────────────────── Sub-components ─────────────────────────── */

function Sprout({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* 줄기 */}
      <path
        d="M0 0 Q-1 -14 1 -26"
        fill="none"
        stroke="#3a8a50"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* 왼쪽 잎 */}
      <ellipse
        cx="-8"
        cy="-18"
        rx="10"
        ry="5.5"
        fill="#5cb86a"
        transform="rotate(30 -8 -18)"
      />
      {/* 오른쪽 잎 */}
      <ellipse
        cx="9"
        cy="-22"
        rx="10"
        ry="5.5"
        fill="#78cc82"
        transform="rotate(-26 9 -22)"
      />
      {/* 잎 하이라이트 */}
      <ellipse
        cx="10"
        cy="-24"
        rx="4"
        ry="2"
        fill="#9ee0a0"
        opacity="0.5"
        transform="rotate(-26 10 -24)"
      />
    </g>
  );
}

function GrassTuft({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const sx = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} 1)`}>
      {/* 풀잎 3개 — 다른 높이로 */}
      <path
        d="M0 0 Q-3 -14 -10 -22"
        fill="none"
        stroke="#58a864"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
      <path
        d="M0 0 Q1 -18 3 -30"
        fill="none"
        stroke="#4ea05c"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M0 0 Q4 -15 13 -24"
        fill="none"
        stroke="#68bc74"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>
  );
}

function RoundBush({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* 그림자 */}
      <ellipse cx="0" cy="4" rx="22" ry="6" fill="#4a8a50" opacity="0.18" />
      {/* 관목 본체 */}
      <ellipse cx="-13" cy="-1" rx="16" ry="12" fill="#62b06a" />
      <ellipse cx="4" cy="-6" rx="19" ry="13" fill="#52a862" />
      <ellipse cx="18" cy="-1" rx="14" ry="10" fill="#70be78" />
      {/* 하이라이트 */}
      <ellipse cx="5" cy="-10" rx="7" ry="4" fill="#98d89e" opacity="0.45" />
    </g>
  );
}

function Reeds({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* 갈대 줄기 3개 */}
      <path
        d="M0 0 Q-2 -16 -6 -24"
        fill="none"
        stroke="#3e8a60"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M6 1 Q8 -14 14 -22"
        fill="none"
        stroke="#458e66"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M13 2 Q13 -10 18 -17"
        fill="none"
        stroke="#3e8a60"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* 갈대 이삭 (위) */}
      <ellipse cx="-6" cy="-25" rx="3" ry="6" fill="#a07840" opacity="0.8" />
      <ellipse cx="14" cy="-23" rx="3" ry="6" fill="#a07840" opacity="0.7" />
    </g>
  );
}

function PalmTree({
  x,
  y,
  scale,
  flip = false,
}: {
  x: number;
  y: number;
  scale: number;
  flip?: boolean;
}) {
  const sx = flip ? -scale : scale;

  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${scale})`}>
      {/* 줄기 그림자 */}
      <ellipse cx="4" cy="2" rx="8" ry="3" fill="#8c6020" opacity="0.2" />
      {/* 구부러진 줄기 */}
      <path
        d="M0 0 Q-10 -36 2 -72"
        fill="none"
        stroke="#9a6c28"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* 줄기 안쪽 밝은 면 */}
      <path
        d="M-1 0 Q-12 -36 0 -72"
        fill="none"
        stroke="#b8843c"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* 잎 4장 */}
      <g fill="#3aaa6a">
        {/* 왼쪽 아래 잎 */}
        <ellipse
          cx="-20"
          cy="-74"
          rx="27"
          ry="7.5"
          transform="rotate(-38 -20 -74)"
        />
        {/* 오른쪽 잎 */}
        <ellipse
          cx="22"
          cy="-72"
          rx="28"
          ry="7.5"
          transform="rotate(32 22 -72)"
        />
        {/* 위 잎 */}
        <ellipse
          cx="-4"
          cy="-84"
          rx="25"
          ry="7"
          transform="rotate(-8 -4 -84)"
        />
        {/* 왼쪽 위 잎 */}
        <ellipse
          cx="-18"
          cy="-63"
          rx="22"
          ry="7"
          transform="rotate(22 -18 -63)"
        />
      </g>
      {/* 잎 하이라이트 */}
      <ellipse
        cx="-4"
        cy="-86"
        rx="10"
        ry="3"
        fill="#5ecc88"
        opacity="0.45"
        transform="rotate(-8 -4 -86)"
      />
      {/* 야자 열매 */}
      <circle cx="-1" cy="-68" r="6" fill="#d49838" />
      <circle cx="8" cy="-65" r="5" fill="#c28828" />
      {/* 열매 하이라이트 */}
      <circle cx="-3" cy="-70" r="2" fill="#f0c060" opacity="0.5" />
    </g>
  );
}
