import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
}

export function VegetationLayer({ model }: Props) {
  const level = model.vegetationLevel;

  return (
    <g>
      {level >= 1 && (
        <g className={styles.layerReveal}>
          <Sprout x={117} y={187} scale={level === 1 ? 1 : 0.86} />
        </g>
      )}

      {level >= 2 && (
        <g className={styles.layerReveal}>
          <Grass x={68} y={192} />
          <Grass x={253} y={190} flip />
          <Bush x={231} y={185} scale={0.75} />
        </g>
      )}

      {level >= 3 && (
        <g className={styles.layerReveal}>
          <PalmTree x={82} y={183} scale={0.78} />
          <Bush x={263} y={181} scale={0.9} />
          <Reeds x={203} y={186} />
        </g>
      )}

      {level >= 4 && (
        <g className={styles.layerReveal}>
          <PalmTree x={69} y={184} scale={1} />
          <PalmTree x={255} y={184} scale={0.76} flip />
          <Bush x={102} y={187} scale={0.95} />
          <Reeds x={218} y={188} />
        </g>
      )}

      {level >= 5 && (
        <g className={styles.layerReveal}>
          <Grass x={42} y={190} />
          <Grass x={279} y={190} flip />
        </g>
      )}
    </g>
  );
}

function Sprout({
  x,
  y,
  scale,
}: {
  x: number;
  y: number;
  scale: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M0 0 Q-1 -13 1 -24"
        fill="none"
        stroke="#3f8d55"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse
        cx="-7"
        cy="-17"
        rx="9"
        ry="5"
        fill="#63b96e"
        transform="rotate(28 -7 -17)"
      />
      <ellipse
        cx="8"
        cy="-22"
        rx="9"
        ry="5"
        fill="#78c982"
        transform="rotate(-24 8 -22)"
      />
    </g>
  );
}

function Grass({
  x,
  y,
  flip = false,
}: {
  x: number;
  y: number;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <path
        d="M0 0 Q-2 -17 -12 -25 M0 0 Q2 -19 11 -27 M0 0 Q0 -16 1 -31"
        fill="none"
        stroke="#5ca866"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function Bush({
  x,
  y,
  scale,
}: {
  x: number;
  y: number;
  scale: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="-13" cy="0" rx="17" ry="11" fill="#66b96e" />
      <ellipse cx="4" cy="-5" rx="19" ry="14" fill="#55a964" />
      <ellipse cx="19" cy="1" rx="15" ry="10" fill="#74c67b" />
    </g>
  );
}

function Reeds({ x, y }: { x: number; y: number }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke="#438f62"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <path d="M0 0 Q-2 -15 -7 -23 M6 1 Q7 -14 13 -21 M13 2 Q12 -9 18 -16" />
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
  const scaleX = flip ? -scale : scale;

  return (
    <g transform={`translate(${x} ${y}) scale(${scaleX} ${scale})`}>
      <path
        d="M0 0 Q-9 -37 2 -70"
        fill="none"
        stroke="#9b6d2c"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <g fill="#3fae68">
        <ellipse
          cx="-18"
          cy="-73"
          rx="27"
          ry="8"
          transform="rotate(-35 -18 -73)"
        />
        <ellipse
          cx="22"
          cy="-70"
          rx="28"
          ry="8"
          transform="rotate(30 22 -70)"
        />
        <ellipse
          cx="-4"
          cy="-82"
          rx="25"
          ry="8"
          transform="rotate(-8 -4 -82)"
        />
        <ellipse
          cx="-18"
          cy="-61"
          rx="22"
          ry="7"
          transform="rotate(20 -18 -61)"
        />
      </g>
      <circle cx="-1" cy="-67" r="6" fill="#d99b3d" />
      <circle cx="8" cy="-64" r="5" fill="#c98530" />
    </g>
  );
}

