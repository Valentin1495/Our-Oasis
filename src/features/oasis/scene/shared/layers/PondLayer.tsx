import type { CSSProperties } from "react";
import styles from "../OasisSvgScene.module.css";
import {
  SHARED_OASIS_COLORS,
  SHARED_OASIS_GEOMETRY,
  SHARED_OASIS_PATHS,
  type SharedOasisPresentation,
} from "../sharedOasisSceneConfig";

interface Props {
  presentation: SharedOasisPresentation;
}

export function PondLayer({ presentation }: Props) {
  if (!presentation.hasWater) return null;

  return (
    <g
      className={styles.pondGrowth}
      data-layer="pond"
      style={
        {
          "--pond-scale": presentation.pondScale,
          "--pond-origin": SHARED_OASIS_GEOMETRY.pondTransformOrigin,
        } as CSSProperties
      }
    >
      <path d={SHARED_OASIS_PATHS.pond} fill="url(#water-gradient)" />
      <path
        d={SHARED_OASIS_PATHS.pond}
        fill="none"
        stroke={SHARED_OASIS_COLORS.waterLight}
        strokeWidth="2.4"
        opacity=".72"
        transform="translate(10.8 10.26) scale(.94)"
      />

      {presentation.showDeepWater && (
        <path
          className={styles.deepWater}
          d={SHARED_OASIS_PATHS.deepWater}
          fill={SHARED_OASIS_COLORS.deepWater}
          opacity={presentation.deepWaterOpacity}
        />
      )}

      <g
        fill="none"
        stroke={SHARED_OASIS_COLORS.ripple}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity=".72"
      >
        <path d="M112 181Q127 173 143 180" />
        <path d="M211 135Q225 128 239 135" />
        <path d="M196 207Q209 201 221 207" />
      </g>
    </g>
  );
}
