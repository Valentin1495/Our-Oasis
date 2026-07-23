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

interface Props {
  snapshot: OasisSceneSnapshot;
  event?: OasisSceneEvent | null;
  phase?: OasisSceneSequencePhase;
  impactIndex?: number;
  announcement?: string;
  reducedMotion?: boolean;
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
 * 서버 장면 snapshot의 퍼센트와 멤버 사실 상태를 공유 오아시스 표현으로 변환한다.
 */
export function OasisScene({
  snapshot,
  event = null,
  phase = "idle",
  impactIndex = 0,
  announcement = "",
  reducedMotion = false,
  isAnimating = false,
  isInteractionDisabled = false,
  onGiveWater,
  onTravelComplete,
  onImpactComplete,
}: Props) {
  const percent = snapshot.progress.displayPercent;

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
