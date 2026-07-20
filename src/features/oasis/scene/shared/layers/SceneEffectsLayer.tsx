import type { CSSProperties } from "react";
import type {
  OasisSceneEvent,
  OasisSceneSequencePhase,
} from "../../oasisSceneEvents";
import styles from "../OasisSvgScene.module.css";
import {
  getMemberAnchor,
  SHARED_OASIS_COLORS,
  SHARED_OASIS_GEOMETRY,
  type SharedOasisPresentation,
} from "../sharedOasisSceneConfig";

interface Props {
  presentation: SharedOasisPresentation;
  event: OasisSceneEvent | null;
  phase: OasisSceneSequencePhase;
  impactIndex: number;
}

export function SceneEffectsLayer({
  presentation,
  event,
  phase,
  impactIndex,
}: Props) {
  const showDrops =
    event?.kind === "contribution" &&
    (phase === "travel" || phase === "impact");
  const actorIndex = event?.actorMemberId
    ? event.after.members.findIndex(
        (member) => member.id === event.actorMemberId,
      )
    : -1;
  const source =
    event && actorIndex >= 0
      ? getMemberAnchor(event.after.members.length, actorIndex)
      : { x: 180, y: 55 };
  const target = SHARED_OASIS_GEOMETRY.pondCenter;
  const controlX = (source.x + target.x) / 2 + (source.x < target.x ? 24 : -24);
  const controlY = Math.min(source.y, target.y) - 34;
  const motionPath = `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`;

  return (
    <g data-layer="scene-effects">
      {presentation.lighting === "success" && (
        <ellipse
          className={styles.successGlow}
          cx="180"
          cy="164"
          rx="148"
          ry="111"
          fill="url(#success-glow)"
          data-success-effect="true"
        />
      )}

      {presentation.showPerfectEffects && (
        <g
          className={styles.perfectReveal}
          data-perfect-effect="true"
          fill={SHARED_OASIS_COLORS.goldLight}
        >
          <Sparkle x={74} y={91} size={6} />
          <Sparkle x={294} y={94} size={5} />
          <Sparkle x={52} y={205} size={4} />
          <Sparkle x={310} y={213} size={4.5} />
          <Sparkle x={178} y={64} size={4} />
        </g>
      )}

      {showDrops &&
        Array.from({ length: event.dropsAdded }, (_, index) => (
          <g
            key={`${event.id}-${index}`}
            className={styles.dropTravel}
            style={
              {
                offsetPath: `path("${motionPath}")`,
                animationDelay: `${index * 120}ms`,
              } as CSSProperties
            }
            data-contribution-effect="true"
          >
            <path
              d="M0-8Q-7 1 0 7Q7 1 0-8Z"
              fill={SHARED_OASIS_COLORS.deepWater}
              stroke={SHARED_OASIS_COLORS.waterLight}
              strokeWidth="1"
            />
          </g>
        ))}

      {event?.kind === "contribution" && impactIndex > 0 && (
        <ellipse
          key={`${event.id}-impact-${impactIndex}`}
          className={styles.impactRipple}
          cx={target.x}
          cy={target.y}
          rx="8"
          ry="4"
          fill="none"
          stroke={SHARED_OASIS_COLORS.impactRipple}
          strokeWidth="2.2"
          data-impact-index={impactIndex}
        />
      )}

      {phase === "celebrate-75" && (
        <ellipse
          className={styles.thresholdBloom}
          cx="180"
          cy="167"
          rx="112"
          ry="74"
          fill="none"
          stroke="#8fd7a0"
          strokeWidth="5"
          data-threshold-effect="75"
        />
      )}

      {phase === "celebrate-100" && (
        <g
          className={styles.goldenBurst}
          data-threshold-effect="100"
          fill={SHARED_OASIS_COLORS.gold}
        >
          <Sparkle x={105} y={116} size={7} />
          <Sparkle x={257} y={127} size={7} />
          <Sparkle x={129} y={228} size={5} />
          <Sparkle x={245} y={226} size={5} />
        </g>
      )}
    </g>
  );
}

function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  const inner = size * 0.3;
  return (
    <path
      d={`M${x} ${y - size}L${x + inner} ${y - inner}L${x + size} ${y}L${x + inner} ${y + inner}L${x} ${y + size}L${x - inner} ${y + inner}L${x - size} ${y}L${x - inner} ${y - inner}Z`}
    />
  );
}
