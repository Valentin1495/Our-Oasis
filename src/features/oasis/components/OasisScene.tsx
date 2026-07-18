import type { OasisStage } from "../../../types";
import { PrototypeOasisScene } from "../scene/PrototypeOasisScene";
import { LegacyOasisScene } from "./LegacyOasisScene";

export type OasisSceneVariant = "prototype" | "legacy";

interface Props {
  stage: OasisStage;
  sharedProgressPercent: number;
  dropAnimationTick: number;
  isFullComplete: boolean;
  showSpecialCharacter?: boolean;
  isFinalOasisUnlocked?: boolean;
  reducedMotion?: boolean;
  variant?: OasisSceneVariant;
}

/**
 * 새 시각 프로토타입을 기본으로 렌더링하되, 개발 패널에서 기존 장면과
 * 즉시 비교할 수 있도록 동일한 public props를 유지하는 facade다.
 */
export function OasisScene({
  stage,
  sharedProgressPercent,
  dropAnimationTick,
  isFullComplete,
  showSpecialCharacter = false,
  isFinalOasisUnlocked = false,
  reducedMotion = false,
  variant = "prototype",
}: Props) {
  if (variant === "legacy") {
    return (
      <LegacyOasisScene
        stage={stage}
        sharedProgressPercent={sharedProgressPercent}
        dropAnimationTick={dropAnimationTick}
        isFullComplete={isFullComplete}
        showSpecialCharacter={showSpecialCharacter}
        isFinalOasisUnlocked={isFinalOasisUnlocked}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <PrototypeOasisScene
      percent={sharedProgressPercent}
      dropAnimationTick={dropAnimationTick}
      reducedMotion={reducedMotion}
      showSpecialCharacter={showSpecialCharacter}
      showFinalReward={isFinalOasisUnlocked}
    />
  );
}
