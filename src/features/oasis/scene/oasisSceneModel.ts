export type OasisPhase =
  | "dry"
  | "first-life"
  | "growing"
  | "thriving"
  | "community-success"
  | "perfect";

export type OasisLighting =
  | "dry"
  | "soft"
  | "alive"
  | "success"
  | "perfect";

export interface OasisSceneMember {
  id: string;
  nickname: string;
  contributedDropsToday: number;
  hasWaterRecordToday: boolean;
}

export interface OasisSceneProgress {
  totalDrops: number;
  maxDrops: number;
  displayPercent: number;
  isCommunitySuccess: boolean;
  isPerfect: boolean;
}

export interface OasisSceneSnapshot {
  progress: OasisSceneProgress;
  members: OasisSceneMember[];
  currentMemberId: string | null;
}

export interface OasisSceneModel {
  percent: number;
  phase: OasisPhase;
  lighting: OasisLighting;
  waterLevel: number;
  hasWater: boolean;
  edgePlantLevel: 0 | 1 | 2;
  bloomState: "none" | "bud" | "flower";
  bloomProgress: number;
  isCommunitySuccess: boolean;
  isPerfect: boolean;
  visibleTileIds: string[];
  snapshot: OasisSceneSnapshot;
}

const TILE_IDS_BY_PHASE: Record<OasisPhase, readonly string[]> = {
  dry: [
    "rock-north",
    "rock-east",
    "rock-south",
    "rock-west",
    "cactus-west",
    "cactus-east",
  ],
  "first-life": ["sprout-west", "sprout-east"],
  growing: [
    "palm-north-west",
    "palm-north-east",
    "shrub-west",
    "shrub-east",
    "shrub-south",
  ],
  thriving: [
    "palm-west",
    "palm-east",
    "bridge",
    "lily-west",
    "lily-east",
    "lily-south",
    "flower-west",
    "flower-east",
    "flower-south-west",
    "flower-south-east",
  ],
  "community-success": [
    "palm-south-west",
    "palm-south-east",
    "success-shrub-north",
    "success-shrub-west",
    "success-shrub-east",
    "success-flower-north-west",
    "success-flower-north-east",
    "success-flower-south",
    "lotus-bud",
  ],
  perfect: [
    "perfect-flower-west",
    "perfect-flower-east",
    "perfect-flower-north",
    "perfect-flower-south",
    "lotus-flower",
  ],
};

const PHASE_ORDER: OasisPhase[] = [
  "dry",
  "first-life",
  "growing",
  "thriving",
  "community-success",
  "perfect",
];

function clampPercent(percent: number): number {
  if (Number.isNaN(percent)) return 0;
  return Math.min(100, Math.max(0, percent));
}

function clampDrops(totalDrops: number, maxDrops: number): number {
  if (!Number.isFinite(totalDrops)) return 0;
  if (maxDrops <= 0) return 0;
  return Math.min(maxDrops, Math.max(0, Math.round(totalDrops)));
}

export function createOasisSceneSnapshot({
  totalDrops,
  maxDrops,
  displayPercent,
  isCommunitySuccess,
  isPerfect,
  members,
  currentMemberId,
}: {
  totalDrops: number;
  maxDrops: number;
  displayPercent?: number;
  isCommunitySuccess?: boolean;
  isPerfect?: boolean;
  members?: readonly OasisSceneMember[];
  currentMemberId?: string | null;
}): OasisSceneSnapshot {
  const safeMaxDrops = Math.max(0, Math.round(maxDrops));
  const safeTotalDrops = clampDrops(totalDrops, safeMaxDrops);
  const exactPercent =
    safeMaxDrops > 0 ? (safeTotalDrops / safeMaxDrops) * 100 : 0;
  const requiredDrops = Math.ceil(safeMaxDrops * 0.75);

  return {
    progress: {
      totalDrops: safeTotalDrops,
      maxDrops: safeMaxDrops,
      displayPercent: clampPercent(displayPercent ?? exactPercent),
      isCommunitySuccess:
        isCommunitySuccess ??
        (safeMaxDrops > 0 && safeTotalDrops >= requiredDrops),
      isPerfect:
        isPerfect ?? (safeMaxDrops > 0 && safeTotalDrops >= safeMaxDrops),
    },
    members: (members ?? []).slice(0, 5).map((member) => ({
      ...member,
      contributedDropsToday: Math.min(
        4,
        Math.max(0, Math.round(member.contributedDropsToday)),
      ),
    })),
    currentMemberId: currentMemberId ?? null,
  };
}

function snapshotFromPercent(percent: number): OasisSceneSnapshot {
  const safePercent = clampPercent(percent);
  return createOasisSceneSnapshot({
    totalDrops: safePercent,
    maxDrops: 100,
    displayPercent: safePercent,
    isCommunitySuccess: safePercent >= 75,
    isPerfect: safePercent >= 100,
  });
}

function getVisibleTileIds(phase: OasisPhase): string[] {
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER.slice(0, phaseIndex + 1).flatMap((phaseName) =>
    TILE_IDS_BY_PHASE[phaseName].filter((tileId) => {
      if (phase !== "perfect" && tileId === "lotus-flower") return false;
      if (phase === "perfect" && tileId === "lotus-bud") return false;
      return true;
    }),
  );
}

/**
 * 서버 사실 snapshot을 오아시스 장면 전용 상태로 변환한다.
 * 숫자 입력은 개발 중인 기존 컨셉 장면의 호환성을 위해 유지한다.
 */
export function deriveOasisSceneModel(
  input: number | OasisSceneSnapshot,
): OasisSceneModel {
  const snapshot =
    typeof input === "number" ? snapshotFromPercent(input) : input;
  const safePercent = clampPercent(snapshot.progress.displayPercent);

  const phase: OasisPhase = snapshot.progress.isPerfect
    ? "perfect"
    : snapshot.progress.isCommunitySuccess
      ? "community-success"
      : safePercent === 0
        ? "dry"
        : safePercent < 25
          ? "first-life"
          : safePercent < 50
            ? "growing"
            : "thriving";

  const lighting: OasisLighting =
    phase === "perfect"
      ? "perfect"
      : phase === "community-success"
        ? "success"
        : phase === "thriving"
          ? "alive"
          : phase === "dry"
            ? "dry"
            : "soft";

  return {
    percent: safePercent,
    phase,
    lighting,
    // 첫 물방울은 식별 가능한 최소 수위로 보여 주고 이후 연속 증가한다.
    waterLevel:
      safePercent === 0 ? 0 : 0.16 + (safePercent / 100) * 0.84,
    hasWater: safePercent > 0,
    edgePlantLevel: safePercent < 25 ? 0 : safePercent < 75 ? 1 : 2,
    bloomState:
      phase === "perfect"
        ? "flower"
        : phase === "community-success"
          ? "bud"
          : "none",
    bloomProgress:
      safePercent < 75
        ? 0
        : phase === "perfect"
          ? 1
          : 0.55 + ((safePercent - 75) / 25) * 0.45,
    isCommunitySuccess: snapshot.progress.isCommunitySuccess,
    isPerfect: snapshot.progress.isPerfect,
    visibleTileIds: getVisibleTileIds(phase),
    snapshot,
  };
}

export function getOasisPhaseTileIds(phase: OasisPhase): readonly string[] {
  return TILE_IDS_BY_PHASE[phase];
}
