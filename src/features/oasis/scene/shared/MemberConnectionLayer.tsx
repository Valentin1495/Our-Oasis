import type { CSSProperties } from "react";
import {
  getMemberConnectionPath,
  getMemberOrbitPosition,
} from "../sharedOasisSceneLayout";

interface ConnectionMember {
  id: string;
  drops: number;
}

interface Props {
  members: readonly ConnectionMember[];
}

function normalizeConnectionStrength(drops: number): number {
  const normalizedDrops = Number.isFinite(drops)
    ? Math.min(4, Math.max(0, Math.round(drops)))
    : 0;

  return 0.56 + (normalizedDrops / 4) * 0.34;
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
        const isActive = member.drops > 0;

        return (
          <g
            key={member.id}
            data-member-connection={member.id}
            data-connection-active={isActive}
          >
            <path
              className="shared-oasis-scene__connection-groove"
              d={connection.d}
            />
            {isActive && (
              <>
                <path
                  className="shared-oasis-scene__connection-water"
                  d={connection.d}
                  pathLength="1"
                  style={
                    {
                      "--connection-opacity": normalizeConnectionStrength(
                        member.drops,
                      ),
                    } as CSSProperties
                  }
                />
                <path
                  className="shared-oasis-scene__connection-perfect-highlight"
                  d={connection.d}
                  pathLength="1"
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
