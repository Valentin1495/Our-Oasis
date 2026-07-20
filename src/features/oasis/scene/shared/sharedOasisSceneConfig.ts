import type {
  OasisPhase,
  OasisSceneModel,
} from "../oasisSceneModel";

export const SHARED_OASIS_VIEW_BOX = "0 0 360 320";
export const SHARED_OASIS_VIEW_BOX_SIZE = {
  width: 360,
  height: 320,
} as const;

export const SHARED_OASIS_COLORS = {
  sand: "#ecd8ae",
  sandLight: "#f7e8c7",
  sandDark: "#d9bd88",
  stone: "#d5c7a8",
  stoneLight: "#ebe1cc",
  stoneDark: "#ad9e80",
  water: "#72d4d0",
  deepWater: "#35aaa9",
  waterLight: "#c8f2e9",
  ripple: "#e5fff8",
  impactRipple: "#ffffff",
  trunk: "#9b6b3e",
  trunkLight: "#bd8750",
  stem: "#5d9559",
  secondaryStem: "#78aa6e",
  leaf: "#5fa65b",
  darkLeaf: "#377e4a",
  lightLeaf: "#8bc772",
  coral: "#ef7f84",
  coralLight: "#ffadb0",
  coralDark: "#d8586d",
  apricot: "#f7bf62",
  gold: "#dca82f",
  goldLight: "#ffe59a",
} as const;

export const SHARED_OASIS_PATHS = {
  sand: "M20 174 C25 103 85 55 158 49 C223 37 306 73 334 138 C360 199 315 258 244 277 C168 298 71 276 32 222 C21 207 17 190 20 174Z",
  pond:
    "M66 171 C71 121 115 91 167 87 C222 78 284 107 298 151 C312 194 273 230 220 239 C166 250 105 231 78 203 C68 193 63 182 66 171Z",
  deepWater:
    "M102 171 C109 137 139 116 177 113 C218 107 259 128 269 157 C280 187 252 211 214 219 C176 226 133 214 114 195 C105 187 100 179 102 171Z",
} as const;

export const SHARED_OASIS_GEOMETRY = {
  pondBaseScale: 0.34,
  pondScaleRange: 0.66,
  pondTransformOrigin: "180px 171px",
  pondCenter: { x: 180, y: 171 },
} as const;

export interface MemberAnchor {
  x: number;
  y: number;
  align: "left" | "center" | "right";
}

export const MEMBER_ANCHORS_BY_COUNT: Record<
  1 | 2 | 3 | 4 | 5,
  readonly MemberAnchor[]
> = {
  1: [{ x: 180, y: 274, align: "center" }],
  2: [
    { x: 48, y: 165, align: "left" },
    { x: 312, y: 165, align: "right" },
  ],
  3: [
    { x: 52, y: 133, align: "left" },
    { x: 308, y: 133, align: "right" },
    { x: 180, y: 276, align: "center" },
  ],
  4: [
    { x: 72, y: 82, align: "left" },
    { x: 288, y: 82, align: "right" },
    { x: 48, y: 224, align: "left" },
    { x: 312, y: 224, align: "right" },
  ],
  5: [
    { x: 68, y: 82, align: "left" },
    { x: 292, y: 82, align: "right" },
    { x: 43, y: 220, align: "left" },
    { x: 317, y: 220, align: "right" },
    { x: 180, y: 281, align: "center" },
  ],
};

export type OasisTileKind =
  | "rock"
  | "cactus"
  | "sprout"
  | "palm"
  | "shrub"
  | "flower"
  | "lily"
  | "bridge";

export interface OasisTilePlacement {
  id: string;
  kind: OasisTileKind;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  layer: "far" | "middle" | "near";
}

