import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { Tooltip } from "@toss/tds-mobile";
import {
  getWakeUpHintLayout,
  type MemberDockPosition,
} from "../sharedOasisSceneLayout";
import {
  getMemberAccent,
  getMemberIslandStatus,
  normalizeMemberDrops,
} from "./memberIslandPresentation";

interface Props {
  id: string;
  name: string;
  drops: number;
  hasWaterRecordToday: boolean;
  islandImage: string;
  avatarImage: string;
  position: MemberDockPosition;
  isCurrentMember: boolean;
  isSourceActive: boolean;
  interactionDisabled: boolean;
  showWakeUpHint?: boolean;
  waterOriginRef?: (node: HTMLSpanElement | null) => void;
  onWakeUp?: (memberId: string) => void;
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
  showWakeUpHint = false,
  waterOriginRef,
  onWakeUp,
}: Props) {
  const normalizedDrops = normalizeMemberDrops(drops);
  const status = getMemberIslandStatus({
    drops: normalizedDrops,
    hasWaterRecordToday,
  });
  const accent = getMemberAccent(id);
  const waterOriginSide = position.xPercent <= 50 ? "right" : "left";
  const wakeUpHintLayout = getWakeUpHintLayout(position.xPercent);
  const isComplete = status === "complete";
  const wakeUpAriaLabel = interactionDisabled
    ? `${name}의 섬, 처리 중`
    : isComplete
      ? `${name}의 섬, 오늘 물방울을 모두 채웠어요`
      : `${name}의 섬, 오늘 물방울 ${normalizedDrops}개 기여. 깨우기`;

  const content: ReactNode = (
    <>
      <span
        className="shared-oasis-scene__member-art"
        data-visual-style="sticker"
        aria-hidden="true"
      >
        {isSourceActive && (
          <motion.span
            className="shared-oasis-scene__member-source-ripple"
            initial={{ opacity: 0.72, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.45 }}
            transition={{ duration: 0.72, ease: "easeOut" }}
          />
        )}
        <img
          className="shared-oasis-scene__member-island"
          src={islandImage}
          alt=""
        />
        <span
          ref={waterOriginRef}
          className="shared-oasis-scene__member-water-origin"
          data-water-origin-side={waterOriginSide}
        />
        <Tooltip
          message="눌러서 깨워봐요!"
          open={showWakeUpHint}
          className={
            wakeUpHintLayout.horizontalInset > 0
              ? "shared-oasis-scene__wake-up-tooltip--left"
              : wakeUpHintLayout.horizontalInset < 0
                ? "shared-oasis-scene__wake-up-tooltip--right"
                : undefined
          }
          placement="top"
          size="small"
          anchorPositionByRatio={wakeUpHintLayout.anchorPositionByRatio}
          clipToEnd={wakeUpHintLayout.clipToEnd}
          style={{ translate: `${wakeUpHintLayout.horizontalInset}px 0` }}
        >
          <span className="shared-oasis-scene__member-avatar">
            <img src={avatarImage} alt="" />
          </span>
        </Tooltip>
        {status === "complete" && (
          <span
            className="shared-oasis-scene__member-complete"
            aria-hidden="true"
          >
            ✓
          </span>
        )}
      </span>

      <span className="shared-oasis-scene__member-name">
        <span className="shared-oasis-scene__member-nickname">{name}</span>
        {isCurrentMember && (
          <span className="shared-oasis-scene__member-me">나</span>
        )}
      </span>

      <span
        className="shared-oasis-scene__member-slots"
        aria-label={`물방울 ${normalizedDrops}/4`}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className="shared-oasis-scene__member-slot"
            data-filled={index < normalizedDrops}
            aria-hidden="true"
          />
        ))}
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
        <span className="shared-oasis-scene__member-card" aria-hidden="true">
          {content}
        </span>
      ) : (
        <button
          type="button"
          className="shared-oasis-scene__member-card shared-oasis-scene__member-button"
          disabled={interactionDisabled}
          aria-label={wakeUpAriaLabel}
          onClick={() => {
            if (interactionDisabled || !onWakeUp) return;
            onWakeUp(id);
          }}
        >
          {content}
        </button>
      )}

      <span className="visually-hidden">
        {isCurrentMember ? "현재 사용자, " : ""}
        {name}, {hasWaterRecordToday ? "오늘 기록 참여, " : "오늘 기록 대기, "}
        오늘 물방울 {normalizedDrops}개 기여
      </span>
    </li>
  );
}
