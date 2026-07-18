import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
  showFinalReward: boolean;
}

export function CelebrationLayer({ model, showFinalReward }: Props) {
  if (!model.isCommunitySuccess && !showFinalReward) return null;

  return (
    <g aria-hidden="true">
      {/* ── 75%+ 공동 성공 장식 ── */}
      {model.isCommunitySuccess && (
        <>
          {/* 부드러운 빛 스파클 */}
          <g fill="#fff7cf">
            <Sparkle x={42} y={74} size={5.5} />
            <Sparkle x={282} y={90} size={4.5} />
          </g>
          {/* 왼쪽 코랄 꽃 */}
          <Flower x={96} y={192} color="#ff9fb8" />
          {/* 오른쪽 연보라 꽃 */}
          <Flower x={224} y={190} color="#b09ee8" />
        </>
      )}

      {/* ── 100% 완벽 달성 추가 장식 ── */}
      {model.isPerfect && (
        <>
          {/* 골드 스파클 */}
          <g fill="#ffd060">
            <Sparkle x={72} y={50} size={8} />
            <Sparkle x={232} y={40} size={6} />
            <Sparkle x={294} y={122} size={5} />
            <Sparkle x={28} y={108} size={4.5} />
          </g>

          {/* 추가 꽃 (오렌지) */}
          <Flower x={272} y={192} color="#ffb054" />

          {/* 물 표면 골드 파장 */}
          <path
            d="M106 202 Q130 194 154 202 T206 202"
            fill="none"
            stroke="#fff0a0"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* 가장자리 작은 별 */}
          <Star x={22} y={52} r={5} color="#ffd060" opacity={0.5} />
          <Star x={298} y={156} r={4} color="#ffd060" opacity={0.4} />

          {/* 오른쪽 상단 완성 배지 */}
          <g transform="translate(286 32)">
            <circle r="16" fill="#ffca40" />
            {/* 체크 */}
            <path
              d="M-6 0 l4.5 5 9 -10"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      )}

      {/* ── 최종 오아시스 보상 (showFinalReward && !isPerfect) ── */}
      {showFinalReward && !model.isPerfect && (
        <g transform="translate(286 32)">
          <circle r="13" fill="#ffd060" />
          <path
            d="M0 -8 l2.5 5 5.5 1 -4 4 1 6 -5 -3 -5 3 1 -6 -4 -4 5.5 -1Z"
            fill="#fff8d7"
          />
        </g>
      )}
    </g>
  );
}

/* ─────────────────────────── Sparkle (4-point star) ─────────────────────────── */
function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size;
  const sm = size * 0.35;
  return (
    <path
      d={`M${x} ${y - s} L${x + sm} ${y - sm} L${x + s} ${y} L${x + sm} ${y + sm} L${x} ${y + s} L${x - sm} ${y + sm} L${x - s} ${y} L${x - sm} ${y - sm}Z`}
    />
  );
}

/* ─────────────────────────── Flower ─────────────────────────── */
function Flower({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* 꽃잎 4장 */}
      <ellipse cx="-4.5" cy="0" rx="4.5" ry="3.2" fill={color} />
      <ellipse cx="4.5" cy="0" rx="4.5" ry="3.2" fill={color} />
      <ellipse cx="0" cy="-4.5" rx="3.2" ry="4.5" fill={color} />
      <ellipse cx="0" cy="4.5" rx="3.2" ry="4.5" fill={color} />
      {/* 꽃 중심 */}
      <circle r="3" fill="#ffd660" />
      {/* 중심 하이라이트 */}
      <circle cx="-0.8" cy="-0.8" r="1" fill="#fffacc" opacity="0.6" />
    </g>
  );
}

/* ─────────────────────────── Star ─────────────────────────── */
function Star({
  x,
  y,
  r,
  color,
  opacity,
}: {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
}) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const innerAngle = angle + 36 * (Math.PI / 180);
    const inner = r * 0.45;
    return (
      `${x + r * Math.cos(angle)},${y + r * Math.sin(angle)} ` +
      `${x + inner * Math.cos(innerAngle)},${y + inner * Math.sin(innerAngle)}`
    );
  }).join(" ");

  return <polygon points={pts} fill={color} opacity={opacity} />;
}
