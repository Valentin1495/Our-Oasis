import {
  SHARED_OASIS_COLORS,
  type SharedOasisPresentation,
} from "../sharedOasisSceneConfig";

interface Props {
  presentation: SharedOasisPresentation;
}

const RIM_STONES = Array.from({ length: 18 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 18;
  return {
    x: 180 + Math.cos(angle) * 122,
    y: 171 + Math.sin(angle) * 75,
    rotate: (angle * 180) / Math.PI + 90,
    scale: index % 2 === 0 ? 1 : 0.9,
  };
});

export function BasinRimLayer({ presentation }: Props) {
  return (
    <g data-layer="basin-rim">
      {RIM_STONES.map((stone, index) => (
        <g
          key={index}
          transform={`translate(${stone.x} ${stone.y}) rotate(${stone.rotate}) scale(${stone.scale})`}
        >
          <ellipse
            cx="1"
            cy="4"
            rx="14"
            ry="5"
            fill="rgba(90,68,36,.17)"
          />
          <rect
            x="-13"
            y="-7"
            width="26"
            height="14"
            rx="6"
            fill={
              index % 3 === 0
                ? SHARED_OASIS_COLORS.stoneLight
                : SHARED_OASIS_COLORS.stone
            }
            stroke={SHARED_OASIS_COLORS.stoneDark}
            strokeWidth="1"
          />
          <path
            d="M-8-3Q0-6 8-3"
            fill="none"
            stroke="#f5eddd"
            strokeWidth="1.5"
            opacity=".75"
          />
        </g>
      ))}

      {!presentation.hasWater && (
        <ellipse
          cx="180"
          cy="171"
          rx="89"
          ry="48"
          fill={SHARED_OASIS_COLORS.sandLight}
          stroke={SHARED_OASIS_COLORS.sandDark}
          strokeWidth="2"
          strokeDasharray="5 7"
          opacity=".74"
        />
      )}
    </g>
  );
}
