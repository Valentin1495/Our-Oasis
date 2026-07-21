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
import { MemberConnectionLayer } from "./shared/MemberConnectionLayer";
import {
  getMemberOrbitPosition,
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
const BLOOM_BREATH_DURATION_SECONDS = 4.2;

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

const PROGRESS_MILESTONES = [
  { percent: 0, label: "" },
  { percent: 25, label: "" },
  { percent: 50, label: "" },
  { percent: 75, label: "공동 성공" },
  { percent: 100, label: "완벽 성공" },
] as const;

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
  const dropActorMemberId =
    event?.dropActorMemberIds[impactIndex] ?? event?.actorMemberId ?? null;
  const dropActorIndex = members.findIndex(
    (member) => member.id === dropActorMemberId,
  );
  const dropOrigin =
    dropActorIndex >= 0
      ? getMemberOrbitPosition(dropActorIndex, members.length)
      : {
          xPercent: SHARED_OASIS_LAYOUT.centerXPercent,
          yPercent: SHARED_OASIS_LAYOUT.centerYPercent + 30,
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
            "--oasis-layer-z": SHARED_OASIS_LAYOUT.oasisZIndex,
            "--oasis-center-x": `${SHARED_OASIS_LAYOUT.centerXPercent}%`,
            "--oasis-center-y": `${SHARED_OASIS_LAYOUT.centerYPercent}%`,
            "--scene-progress": `${normalizedProgress}%`,
          } as CSSProperties
        }
      >
        <div className="shared-oasis-scene__background" aria-hidden="true" />

        <MemberConnectionLayer members={members} />

        <div
          className="shared-oasis-scene__progress"
          aria-label={`공동 오아시스 진행률 ${roundedProgress}%`}
        >
          <div
            className="shared-oasis-scene__progress-track"
            aria-hidden="true"
          >
            <span className="shared-oasis-scene__progress-fill" />
          </div>
          <ol className="shared-oasis-scene__milestones">
            {PROGRESS_MILESTONES.map((milestone) => {
              const isReached = normalizedProgress >= milestone.percent;
              const isSharedMilestone = milestone.percent === 75;
              const isPerfectMilestone = milestone.percent === 100;

              return (
                <li
                  key={milestone.percent}
                  className={`shared-oasis-scene__milestone ${
                    isReached ? "shared-oasis-scene__milestone--reached" : ""
                  } ${
                    isSharedMilestone
                      ? "shared-oasis-scene__milestone--shared"
                      : ""
                  } ${
                    isPerfectMilestone
                      ? "shared-oasis-scene__milestone--perfect"
                      : ""
                  }`}
                  data-progress-milestone={milestone.percent}
                  data-reached={isReached}
                >
                  <span className="shared-oasis-scene__milestone-dot">
                    {isSharedMilestone && (
                      <svg
                        className="shared-oasis-scene__share-mark"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M8.2 10.4 15.5 6M8.2 13.6l7.3 4.4" />
                        <circle cx="6" cy="12" r="2.4" />
                        <circle cx="17.8" cy="5" r="2.4" />
                        <circle cx="17.8" cy="19" r="2.4" />
                      </svg>
                    )}
                    {isPerfectMilestone && (
                      <img src={oasisMysticImage} alt="" aria-hidden="true" />
                    )}
                  </span>
                  <strong>{milestone.percent}%</strong>
                  {milestone.label && <span>{milestone.label}</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="shared-oasis-scene__bloom-anchor" aria-hidden="true">
          <motion.div
            className="shared-oasis-scene__bloom-aura"
            initial={false}
            animate={
              reducedMotion
                ? { opacity: 0.7, scale: 1 }
                : {
                    opacity: [0.6, 0.8, 0.6],
                    scale: [0.98, 1.02, 0.98],
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: BLOOM_BREATH_DURATION_SECONDS,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }
            }
          />
          {phase === "impact" && event?.kind === "contribution" && (
            <motion.div
              key={`${event.id}-${impactIndex}`}
              className="shared-oasis-scene__impact-ripple"
              data-impact-index={impactIndex}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 1.3 }}
              transition={{
                duration: AURA_IMPACT_DURATION_SECONDS,
                ease: "easeOut",
              }}
              onAnimationComplete={onImpactComplete}
            />
          )}
        </div>

        <div className="shared-oasis-scene__oasis" aria-hidden="true">
          <span className="shared-oasis-scene__oasis-mirage" />
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

        <ul
          className="shared-oasis-scene__members"
          aria-label="오늘 멤버 참여 상태"
        >
          {members.map((member, index) => {
            const position = getMemberOrbitPosition(index, members.length);

            return (
              <MemberIsland
                key={member.id}
                id={member.id}
                name={member.name}
                drops={member.drops}
                hasWaterRecordToday={member.hasWaterRecordToday}
                islandImage={member.islandImage}
                avatarImage={member.avatarImage}
                position={position}
                isCurrentMember={member.id === currentMemberId}
                isSourceActive={
                  event?.kind === "contribution" &&
                  (phase === "source" || phase === "travel") &&
                  dropActorMemberId === member.id
                }
                interactionDisabled={interactionDisabled}
                onGiveWater={onGiveWater}
              />
            );
          })}
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
              x: waterDropArc.left[0],
              y: waterDropArc.top[0],
              opacity: 0.65,
            }}
            animate={{
              x: waterDropArc.left,
              y: waterDropArc.top,
              opacity: [0.65, 1, 1, 0.35],
            }}
            transition={{
              x: {
                duration: WATER_TRAVEL_DURATION_SECONDS,
                ease: "linear",
                times: [0, 0.48, 1],
              },
              y: {
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
            <span className="shared-oasis-scene__water-drop-anchor">
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
            </span>
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
