import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  getMemberIslandStatus,
  normalizeMemberDrops,
} from "./shared/memberIslandPresentation";
import {
  deriveOrganicProgress,
  getMemberDockPosition,
  getMeasuredWaterDropArc,
  SHARED_OASIS_LAYOUT,
  type WaterDropArc,
} from "./sharedOasisSceneLayout";
import "./SharedOasisScene.css";

const WAKE_UP_HINT_VISIBLE_DURATION_MS = 4200;

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
  onWakeUpMember?: (memberId: string) => void;
  showWakeUpHint?: boolean;
  onTravelComplete?: () => void;
  onImpactComplete?: () => void;
}

const WATER_TRAVEL_DURATION_SECONDS = OASIS_SCENE_TIMING.travelDuration / 1000;
const AURA_IMPACT_DURATION_SECONDS = OASIS_SCENE_TIMING.impactDuration / 1000;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

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
  onWakeUpMember,
  showWakeUpHint = false,
  onTravelComplete,
  onImpactComplete,
}: SharedOasisSceneProps) {
  const normalizedProgress = normalizeProgressPercentage(progressPercentage);
  const status = getOasisStatus(normalizedProgress);
  const roundedProgress = Math.round(normalizedProgress);
  const organicProgress = deriveOrganicProgress(normalizedProgress);
  const dropActorMemberId =
    event?.dropActorMemberIds[impactIndex] ?? event?.actorMemberId ?? null;
  const sceneRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const oasisWaterTargetRef = useRef<HTMLSpanElement>(null);
  const memberWaterOriginRefs = useRef(new Map<string, HTMLSpanElement>());
  const [waterDropArc, setWaterDropArc] = useState<WaterDropArc | null>(null);
  const wakeUpHintMemberId =
    members
      .slice(0, 5)
      .find(
        (member) =>
          member.id !== currentMemberId &&
          getMemberIslandStatus({
            drops: normalizeMemberDrops(member.drops),
            hasWaterRecordToday: member.hasWaterRecordToday,
          }) !== "complete",
      )?.id ?? null;
  const [wakeUpHintVisible, setWakeUpHintVisible] = useState(
    () => showWakeUpHint && wakeUpHintMemberId !== null,
  );

  useEffect(() => {
    if (!showWakeUpHint || !wakeUpHintMemberId) {
      setWakeUpHintVisible(false);
      return;
    }
    setWakeUpHintVisible(true);
    const timer = window.setTimeout(
      () => setWakeUpHintVisible(false),
      WAKE_UP_HINT_VISIBLE_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [showWakeUpHint, wakeUpHintMemberId]);

  const registerMemberWaterOrigin = useCallback(
    (memberId: string, node: HTMLSpanElement | null) => {
      if (node) {
        memberWaterOriginRefs.current.set(memberId, node);
      } else {
        memberWaterOriginRefs.current.delete(memberId);
      }
    },
    [],
  );
  const interactionDisabled =
    isInteractionDisabled || isAnimating || !onWakeUpMember;

  useIsomorphicLayoutEffect(() => {
    if (
      phase !== "travel" ||
      event?.kind !== "contribution" ||
      !dropActorMemberId
    ) {
      setWaterDropArc(null);
      return;
    }

    const scene = sceneRef.current;
    if (!scene) return;

    const measure = () => {
      const sceneRect = scene.getBoundingClientRect();
      if (sceneRect.width <= 0 || sceneRect.height <= 0) return false;

      const source = memberWaterOriginRefs.current.get(dropActorMemberId);
      const sourceRect = source?.getBoundingClientRect();
      const actorElement = Array.from(
        scene.querySelectorAll<HTMLElement>("[data-member-id]"),
      ).find((element) => element.dataset.memberId === dropActorMemberId);
      const actorRect = actorElement?.getBoundingClientRect();
      const target = oasisWaterTargetRef.current;
      const targetRect = target?.getBoundingClientRect();
      const stageRect = stageRef.current?.getBoundingClientRect();

      if (!sourceRect && !actorRect) return false;
      if (!targetRect && !stageRect) return false;

      const sourcePoint = sourceRect
        ? {
            x: sourceRect.left + sourceRect.width / 2 - sceneRect.left,
            y: sourceRect.top + sourceRect.height / 2 - sceneRect.top,
          }
        : {
            x:
              (actorRect?.left ?? 0) +
              (actorRect?.width ?? 0) *
                ((actorRect?.left ?? 0) + (actorRect?.width ?? 0) / 2 <=
                sceneRect.left + sceneRect.width / 2
                  ? 0.74
                  : 0.26) -
              sceneRect.left,
            y:
              (actorRect?.top ?? 0) +
              (actorRect?.width ?? 0) * 0.48 -
              sceneRect.top,
          };
      const targetPoint = targetRect
        ? {
            x: targetRect.left + targetRect.width / 2 - sceneRect.left,
            y: targetRect.top + targetRect.height / 2 - sceneRect.top,
          }
        : {
            x:
              (stageRect?.left ?? 0) +
              (stageRect?.width ?? 0) / 2 -
              sceneRect.left,
            y:
              (stageRect?.top ?? 0) +
              (stageRect?.height ?? 0) * 0.53 -
              sceneRect.top,
          };
      const nextArc = getMeasuredWaterDropArc(
        sourcePoint,
        targetPoint,
        sceneRect.height,
      );

      setWaterDropArc((previousArc) =>
        previousArc?.left.join() === nextArc.left.join() &&
        previousArc.top.join() === nextArc.top.join()
          ? previousArc
          : nextArc,
      );
      return true;
    };

    measure();
    let retryCount = 0;
    let frame = 0;
    const retryMeasure = () => {
      if (measure() || retryCount >= 4) return;
      retryCount += 1;
      frame = window.requestAnimationFrame(retryMeasure);
    };
    frame = window.requestAnimationFrame(retryMeasure);
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    resizeObserver?.observe(scene);
    if (stageRef.current) resizeObserver?.observe(stageRef.current);
    const source = memberWaterOriginRefs.current.get(dropActorMemberId);
    if (source) resizeObserver?.observe(source);
    const target = oasisWaterTargetRef.current;
    if (target) resizeObserver?.observe(target);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [dropActorMemberId, event?.kind, phase]);

  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
      <section
        ref={sceneRef}
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
            "--waterway-progress": organicProgress.waterwayProgress,
            "--life-progress": organicProgress.lifeProgress,
            "--oasis-layer-z": SHARED_OASIS_LAYOUT.oasisZIndex,
            "--oasis-center-x": `${SHARED_OASIS_LAYOUT.centerXPercent}%`,
            "--oasis-center-y": `${SHARED_OASIS_LAYOUT.centerYPercent}%`,
          } as CSSProperties
        }
      >
        <div className="shared-oasis-scene__stage-light" aria-hidden="true" />

        <span
          className="shared-oasis-scene__water-confluence"
          data-waterway-complete={organicProgress.waterwayProgress === 1}
          aria-hidden="true"
        />

        <div
          ref={stageRef}
          className="shared-oasis-scene__stage"
          role="img"
          aria-label={`오아시스 공동 성장 ${Math.round(
            organicProgress.waterwayProgress * 100,
          )}%, 생명 빛 ${Math.round(organicProgress.lifeProgress * 100)}%`}
        >
          <span
            className="shared-oasis-scene__life-aura"
            data-life-progress={organicProgress.lifeProgress}
            aria-hidden="true"
          />

          <div
            className="shared-oasis-scene__oasis"
            data-visual-style="sticker"
            aria-hidden="true"
          >
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

          <span
            className="shared-oasis-scene__water-sheen"
            aria-hidden="true"
          />

          <span
            ref={oasisWaterTargetRef}
            className="shared-oasis-scene__oasis-water-target"
            aria-hidden="true"
          />

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
                (event?.kind === "contribution" ||
                  event?.kind === "participation-only") &&
                (phase === "source" || phase === "travel") &&
                dropActorMemberId === member.id
              }
              interactionDisabled={interactionDisabled}
              showWakeUpHint={
                wakeUpHintVisible && member.id === wakeUpHintMemberId
              }
              waterOriginRef={(node) =>
                registerMemberWaterOrigin(member.id, node)
              }
              onWakeUp={onWakeUpMember}
            />
          ))}
        </ul>

        {phase === "travel" &&
          event?.kind === "contribution" &&
          waterDropArc && (
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
                opacity: 0.94,
              }}
              animate={{
                left: waterDropArc.left,
                top: waterDropArc.top,
                opacity: [0.94, 1, 1, 0.72],
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
              <span
                className="shared-oasis-scene__water-drop-trail"
                aria-hidden="true"
              />
              <motion.span
                className="shared-oasis-scene__water-drop"
                initial={{ rotate: 135, scale: 0.86 }}
                animate={{ rotate: 135, scale: [0.86, 1.12, 0.92] }}
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
