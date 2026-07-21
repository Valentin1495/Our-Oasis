import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import type { MemberOrbitPosition } from "../sharedOasisSceneLayout";
import {
  getMemberAccent,
  getMemberIslandStatus,
  getMemberLabelSide,
  normalizeMemberDrops,
} from "./memberIslandPresentation";

const ISLAND_FLOAT_OFFSET_PX = 4;
const ISLAND_FLOAT_DURATION_SECONDS = 2.5;
const ISLAND_FLOAT_DELAY_SECONDS = 0.18;

interface Props {
  id: string;
  name: string;
  drops: number;
  hasWaterRecordToday: boolean;
  islandImage: string;
  avatarImage: string;
  position: MemberOrbitPosition;
  index: number;
  isCurrentMember: boolean;
  isSourceActive: boolean;
  reducedMotion: boolean;
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
  index,
  isCurrentMember,
  isSourceActive,
  reducedMotion,
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
  const floatDelay = index * ISLAND_FLOAT_DELAY_SECONDS;
  const floatAnimation = reducedMotion
    ? { y: 0 }
    : {
        y: [
          -ISLAND_FLOAT_OFFSET_PX,
          ISLAND_FLOAT_OFFSET_PX,
          -ISLAND_FLOAT_OFFSET_PX,
        ],
      };
  const floatTransition = reducedMotion
    ? { duration: 0 }
    : {
        delay: floatDelay,
        duration: ISLAND_FLOAT_DURATION_SECONDS,
        ease: "easeInOut" as const,
        repeat: Infinity,
      };

  const content: ReactNode = (
    <>
      <span className="shared-oasis-scene__island-stage" aria-hidden="true">
        {isSourceActive && (
          <motion.span
            className="shared-oasis-scene__island-ripple"
            initial={{ opacity: 0.8, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        )}
        <span className="shared-oasis-scene__island-status-ring" />
        <img className="shared-oasis-scene__island" src={islandImage} alt="" />
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
      data-label-side={labelSide}
      style={
        {
          "--member-x": `${position.xPercent}%`,
          "--member-y": `${position.yPercent}%`,
          "--member-z": position.zIndex,
          "--member-accent": accent.accent,
          "--member-accent-soft": accent.soft,
          "--member-accent-ink": accent.ink,
        } as CSSProperties
      }
    >
      {isCurrentMember ? (
        <motion.button
          type="button"
          className="shared-oasis-scene__member-cluster shared-oasis-scene__island-button"
          data-current-member="true"
          data-float-delay={floatDelay}
          disabled={interactionDisabled}
          aria-label={`${name}의 섬, 오늘 물방울 ${normalizedDrops}개 기여. 물 한 잔 채우기`}
          animate={floatAnimation}
          transition={floatTransition}
          whileTap={
            interactionDisabled || reducedMotion ? undefined : { scale: 0.96 }
          }
          onClick={() => {
            if (interactionDisabled || !onGiveWater) return;
            void onGiveWater();
          }}
        >
          {content}
        </motion.button>
      ) : (
        <motion.span
          className="shared-oasis-scene__member-cluster"
          data-float-delay={floatDelay}
          animate={floatAnimation}
          transition={floatTransition}
          aria-hidden="true"
        >
          {content}
        </motion.span>
      )}

      <span className="visually-hidden">
        {isCurrentMember ? "현재 사용자, " : ""}
        {name}, {hasWaterRecordToday ? "오늘 기록 참여, " : "오늘 기록 대기, "}
        오늘 물방울 {normalizedDrops}개 기여
      </span>
    </li>
  );
}
