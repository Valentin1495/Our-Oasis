import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
}

const SKY_COLORS: Record<OasisSceneModel["phase"], string> = {
  dry: "#f7e5c2",
  "first-life": "#eff4df",
  growing: "#e8f5e8",
  thriving: "#e1f4ef",
  "community-success": "#ffefc7",
  perfect: "#fff3bd",
};

export function SkyLayer({ model }: Props) {
  const sunColor = model.isPerfect
    ? "#ffd45c"
    : model.hasWarmLight
      ? "#ffcf73"
      : "#f5d59a";

  return (
    <g>
      <rect width="320" height="240" rx="24" fill={SKY_COLORS[model.phase]} />

      {model.hasWarmLight && (
        <circle
          cx="258"
          cy="48"
          r={model.isPerfect ? 34 : 29}
          fill="#fff8d9"
          opacity="0.7"
        />
      )}
      <circle
        cx="258"
        cy="48"
        r={model.isPerfect ? 18 : 15}
        fill={sunColor}
      />

      {model.vegetationLevel >= 2 && (
        <>
          <Cloud x={48} y={53} opacity={0.7} />
          <Cloud x={205} y={82} opacity={0.5} small />
        </>
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
  const scale = small ? 0.72 : 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx="0" cy="5" rx="22" ry="8" fill="#ffffff" />
      <circle cx="-9" cy="1" r="9" fill="#ffffff" />
      <circle cx="7" cy="-2" r="12" fill="#ffffff" />
    </g>
  );
}

