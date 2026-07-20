import type { CSSProperties } from "react";
import styles from "../OasisSvgScene.module.css";
import {
  SHARED_OASIS_COLORS,
  type SharedOasisPresentation,
} from "../sharedOasisSceneConfig";

interface Props {
  presentation: SharedOasisPresentation;
}

export function EdgeLifeLayer({ presentation }: Props) {
  if (presentation.edgePlantLevel === 0) return null;

  return (
    <g className={styles.plantReveal} data-layer="edge-life">
      <path
        d="M219 145 Q215 127 220 108"
        fill="none"
        stroke={SHARED_OASIS_COLORS.stem}
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <ellipse
        cx="210"
        cy="129"
        rx="10"
        ry="5"
        fill={SHARED_OASIS_COLORS.leaf}
        transform="rotate(28 210 129)"
      />
      <ellipse
        cx="226"
        cy="120"
        rx="10"
        ry="5"
        fill={SHARED_OASIS_COLORS.darkLeaf}
        transform="rotate(-30 226 120)"
      />

      {presentation.edgePlantLevel >= 2 && (
        <>
          <path
            d="M214 141 Q201 132 196 119"
            fill="none"
            stroke={SHARED_OASIS_COLORS.secondaryStem}
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <ellipse
            cx="196"
            cy="119"
            rx="8"
            ry="4"
            fill={SHARED_OASIS_COLORS.lightLeaf}
            transform="rotate(36 196 119)"
          />
        </>
      )}

      {presentation.bloomState === "bud" && (
        <g
          className={styles.budGrowth}
          data-bloom="bud"
          style={
            {
              "--bud-scale": presentation.bloomProgress,
            } as CSSProperties
          }
        >
          <path
            d="M212 108 Q220 93 228 108 Q225 116 220 117 Q215 116 212 108Z"
            fill={SHARED_OASIS_COLORS.coral}
          />
        </g>
      )}

      {presentation.bloomState === "flower" && <Flower />}
    </g>
  );
}

function Flower() {
  return (
    <g
      className={styles.flowerReveal}
      data-bloom="flower"
      transform="translate(220 105)"
    >
      <ellipse cx="-7" cy="0" rx="7" ry="6" fill={SHARED_OASIS_COLORS.coral} />
      <ellipse cx="7" cy="0" rx="7" ry="6" fill={SHARED_OASIS_COLORS.coral} />
      <ellipse
        cx="0"
        cy="-7"
        rx="6"
        ry="7"
        fill={SHARED_OASIS_COLORS.coralLight}
      />
      <ellipse
        cx="0"
        cy="7"
        rx="6"
        ry="7"
        fill={SHARED_OASIS_COLORS.coralDark}
      />
      <circle r="4" fill={SHARED_OASIS_COLORS.apricot} />
    </g>
  );
}
