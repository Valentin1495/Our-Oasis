import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
}

/** 팔레트 토큰 — 8색 이내 */
const SKY_TOP: Record<OasisSceneModel["phase"], string> = {
  dry: "#e8c98a",
  "first-life": "#e8dbb5",
  growing: "#cce8d4",
  thriving: "#bde4e0",
  "community-success": "#ffe8ad",
  perfect: "#fff4c2",
};

const SKY_BOTTOM: Record<OasisSceneModel["phase"], string> = {
  dry: "#f5dea8",
  "first-life": "#f0ecce",
  growing: "#ddf2d6",
  thriving: "#d5f1ec",
  "community-success": "#fff8de",
  perfect: "#fffae8",
};

export function SkyLayer({ model }: Props) {
  const gradId = "sky-grad";
  const glowColor = model.isPerfect ? "#ffd45c" : "#ffcf73";
  const sunR = model.isPerfect ? 19 : 15;
  const glowR = model.isPerfect ? 38 : 30;

  return (
    <g aria-hidden="true">
      {/* 하늘 그라데이션 배경 */}
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SKY_TOP[model.phase]} />
          <stop offset="100%" stopColor={SKY_BOTTOM[model.phase]} />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="20" fill={`url(#${gradId})`} />

      {/* 태양 광륜 (75%+) */}
      {model.hasWarmLight && (
        <circle
          cx="262"
          cy="44"
          r={glowR}
          fill={glowColor}
          opacity="0.25"
        />
      )}

      {/* 태양 본체 */}
      <circle
        cx="262"
        cy="44"
        r={sunR}
        fill={model.isPerfect ? "#ffc940" : model.hasWarmLight ? "#ffca55" : "#f5d59a"}
      />

      {/* 완벽 달성 — 태양 광선 (4방향) */}
      {model.isPerfect && (
        <g
          stroke="#ffd45c"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        >
          <line x1="262" y1="18" x2="262" y2="12" />
          <line x1="262" y1="76" x2="262" y2="70" />
          <line x1="236" y1="44" x2="230" y2="44" />
          <line x1="294" y1="44" x2="288" y2="44" />
          <line x1="244" y1="26" x2="239" y2="21" />
          <line x1="280" y1="62" x2="286" y2="67" />
          <line x1="280" y1="26" x2="286" y2="21" />
          <line x1="244" y1="62" x2="239" y2="67" />
        </g>
      )}

      {/* 구름 (25%+) */}
      {model.vegetationLevel >= 2 && (
        <>
          <Cloud x={52} y={56} opacity={0.78} />
          <Cloud x={198} y={76} opacity={0.5} small />
        </>
      )}

      {/* 완벽 달성 — 무지개 호 */}
      {model.isPerfect && (
        <path
          d="M18 185 Q60 95 120 72"
          fill="none"
          stroke="#ff9f9f"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
        />
      )}
      {model.isPerfect && (
        <path
          d="M18 190 Q62 106 124 84"
          fill="none"
          stroke="#ffe066"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
        />
      )}
    </g>
  );
}

function Cloud({
  x,
  y,
  opacity,
  small = false,
}: {
  x: number;
  y: number;
  opacity: number;
  small?: boolean;
}) {
  const s = small ? 0.68 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      {/* 구름 몸통 */}
      <ellipse cx="0" cy="6" rx="24" ry="9" fill="#ffffff" />
      {/* 구름 위 볼록한 부분 */}
      <circle cx="-10" cy="1" r="10" fill="#ffffff" />
      <circle cx="8" cy="-3" r="13" fill="#ffffff" />
      <circle cx="20" cy="3" r="9" fill="#ffffff" />
    </g>
  );
}
