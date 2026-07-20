import type { ReactNode } from "react";
import { SHARED_OASIS_COLORS } from "../sharedOasisSceneConfig";

interface TileProps {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}

function TileGroup({
  x,
  y,
  scale = 1,
  flip = false,
  children,
}: TileProps & { children: ReactNode }) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}
    >
      {children}
    </g>
  );
}

export function RockTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <ellipse cx="0" cy="4" rx="13" ry="5" fill="rgba(95,75,45,.16)" />
      <path
        d="M-11 2 Q-9-9 0-11 Q10-9 12 1 Q7 8-3 7 Q-9 7-11 2Z"
        fill={SHARED_OASIS_COLORS.stone}
        stroke={SHARED_OASIS_COLORS.stoneDark}
        strokeWidth="1"
      />
      <path
        d="M-7-1 Q-3-7 4-7"
        fill="none"
        stroke={SHARED_OASIS_COLORS.stoneLight}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </TileGroup>
  );
}

export function CactusTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <ellipse cx="0" cy="4" rx="10" ry="4" fill="rgba(95,75,45,.13)" />
      <path
        d="M-3 3V-24 Q-3-29 1-29 Q5-29 5-24V3ZM-2-11 Q-11-10-11-18V-22 Q-11-25-8-25 Q-5-25-5-22V-18Q-5-16-2-16ZM4-16 Q13-15 13-23V-26Q13-29 10-29Q7-29 7-26V-22Q7-20 4-20Z"
        fill="#65a96a"
        stroke="#4f8958"
        strokeWidth="1.2"
      />
    </TileGroup>
  );
}

export function SproutTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <path
        d="M0 3Q0-9 0-17"
        fill="none"
        stroke={SHARED_OASIS_COLORS.stem}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="-6"
        cy="-12"
        rx="7"
        ry="3.6"
        fill={SHARED_OASIS_COLORS.lightLeaf}
        transform="rotate(28 -6 -12)"
      />
      <ellipse
        cx="6"
        cy="-17"
        rx="7"
        ry="3.6"
        fill={SHARED_OASIS_COLORS.leaf}
        transform="rotate(-28 6 -17)"
      />
    </TileGroup>
  );
}

export function PalmTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <ellipse cx="0" cy="5" rx="14" ry="5" fill="rgba(58,78,40,.16)" />
      <path
        d="M-3 3Q1-19-1-43Q0-52 4-57"
        fill="none"
        stroke={SHARED_OASIS_COLORS.trunk}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M-1-10L4-13M-2-22L3-25M-2-34L3-37"
        stroke={SHARED_OASIS_COLORS.trunkLight}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g transform="translate(4 -57)">
        <PalmLeaf rotate={-78} />
        <PalmLeaf rotate={-42} />
        <PalmLeaf rotate={-8} />
        <PalmLeaf rotate={28} />
        <PalmLeaf rotate={62} />
        <PalmLeaf rotate={98} />
        <circle r="4.5" fill="#8c6338" />
      </g>
    </TileGroup>
  );
}

function PalmLeaf({ rotate }: { rotate: number }) {
  return (
    <path
      d="M0 0Q15-8 29-1Q17 5 0 3Z"
      fill={rotate % 3 === 0 ? SHARED_OASIS_COLORS.leaf : SHARED_OASIS_COLORS.darkLeaf}
      transform={`rotate(${rotate})`}
    />
  );
}

export function ShrubTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <ellipse cx="0" cy="3" rx="15" ry="5" fill="rgba(58,78,40,.12)" />
      <circle cx="-9" cy="-4" r="8" fill={SHARED_OASIS_COLORS.darkLeaf} />
      <circle cx="0" cy="-9" r="10" fill={SHARED_OASIS_COLORS.leaf} />
      <circle cx="10" cy="-4" r="8" fill={SHARED_OASIS_COLORS.lightLeaf} />
      <circle cx="1" cy="-10" r="2.2" fill="#d9ef9b" />
    </TileGroup>
  );
}

export function FlowerTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <path
        d="M0 3V-13M-9 2Q-8-8-5-12M9 2Q8-8 6-13"
        fill="none"
        stroke={SHARED_OASIS_COLORS.stem}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Flower x={0} y={-15} color={SHARED_OASIS_COLORS.coral} />
      <Flower x={-6} y={-12} color="#ffd66b" />
      <Flower x={7} y={-13} color="#fff6ea" />
    </TileGroup>
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
      <circle cx="-2.8" cy="0" r="3" fill={color} />
      <circle cx="2.8" cy="0" r="3" fill={color} />
      <circle cx="0" cy="-2.8" r="3" fill={color} />
      <circle cx="0" cy="2.8" r="3" fill={color} />
      <circle r="1.8" fill={SHARED_OASIS_COLORS.apricot} />
    </g>
  );
}

export function LilyTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <path
        d="M-10 0Q0-11 12-2Q7 9-6 7Q-12 5-10 0Z"
        fill="#5da868"
        stroke="#3e8753"
        strokeWidth="1"
      />
      <path d="M0 0L10-3" stroke="#b7df9b" strokeWidth="1" />
    </TileGroup>
  );
}

export function BridgeTile(props: TileProps) {
  return (
    <TileGroup {...props}>
      <g transform="rotate(-18)">
        <path
          d="M-25 7Q0-4 25 7V15Q0 4-25 15Z"
          fill="#8a5b34"
          opacity=".32"
        />
        {[-22, -14, -6, 2, 10, 18].map((x) => (
          <rect
            key={x}
            x={x}
            y="-3"
            width="7"
            height="18"
            rx="2"
            fill={x % 4 === 0 ? "#b97d43" : "#c98d4c"}
            stroke="#8b5f37"
            strokeWidth="1"
          />
        ))}
        <path
          d="M-27 0Q0-10 27 0M-27 13Q0 3 27 13"
          fill="none"
          stroke="#744b2e"
          strokeWidth="2"
        />
      </g>
    </TileGroup>
  );
}

export function Lotus({
  state,
}: {
  state: "bud" | "flower";
}) {
  return (
    <g transform="translate(181 171)">
      <ellipse rx="26" ry="11" fill="#4c9c62" opacity=".88" />
      <ellipse rx="18" ry="8" fill="#71b778" />
      {state === "bud" ? (
        <g transform="translate(0 -8)">
          <path
            d="M0-21Q-12-11-8 2Q0 9 8 2Q12-11 0-21Z"
            fill={SHARED_OASIS_COLORS.coral}
            stroke={SHARED_OASIS_COLORS.coralDark}
            strokeWidth="1.5"
          />
          <path
            d="M0-19V3"
            stroke={SHARED_OASIS_COLORS.coralLight}
            strokeWidth="2"
            opacity=".65"
          />
        </g>
      ) : (
        <g transform="translate(0 -5)">
          {[-65, -25, 15, 55, 95, 135, 175, 215].map((rotate, index) => (
            <ellipse
              key={rotate}
              cx="0"
              cy="-11"
              rx="7"
              ry="14"
              fill={
                index % 2 === 0
                  ? SHARED_OASIS_COLORS.coralLight
                  : SHARED_OASIS_COLORS.coral
              }
              transform={`rotate(${rotate})`}
            />
          ))}
          <circle r="7" fill={SHARED_OASIS_COLORS.apricot} />
        </g>
      )}
    </g>
  );
}
