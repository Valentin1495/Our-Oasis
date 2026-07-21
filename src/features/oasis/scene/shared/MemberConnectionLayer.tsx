import type { CSSProperties } from "react";
import {
  getMemberConnectionPath,
  getMemberOrbitPosition,
} from "../sharedOasisSceneLayout";
import {
  getIslandVisualState,
  getMemberAnimationTiming,
  MEMBER_DAILY_DROP_TARGET,
  normalizeMemberDrops,
} from "./memberIslandPresentation";

interface ConnectionMember {
  id: string;
  drops: number;
}

interface Props {
  members: readonly ConnectionMember[];
}

export function MemberConnectionLayer({ members }: Props) {
  return (
    <svg
      className="shared-oasis-scene__connection-layer"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {members.map((member, index) => {
        const position = getMemberOrbitPosition(index, members.length);
        const connection = getMemberConnectionPath(position);
        const normalizedDrops = normalizeMemberDrops(member.drops);
        const visualState = getIslandVisualState(
          normalizedDrops,
          MEMBER_DAILY_DROP_TARGET,
        );
        const animationTiming = getMemberAnimationTiming(member.id);
        const isActive = normalizedDrops > 0;

        return (
          <g
            key={member.id}
            data-member-connection={member.id}
            data-connection-active={isActive}
            style={
              {
                "--connection-opacity": visualState.connectionOpacity,
                "--connection-glow-opacity": Number(
                  (0.1 + visualState.connectionOpacity * 0.5).toFixed(3),
                ),
                "--connection-glint-opacity": Number(
                  (0.02 + visualState.connectionOpacity * 0.9).toFixed(3),
                ),
                "--connection-duration": `${animationTiming.hazeDurationSeconds}s`,
                "--connection-delay": `${animationTiming.delaySeconds}s`,
              } as CSSProperties
            }
          >
            <path
              className="shared-oasis-scene__connection-glow"
              d={connection.d}
              pathLength="1"
            />
            <path
              className="shared-oasis-scene__connection-core"
              d={connection.d}
              pathLength="1"
            />
            <path
              className="shared-oasis-scene__connection-glint"
              d={connection.d}
              pathLength="1"
            />
          </g>
        );
      })}
    </svg>
  );
}
