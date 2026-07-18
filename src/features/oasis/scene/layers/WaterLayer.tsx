import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
  dropAnimationTick: number;
}

export function WaterLayer({ model, dropAnimationTick }: Props) {
  if (!model.hasWater) return null;

  const waterRadiusX = 42 + model.waterLevel * 58;
  const waterRadiusY = 5 + model.waterLevel * 19;
  const waterColor =
    model.phase === "first-life"
      ? "#73c7c3"
      : model.isPerfect
        ? "#3ebfd0"
        : "#43c8c1";

  return (
    <g>
      <ellipse
        className={styles.waterShape}
        cx="160"
        cy="198"
        rx={waterRadiusX}
        ry={waterRadiusY}
        fill={waterColor}
      />
      <ellipse
        className={styles.waterShape}
        cx="160"
        cy="195"
        rx={waterRadiusX * 0.82}
        ry={Math.max(2.5, waterRadiusY * 0.42)}
        fill="#85ddd7"
        opacity="0.6"
      />

      {model.percent >= 25 && (
        <g
          fill="none"
          stroke="#d8fffb"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        >
          <path d="M118 194 Q130 190 143 194" />
          <path d="M171 201 Q184 197 197 201" />
        </g>
      )}

      {model.isCommunitySuccess && (
        <ellipse
          cx="160"
          cy="198"
          rx={waterRadiusX * 0.56}
          ry={Math.max(3, waterRadiusY * 0.4)}
          fill="none"
          stroke="#effff8"
          strokeWidth="2"
          opacity="0.7"
        />
      )}

      {dropAnimationTick > 0 && (
        <g key={dropAnimationTick} className={styles.dropFall}>
          <path
            d="M160 62 Q151 80 160 91 Q169 80 160 62Z"
            fill="#3e8ef7"
            opacity="0.9"
          />
        </g>
      )}
    </g>
  );
}

