import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
  showFinalReward: boolean;
}

export function CelebrationLayer({ model, showFinalReward }: Props) {
  if (!model.isCommunitySuccess && !showFinalReward) return null;

  return (
    <g>
      {model.isCommunitySuccess && (
        <g fill="#fff7cf">
          <Sparkle x={45} y={72} size={6} />
          <Sparkle x={279} y={93} size={5} />
        </g>
      )}

      {model.isPerfect && (
        <>
          <g fill="#ffd667">
            <Sparkle x={78} y={48} size={8} />
            <Sparkle x={230} y={38} size={6} />
            <Sparkle x={290} y={127} size={5} />
          </g>
          <g>
            <Flower x={96} y={191} color="#ff8faf" />
            <Flower x={218} y={188} color="#9c8ce2" />
            <Flower x={271} y={191} color="#ffb65c" />
            <path
              d="M103 201 Q128 192 153 201 T207 201"
              fill="none"
              stroke="#f4fff9"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.9"
            />
          </g>
          <g transform="translate(286 31)">
            <circle r="16" fill="#ffc94f" />
            <path
              d="M-7 0 l5 5 10 -11"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      )}

      {showFinalReward && !model.isPerfect && (
        <g transform="translate(286 31)">
          <circle r="13" fill="#ffd667" />
          <path
            d="M0 -8 l2.5 5 5.5 1 -4 4 1 6 -5 -3 -5 3 1 -6 -4 -4 5.5 -1Z"
            fill="#fff8d7"
          />
        </g>
      )}
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
  return (
    <path
      d={`M${x} ${y - size} L${x + 2} ${y - 2} L${x + size} ${y} L${x + 2} ${y + 2} L${x} ${y + size} L${x - 2} ${y + 2} L${x - size} ${y} L${x - 2} ${y - 2}Z`}
    />
  );
}

function Flower({
  x,
  y,
  color,
}: {
  x: number;
  y: number;
  color: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="-4" cy="0" r="4" fill={color} />
      <circle cx="4" cy="0" r="4" fill={color} />
      <circle cx="0" cy="-4" r="4" fill={color} />
      <circle cx="0" cy="4" r="4" fill={color} />
      <circle r="2.5" fill="#ffd667" />
    </g>
  );
}