export const OASIS_TILE_PLACEMENTS: readonly OasisTilePlacement[] = [
  { id: "rock-north", kind: "rock", x: 180, y: 63, scale: 0.8, layer: "far" },
  { id: "rock-east", kind: "rock", x: 316, y: 171, scale: 0.72, layer: "middle" },
  { id: "rock-south", kind: "rock", x: 193, y: 269, scale: 0.8, layer: "near" },
  { id: "rock-west", kind: "rock", x: 42, y: 181, scale: 0.68, layer: "middle" },
  { id: "cactus-west", kind: "cactus", x: 58, y: 226, scale: 0.78, layer: "near" },
  { id: "cactus-east", kind: "cactus", x: 307, y: 221, scale: 0.7, flip: true, layer: "near" },
  { id: "sprout-west", kind: "sprout", x: 92, y: 208, scale: 0.85, layer: "near" },
  { id: "sprout-east", kind: "sprout", x: 279, y: 197, scale: 0.82, flip: true, layer: "near" },
  { id: "palm-north-west", kind: "palm", x: 95, y: 107, scale: 0.82, layer: "far" },
  { id: "palm-north-east", kind: "palm", x: 269, y: 116, scale: 0.78, flip: true, layer: "far" },
  { id: "shrub-west", kind: "shrub", x: 75, y: 176, scale: 0.9, layer: "middle" },
  { id: "shrub-east", kind: "shrub", x: 291, y: 166, scale: 0.88, flip: true, layer: "middle" },
  { id: "shrub-south", kind: "shrub", x: 249, y: 239, scale: 0.82, layer: "near" },
  { id: "palm-west", kind: "palm", x: 55, y: 150, scale: 0.96, layer: "middle" },
  { id: "palm-east", kind: "palm", x: 313, y: 154, scale: 0.92, flip: true, layer: "middle" },
  { id: "bridge", kind: "bridge", x: 226, y: 211, scale: 0.9, layer: "near" },
  { id: "lily-west", kind: "lily", x: 126, y: 165, scale: 0.8, layer: "middle" },
  { id: "lily-east", kind: "lily", x: 232, y: 151, scale: 0.76, flip: true, layer: "middle" },
  { id: "lily-south", kind: "lily", x: 166, y: 210, scale: 0.68, layer: "middle" },
  { id: "flower-west", kind: "flower", x: 88, y: 145, scale: 0.78, layer: "middle" },
  { id: "flower-east", kind: "flower", x: 278, y: 139, scale: 0.76, layer: "middle" },
  { id: "flower-south-west", kind: "flower", x: 111, y: 237, scale: 0.82, layer: "near" },
  { id: "flower-south-east", kind: "flower", x: 276, y: 226, scale: 0.78, layer: "near" },
  { id: "palm-south-west", kind: "palm", x: 80, y: 235, scale: 1.02, layer: "near" },
  { id: "palm-south-east", kind: "palm", x: 302, y: 233, scale: 0.98, flip: true, layer: "near" },
  { id: "success-shrub-north", kind: "shrub", x: 184, y: 78, scale: 0.84, layer: "far" },
  { id: "success-shrub-west", kind: "shrub", x: 48, y: 196, scale: 0.8, layer: "middle" },
  { id: "success-shrub-east", kind: "shrub", x: 318, y: 195, scale: 0.8, flip: true, layer: "middle" },
  { id: "success-flower-north-west", kind: "flower", x: 135, y: 91, scale: 0.72, layer: "far" },
  { id: "success-flower-north-east", kind: "flower", x: 230, y: 92, scale: 0.72, layer: "far" },
  { id: "success-flower-south", kind: "flower", x: 202, y: 257, scale: 0.86, layer: "near" },
  { id: "perfect-flower-west", kind: "flower", x: 62, y: 165, scale: 0.68, layer: "middle" },
  { id: "perfect-flower-east", kind: "flower", x: 307, y: 178, scale: 0.68, layer: "middle" },
  { id: "perfect-flower-north", kind: "flower", x: 204, y: 73, scale: 0.66, layer: "far" },
  { id: "perfect-flower-south", kind: "flower", x: 150, y: 260, scale: 0.76, layer: "near" },
] as const;

interface PhasePresentation {
  showDeepWater: boolean;
}

const PHASE_PRESENTATION: Record<OasisPhase, PhasePresentation> = {
  dry: { showDeepWater: false },
  "first-life": { showDeepWater: false },
  growing: { showDeepWater: false },
  thriving: { showDeepWater: true },
  "community-success": { showDeepWater: true },
  perfect: { showDeepWater: true },
};

export interface SharedOasisPresentation {
  hasWater: boolean;
  pondScale: number;
  showDeepWater: boolean;
  deepWaterOpacity: number;
  edgePlantLevel: OasisSceneModel["edgePlantLevel"];
  bloomState: OasisSceneModel["bloomState"];
  bloomProgress: number;
  showPerfectEffects: boolean;
  lighting: OasisSceneModel["lighting"];
  visibleTileIds: ReadonlySet<string>;
}

export function deriveSharedOasisPresentation(
  model: OasisSceneModel,
): SharedOasisPresentation {
  return {
    hasWater: model.hasWater,
    pondScale:
      SHARED_OASIS_GEOMETRY.pondBaseScale +
      model.waterLevel * SHARED_OASIS_GEOMETRY.pondScaleRange,
    showDeepWater: PHASE_PRESENTATION[model.phase].showDeepWater,
    deepWaterOpacity: 0.16 + model.waterLevel * 0.2,
    edgePlantLevel: model.edgePlantLevel,
    bloomState: model.bloomState,
    bloomProgress: model.bloomProgress,
    showPerfectEffects: model.isPerfect,
    lighting: model.lighting,
    visibleTileIds: new Set(model.visibleTileIds),
  };
}

export function getMemberAnchors(memberCount: number): readonly MemberAnchor[] {
  const safeCount = Math.min(5, Math.max(1, memberCount)) as 1 | 2 | 3 | 4 | 5;
  return MEMBER_ANCHORS_BY_COUNT[safeCount];
}

export function getMemberAnchor(
  memberCount: number,
  memberIndex: number,
): MemberAnchor {
  const anchors = getMemberAnchors(memberCount);
  return anchors[Math.min(memberIndex, anchors.length - 1)];
}
