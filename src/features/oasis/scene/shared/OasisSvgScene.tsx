import type {
  OasisSceneEvent,
  OasisSceneSequencePhase,
} from "../oasisSceneEvents";
import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "./OasisSvgScene.module.css";
import { BasinRimLayer } from "./layers/BasinRimLayer";
import { PondLayer } from "./layers/PondLayer";
import { SandLayer } from "./layers/SandLayer";
import { SceneEffectsLayer } from "./layers/SceneEffectsLayer";
import { TileLayer } from "./layers/TileLayer";
import {
  deriveSharedOasisPresentation,
  SHARED_OASIS_COLORS,
  SHARED_OASIS_VIEW_BOX,
} from "./sharedOasisSceneConfig";

interface Props {
  model: OasisSceneModel;
  event: OasisSceneEvent | null;
  phase: OasisSceneSequencePhase;
  impactIndex: number;
}

export function OasisSvgScene({
  model,
  event,
  phase,
  impactIndex,
}: Props) {
  const presentation = deriveSharedOasisPresentation(model);

  return (
    <svg
      className={styles.svg}
      viewBox={SHARED_OASIS_VIEW_BOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sand-gradient" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={SHARED_OASIS_COLORS.sandLight} />
          <stop offset="1" stopColor={SHARED_OASIS_COLORS.sand} />
        </linearGradient>
        <linearGradient id="water-gradient" x1="0" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor={SHARED_OASIS_COLORS.waterLight} />
          <stop offset=".45" stopColor={SHARED_OASIS_COLORS.water} />
          <stop offset="1" stopColor={SHARED_OASIS_COLORS.deepWater} />
        </linearGradient>
        <radialGradient id="success-glow">
          <stop offset="0" stopColor="#e8ffd5" stopOpacity=".3" />
          <stop offset="1" stopColor="#a9d997" stopOpacity="0" />
        </radialGradient>
        <filter id="island-shadow" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <SandLayer />
      <TileLayer layer="far" presentation={presentation} />
      <PondLayer presentation={presentation} />
      <BasinRimLayer presentation={presentation} />
      <TileLayer layer="middle" presentation={presentation} />
      <TileLayer layer="near" presentation={presentation} />
      <SceneEffectsLayer
        presentation={presentation}
        event={event}
        phase={phase}
        impactIndex={impactIndex}
      />
    </svg>
  );
}
