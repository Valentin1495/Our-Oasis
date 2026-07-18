import type { OasisSceneModel } from "../oasisSceneModel";

interface Props {
  model: OasisSceneModel;
}

export function DesertLayer({ model }: Props) {
  const sandColor = model.isCommunitySuccess ? "#d9be82" : "#ddb77d";
  const basinColor = model.hasWater ? "#a9875f" : "#b58e5d";

  return (
    <g>
      <path
        d="M0 151 Q55 128 112 148 T224 145 T320 150 V240 H0Z"
        fill="#e8ca94"
      />
      <path
        d="M0 181 Q66 158 128 180 T250 176 T320 174 V240 H0Z"
        fill={sandColor}
      />

      <ellipse cx="160" cy="201" rx="112" ry="31" fill={basinColor} />
      <ellipse cx="160" cy="198" rx="103" ry="25" fill="#c5a06d" />

      {!model.hasWater && (
        <g
          fill="none"
          stroke="#9d774c"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        >
          <path d="M126 193 l-13 -9 m13 9 l-7 11 m7 -11 l12 -5" />
          <path d="M188 203 l13 -10 m-13 10 l7 10 m-7 -10 l-13 -5" />
          <path d="M157 183 l4 9 10 3" />
        </g>
      )}

      <g fill="#a98052">
        <ellipse cx="35" cy="196" rx="8" ry="4" />
        <ellipse cx="287" cy="190" rx="10" ry="5" />
      </g>
    </g>
  );
}

