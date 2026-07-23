import type { CSSProperties } from "react";
import { MotionConfig, motion } from "motion/react";
import oasisDryImage from "./shared/assets/oasis_dry.png";
import oasisLushImage from "./shared/assets/oasis_lush.png";
import oasisMysticImage from "./shared/assets/oasis_mystic.png";
import {
  OASIS_SCENE_TIMING,
  type OasisSceneEvent,
  type OasisSceneSequencePhase,
} from "./oasisSceneEvents";
import {
  getOasisStatus,
  normalizeProgressPercentage,
  type OasisStatus,
} from "./oasisState";
import { MemberIsland } from "./shared/MemberIsland";
import {
  deriveStageRingProgress,
  getMemberDockPosition,
  getWaterDropArc,
  SHARED_OASIS_LAYOUT,
} from "./sharedOasisSceneLayout";
import "./SharedOasisScene.css";

export interface Member {
  id: string;
  name: string;
  drops: number;
  hasWaterRecordToday: boolean;
  islandImage: string;
  avatarImage: string;
}

export interface SharedOasisSceneProps {
  progressPercentage: number;
  members: Member[];
  reducedMotion?: boolean;
  announcement?: string;
  currentMemberId?: string | null;
  event?: OasisSceneEvent | null;
  phase?: OasisSceneSequencePhase;
  impactIndex?: number;
  isAnimating?: boolean;
  isInteractionDisabled?: boolean;
  onGiveWater?: () => void | Promise<void>;
  onTravelComplete?: () => void;
  onImpactComplete?: () => void;
}

const WATER_TRAVEL_DURATION_SECONDS = OASIS_SCENE_TIMING.travelDuration / 1000;
const AURA_IMPACT_DURATION_SECONDS = OASIS_SCENE_TIMING.impactDuration / 1000;

const OASIS_LAYERS: ReadonlyArray<{
  status: OasisStatus;
  image: string;
}> = [
  { status: "IN_PROGRESS", image: oasisDryImage },
  { status: "SHARED_SUCCESS", image: oasisLushImage },
  { status: "PERFECT_SUCCESS", image: oasisMysticImage },
];

const STATUS_LABELS: Record<OasisStatus, string> = {
  IN_PROGRESS: "함께 물을 모으고 있는 오아시스",
  SHARED_SUCCESS: "친구들과 완성한 풍성한 오아시스",
  PERFECT_SUCCESS: "모두 함께 완벽하게 완성한 신비로운 오아시스",
};

