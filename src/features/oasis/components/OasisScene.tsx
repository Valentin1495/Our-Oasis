import { getOasisStage } from "../oasisRules";
import { ConceptATerrarium } from "../scene/ConceptATerrarium";
import { ConceptBWatercolor } from "../scene/ConceptBWatercolor";
import {
  SharedOasisScene,
  type Member as SharedOasisMember,
} from "../scene/SharedOasisScene";
import type {
  OasisSceneEvent,
  OasisSceneSequencePhase,
} from "../scene/oasisSceneEvents";
import type { OasisSceneSnapshot } from "../scene/oasisSceneModel";
import { assignMemberAvatarImages } from "../scene/shared/memberAvatarImage";
import { getMemberIslandImage } from "../scene/shared/memberIslandImage";
import { LegacyOasisScene } from "./LegacyOasisScene";

export type OasisSceneVariant = "shared" | "legacy" | "concept-a" | "concept-b";

interface Props {
  snapshot: OasisSceneSnapshot;
  event?: OasisSceneEvent | null;
  phase?: OasisSceneSequencePhase;
  impactIndex?: number;
  announcement?: string;
  showSpecialCharacter?: boolean;
  isFinalOasisUnlocked?: boolean;
  reducedMotion?: boolean;
  variant?: OasisSceneVariant;
  isAnimating?: boolean;
  isInteractionDisabled?: boolean;
  onGiveWater?: () => void | Promise<void>;
  onTravelComplete?: () => void;
  onImpactComplete?: () => void;
}

function getSharedOasisMembers(
  snapshot: OasisSceneSnapshot,
): SharedOasisMember[] {
  const avatarImages = assignMemberAvatarImages(
    snapshot.members.map((member) => member.id),
  );

  return snapshot.members.map((member) => ({
    id: member.id,
    name: member.nickname,
    drops: member.contributedDropsToday,
    hasWaterRecordToday: member.hasWaterRecordToday,
    islandImage: getMemberIslandImage(member.id),
    avatarImage: avatarImages.get(member.id) ?? "",
  }));
}

/**
 * 공유형 장면을 기본으로 렌더링하고 개발 패널의 이전 컨셉 비교를 지원한다.
 * shared 장면의 표시 퍼센트와 멤버 사실 상태를 PNG 표현 모델로 변환한다.
 */
export function OasisScene({
  snapshot,
  event = null,
  phase = "idle",
  impactIndex = 0,
  announcement = "",
  showSpecialCharacter = false,
  isFinalOasisUnlocked = false,
  reducedMotion = false,
  variant = "shared",
  isAnimating = false,
  isInteractionDisabled = false,
  onGiveWater,
  onTravelComplete,
  onImpactComplete,
}: Props) {
  const percent = snapshot.progress.displayPercent;

  if (variant === "legacy") {
    return (
      <LegacyOasisScene
        stage={getOasisStage(percent)}
        sharedProgressPercent={percent}
        dropAnimationTick={event?.kind === "contribution" ? 1 : 0}
        isFullComplete={snapshot.progress.isPerfect}
        showSpecialCharacter={showSpecialCharacter}
        isFinalOasisUnlocked={isFinalOasisUnlocked}
        reducedMotion={reducedMotion}
      />
    );
  }

  if (variant === "concept-a") {
    return (
      <ConceptATerrarium
        percent={percent}
        dropAnimationTick={event?.kind === "contribution" ? 1 : 0}
        reducedMotion={reducedMotion}
      />
    );
  }

  if (variant === "concept-b") {
    return (
      <ConceptBWatercolor
        percent={percent}
        dropAnimationTick={event?.kind === "contribution" ? 1 : 0}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <SharedOasisScene
      progressPercentage={percent}
      members={getSharedOasisMembers(snapshot)}
      announcement={announcement}
      reducedMotion={reducedMotion}
      currentMemberId={snapshot.currentMemberId}
      event={event}
      phase={phase}
      impactIndex={impactIndex}
      isAnimating={isAnimating}
      isInteractionDisabled={isInteractionDisabled}
      onGiveWater={onGiveWater}
      onTravelComplete={onTravelComplete}
      onImpactComplete={onImpactComplete}
    />
  );
}
