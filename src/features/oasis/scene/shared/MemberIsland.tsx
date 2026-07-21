import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import type { MemberOrbitPosition } from "../sharedOasisSceneLayout";
import {
  getMemberAccent,
  getIslandVisualState,
  getMemberAnimationTiming,
  getMemberIslandStatus,
  getMemberLabelSide,
  MEMBER_DAILY_DROP_TARGET,
  normalizeMemberDrops,
} from "./memberIslandPresentation";

interface Props {
  id: string;
  name: string;
  drops: number;
  hasWaterRecordToday: boolean;
  islandImage: string;
  avatarImage: string;
  position: MemberOrbitPosition;
  isCurrentMember: boolean;
  isSourceActive: boolean;
  interactionDisabled: boolean;
  onGiveWater?: () => void | Promise<void>;
}

export function MemberIsland({
  id,
  name,
  drops,
  hasWaterRecordToday,
  islandImage,
  avatarImage,
  position,
  isCurrentMember,
  isSourceActive,
  interactionDisabled,
  onGiveWater,
}: Props) {
  const normalizedDrops = normalizeMemberDrops(drops);
  const status = getMemberIslandStatus({
    drops: normalizedDrops,
    hasWaterRecordToday,
  });
  const accent = getMemberAccent(id);
  const labelSide = getMemberLabelSide(position.xPercent);
  const visualState = getIslandVisualState(
    normalizedDrops,
    MEMBER_DAILY_DROP_TARGET,
  );
  const animationTiming = getMemberAnimationTiming(id);

  const content: ReactNode = (
    <>
      <span className="shared-oasis-scene__island-ground" aria-hidden="true">
        <span className="shared-oasis-scene__island-shadow" />
      </span>

      <span
        className="shared-oasis-scene__island-lift"
        data-float-lift={visualState.liftPx}
        aria-hidden="true"
      >
        <span className="shared-oasis-scene__island-haze" />
        <span className="shared-oasis-scene__island-mirage-tail" />
        <span
          className="shared-oasis-scene__island-float"
          data-float-delay={animationTiming.delaySeconds}
          data-float-duration={animationTiming.durationSeconds}
        >
          <span className="shared-oasis-scene__island-stage">
            {isSourceActive && (
              <motion.span
                className="shared-oasis-scene__island-ripple"
                initial={{ opacity: 0.8, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}
            <img
              className="shared-oasis-scene__island"
              src={islandImage}
              alt=""
            />
          </span>
        </span>
        <span className="shared-oasis-scene__island-focus-halo" />
        {status === "complete" && (
          <span
            className="shared-oasis-scene__island-complete-mark"
            aria-hidden="true"
          >
            ✓
          </span>
        )}
      </span>

      <span
        className="shared-oasis-scene__member-connector"
        data-depth={position.depth}
        aria-hidden="true"
      />

      <span
        className="shared-oasis-scene__member-chip"
        data-depth={position.depth}
        data-label-side={labelSide}
        aria-hidden="true"
      >
        <span className="shared-oasis-scene__member-avatar">
          <img
            className="shared-oasis-scene__member-avatar-image"
            src={avatarImage}
            alt=""
          />
        </span>
        <span className="shared-oasis-scene__member-copy">
          <span className="shared-oasis-scene__member-name">
            <span className="shared-oasis-scene__member-nickname">{name}</span>
            {isCurrentMember && (
              <span className="shared-oasis-scene__member-me">나</span>
            )}
          </span>
          <span className="shared-oasis-scene__member-drops">
            <span aria-hidden="true">💧</span> {normalizedDrops}/4
          </span>
        </span>
      </span>
    </>
  );

  return (
    <li
      className={`shared-oasis-scene__member ${
        isSourceActive ? "shared-oasis-scene__member--active" : ""
      }`}
      data-member-id={id}
      data-member-status={status}
      data-current-member={isCurrentMember}
      data-depth={position.depth}
      data-depth-ratio={position.depthRatio}
      data-label-side={labelSide}
      style={
        {
          "--member-x": `${position.xPercent}%`,
          "--member-y": `${position.yPercent}%`,
          "--member-z": position.zIndex,
          "--member-depth-scale": position.depthScale,
          "--member-depth-brightness": position.depthBrightness,
          "--member-depth-opacity": position.depthOpacity,
          "--member-accent": accent.accent,
          "--member-accent-soft": accent.soft,
          "--member-accent-ink": accent.ink,
          "--member-lift": `${visualState.liftPx}px`,
          "--member-float-amount": `${visualState.floatAmountPx}px`,
          "--member-shadow-scale-x": visualState.shadowScaleX,
          "--member-shadow-scale-y": visualState.shadowScaleY,
          "--member-shadow-opacity": visualState.shadowOpacity,
          "--member-shadow-blur": `${visualState.shadowBlurPx}px`,
          "--member-haze-opacity": visualState.hazeOpacity,
          "--member-mirage-tail-opacity": visualState.mirageTailOpacity,
          "--member-saturation": visualState.saturation,
          "--member-brightness": visualState.brightness,
          "--member-island-opacity": visualState.islandOpacity,
          "--member-float-duration": `${animationTiming.durationSeconds}s`,
          "--member-float-delay": `${animationTiming.delaySeconds}s`,
          "--member-haze-duration": `${animationTiming.hazeDurationSeconds}s`,
        } as CSSProperties
      }
    >
      {isCurrentMember ? (
        <button
          type="button"
          className="shared-oasis-scene__member-cluster shared-oasis-scene__island-button"
          data-current-member="true"
          disabled={interactionDisabled}
          aria-label={`${name}의 섬, 오늘 물방울 ${normalizedDrops}개 기여. 물 한 잔 채우기`}
          onClick={() => {
            if (interactionDisabled || !onGiveWater) return;
            void onGiveWater();
          }}
        >
          {content}
        </button>
      ) : (
        <span className="shared-oasis-scene__member-cluster" aria-hidden="true">
          {content}
        </span>
      )}

      <span className="visually-hidden">
        {isCurrentMember ? "현재 사용자, " : ""}
        {name}, {hasWaterRecordToday ? "오늘 기록 참여, " : "오늘 기록 대기, "}
        오늘 물방울 {normalizedDrops}개 기여
      </span>
    </li>
  );
}