export function SharedOasisScene({
  progressPercentage,
  members,
  reducedMotion = false,
  announcement = "",
  currentMemberId = null,
  event = null,
  phase = "idle",
  impactIndex = 0,
  isAnimating = false,
  isInteractionDisabled = false,
  onGiveWater,
  onTravelComplete,
  onImpactComplete,
}: SharedOasisSceneProps) {
  const normalizedProgress = normalizeProgressPercentage(progressPercentage);
  const status = getOasisStatus(normalizedProgress);
  const roundedProgress = Math.round(normalizedProgress);
  const ringProgress = deriveStageRingProgress(normalizedProgress);
  const dropActorMemberId =
    event?.dropActorMemberIds[impactIndex] ?? event?.actorMemberId ?? null;
  const dropActorIndex = members.findIndex(
    (member) => member.id === dropActorMemberId,
  );
  const dropOrigin =
    dropActorIndex >= 0
      ? getMemberDockPosition(dropActorIndex, members.length)
      : {
          xPercent: SHARED_OASIS_LAYOUT.centerXPercent,
          yPercent: SHARED_OASIS_LAYOUT.dockYPercent,
        };
  const waterDropArc = getWaterDropArc(dropOrigin);
  const interactionDisabled =
    isInteractionDisabled || isAnimating || !onGiveWater;

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <section
        className={`shared-oasis-scene ${
          reducedMotion ? "shared-oasis-scene--reduced-motion" : ""
        }`}
        data-oasis-status={status}
        data-reduced-motion={reducedMotion}
        data-animation-phase={phase}
        aria-busy={isAnimating}
        aria-label={`${STATUS_LABELS[status]}, 공동 달성률 ${roundedProgress}%`}
        style={
          {
            "--shared-ring-offset": 1 - ringProgress.sharedProgress,
            "--perfect-ring-offset": 1 - ringProgress.perfectProgress,
            "--oasis-layer-z": SHARED_OASIS_LAYOUT.oasisZIndex,
            "--oasis-center-x": `${SHARED_OASIS_LAYOUT.centerXPercent}%`,
            "--oasis-center-y": `${SHARED_OASIS_LAYOUT.centerYPercent}%`,
          } as CSSProperties
        }
      >
        <div className="shared-oasis-scene__stage-light" aria-hidden="true" />

        <div
          className="shared-oasis-scene__stage"
          aria-label={`공동 성공 링 ${Math.round(
            ringProgress.sharedProgress * 100,
          )}%, 완벽 성공 링 ${Math.round(ringProgress.perfectProgress * 100)}%`}
        >
          <svg
            className="shared-oasis-scene__rings"
            viewBox="0 0 320 320"
            aria-hidden="true"
          >
            <circle
              className="shared-oasis-scene__ring-track shared-oasis-scene__ring-track--perfect"
              cx="160"
              cy="160"
              r="148"
              pathLength="1"
            />
            <circle
              className="shared-oasis-scene__ring shared-oasis-scene__ring--perfect"
              data-stage-ring="perfect"
              data-ring-progress={ringProgress.perfectProgress}
              cx="160"
              cy="160"
              r="148"
              pathLength="1"
            />
            <circle
              className="shared-oasis-scene__ring-track shared-oasis-scene__ring-track--shared"
              cx="160"
              cy="160"
              r="135"
              pathLength="1"
            />
            <circle
              className="shared-oasis-scene__ring shared-oasis-scene__ring--shared"
              data-stage-ring="shared"
              data-ring-progress={ringProgress.sharedProgress}
              cx="160"
              cy="160"
              r="135"
              pathLength="1"
            />
          </svg>

          <div className="shared-oasis-scene__oasis" aria-hidden="true">
            <span className="shared-oasis-scene__oasis-shadow" />
            {OASIS_LAYERS.map((layer) => {
              const isActive = layer.status === status;

              return (
                <img
                  key={layer.status}
                  className={`shared-oasis-scene__oasis-image ${
                    isActive ? "shared-oasis-scene__oasis-image--active" : ""
                  }`}
                  src={layer.image}
                  alt=""
                  data-oasis-layer={layer.status}
                  data-active={isActive}
                />
              );
            })}
          </div>

          <div className="shared-oasis-scene__impact-anchor" aria-hidden="true">
            <motion.span
              className="shared-oasis-scene__stage-breath"
              initial={false}
              animate={
                reducedMotion
                  ? { opacity: 0.6, scale: 1 }
                  : {
                      opacity: [0.48, 0.68, 0.48],
                      scale: [0.98, 1.02, 0.98],
                    }
              }
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 4.6,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }
              }
            />
            {phase === "impact" && event?.kind === "contribution" && (
              <motion.span
                key={`${event.id}-${impactIndex}`}
                className="shared-oasis-scene__impact-ripple"
                data-impact-index={impactIndex}
                initial={{ opacity: 0.9, scale: 0.55 }}
                animate={{ opacity: 0, scale: 1.35 }}
                transition={{
                  duration: AURA_IMPACT_DURATION_SECONDS,
                  ease: "easeOut",
                }}
                onAnimationComplete={onImpactComplete}
              />
            )}
          </div>

          {status === "PERFECT_SUCCESS" && (
            <span
              className="shared-oasis-scene__perfect-crown"
              aria-hidden="true"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <i
                  key={index}
                  style={{ "--spark-index": index } as CSSProperties}
                />
              ))}
            </span>
          )}
        </div>

        <ul
          className="shared-oasis-scene__members"
          aria-label="오늘 멤버 참여 상태"
        >
          {members.slice(0, 5).map((member, index) => (
            <MemberIsland
              key={member.id}
              id={member.id}
              name={member.name}
              drops={member.drops}
              hasWaterRecordToday={member.hasWaterRecordToday}
              islandImage={member.islandImage}
              avatarImage={member.avatarImage}
              position={getMemberDockPosition(index, members.length)}
              isCurrentMember={member.id === currentMemberId}
              isSourceActive={
                event?.kind === "contribution" &&
                (phase === "source" || phase === "travel") &&
                dropActorMemberId === member.id
              }
              interactionDisabled={interactionDisabled}
              onGiveWater={onGiveWater}
            />
          ))}
        </ul>

        {phase === "travel" && event?.kind === "contribution" && (
          <motion.span
            key={`${event.id}-${impactIndex}`}
            className="shared-oasis-scene__water-drop-path"
            data-actor-member-id={dropActorMemberId ?? ""}
            data-drop-index={impactIndex}
            data-path-left={waterDropArc.left.join(",")}
            data-path-top={waterDropArc.top.join(",")}
            initial={{
              left: waterDropArc.left[0],
              top: waterDropArc.top[0],
              opacity: 0.7,
            }}
            animate={{
              left: waterDropArc.left,
              top: waterDropArc.top,
              opacity: [0.7, 1, 1, 0.25],
            }}
            transition={{
              left: {
                duration: WATER_TRAVEL_DURATION_SECONDS,
                ease: "linear",
                times: [0, 0.48, 1],
              },
              top: {
                duration: WATER_TRAVEL_DURATION_SECONDS,
                ease: "easeInOut",
                times: [0, 0.48, 1],
              },
              opacity: {
                duration: WATER_TRAVEL_DURATION_SECONDS,
                ease: "linear",
                times: [0, 0.08, 0.9, 1],
              },
            }}
            onAnimationComplete={onTravelComplete}
            aria-hidden="true"
          >
            <motion.span
              className="shared-oasis-scene__water-drop"
              initial={{ rotate: 45, scale: 0.72 }}
              animate={{ rotate: 45, scale: [0.72, 1.08, 0.8] }}
              transition={{
                duration: WATER_TRAVEL_DURATION_SECONDS,
                ease: "easeInOut",
                times: [0, 0.48, 1],
              }}
            />
          </motion.span>
        )}

        <p
          className="visually-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}
