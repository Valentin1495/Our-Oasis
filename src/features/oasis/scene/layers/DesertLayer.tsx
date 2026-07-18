import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
}

export function DesertLayer({ model }: Props) {
  const sandFar = "#e8c98a";   // 배경 모래 언덕 (크림)
  const sandNear = model.isCommunitySuccess ? "#d9ba7a" : "#ddb878"; // 전경 모래 (성공시 살짝 진함)
  const basinRim = "#c4996a";  // 웅덩이 테두리
  const basinFloor = model.hasWater ? "#a87850" : "#b88a5a"; // 웅덩이 바닥

  return (
    <g aria-hidden="true">
      {/* === 배경 — 먼 모래 언덕 === */}
      <ellipse cx="285" cy="160" rx="80" ry="30" fill={sandFar} opacity="0.65" />
      <ellipse cx="48" cy="168" rx="70" ry="26" fill={sandFar} opacity="0.55" />

      {/* === 중경 — 모래 바닥 (굴곡진 웨이브) === */}
      <path
        d="M0 155 Q50 138 108 154 T220 148 T320 155 V240 H0Z"
        fill="#e8c590"
      />

      {/* === 전경 — 가까운 모래 층 === */}
      <path
        d="M0 178 Q60 160 122 178 T248 172 T320 170 V240 H0Z"
        fill={sandNear}
      />

      {/* === 웅덩이 테두리 (타원형 움푹 팬 테두리) === */}
      <ellipse cx="160" cy="204" rx="104" ry="28" fill={basinRim} />
      {/* 안쪽 그림자 느낌 */}
      <ellipse cx="160" cy="203" rx="96" ry="23" fill={basinFloor} />
      {/* 하이라이트 테두리 (상단) */}
      <path
        d="M70 194 Q115 181 160 181 Q205 181 250 194"
        fill="none"
        stroke="#d4ac80"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* === 마른 웅덩이 균열 (물 없을 때만) === */}
      {!model.hasWater && (
        <g
          fill="none"
          stroke="#9d7a50"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.6"
        >
          {/* Y자형 균열 3세트 */}
          <path d="M125 196 l-8 -7 m8 7 l-5 9 m5 -9 l10 -4" />
          <path d="M185 204 l9 -8 m-9 8 l5 9 m-5 -9 l-10 -4" />
          <path d="M158 188 l3 8 8 3" />
          <path d="M143 208 l-6 -5 6 -3" />
          <path d="M172 193 l6 4 -4 7" />
        </g>
      )}

      {/* === 좌우 돌 (항상 고정) === */}
      {/* 왼쪽 돌 */}
      <ellipse cx="33" cy="193" rx="11" ry="6" fill="#b09068" />
      <ellipse cx="33" cy="191" rx="9" ry="4" fill="#c8a87a" />
      {/* 오른쪽 돌 (약간 더 큰) */}
      <ellipse cx="289" cy="188" rx="13" ry="7" fill="#b09068" />
      <ellipse cx="289" cy="186" rx="11" ry="5" fill="#c8a87a" />

      {/* === 전경 작은 돌 === */}
      <circle cx="58" cy="200" r="3.5" fill="#b09068" />
      <circle cx="268" cy="196" r="4" fill="#b09068" />
    </g>
  );
}
