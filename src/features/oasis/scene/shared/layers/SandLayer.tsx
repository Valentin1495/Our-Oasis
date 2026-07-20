import {
  SHARED_OASIS_COLORS,
  SHARED_OASIS_PATHS,
} from "../sharedOasisSceneConfig";

export function SandLayer() {
  return (
    <g data-layer="sand">
      <ellipse
        cx="181"
        cy="248"
        rx="142"
        ry="37"
        fill="rgba(86,65,34,.16)"
        filter="url(#island-shadow)"
      />
      <path
        d={SHARED_OASIS_PATHS.sand}
        fill="url(#sand-gradient)"
        stroke={SHARED_OASIS_COLORS.sandDark}
        strokeWidth="1.5"
      />
      <g fill={SHARED_OASIS_COLORS.sandDark} opacity=".33">
        <circle cx="73" cy="116" r="2.2" />
        <circle cx="115" cy="72" r="1.8" />
        <circle cx="250" cy="82" r="2" />
        <circle cx="317" cy="142" r="1.7" />
        <circle cx="39" cy="198" r="1.8" />
        <circle cx="129" cy="266" r="2" />
        <circle cx="285" cy="253" r="2.1" />
      </g>
      <path
        d={SHARED_OASIS_PATHS.pond}
        fill={SHARED_OASIS_COLORS.sandDark}
        opacity=".48"
        transform="translate(9 8.55) scale(.95)"
      />
    </g>
  );
}
