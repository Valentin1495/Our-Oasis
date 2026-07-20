import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  advanceOasisImpact,
  diffOasisSceneSnapshots,
  getOasisSceneAnnouncement,
  getOasisSceneSnapshotKey,
  OASIS_SCENE_TIMING,
  type OasisSceneEvent,
  type OasisSceneSequencePhase,
} from "./oasisSceneEvents";
import type { OasisSceneSnapshot } from "./oasisSceneModel";

interface ControllerOptions {
  reducedMotion: boolean;
}

export interface OasisSceneController {
  displayedSnapshot: OasisSceneSnapshot | null;
  activeEvent: OasisSceneEvent | null;
  phase: OasisSceneSequencePhase;
  impactIndex: number;
  announcement: string;
  isAnimating: boolean;
  completeTravel: () => void;
  completeImpact: () => void;
}

function collapseQueue(
  queue: OasisSceneEvent[],
  nextEvent: OasisSceneEvent,
): OasisSceneEvent[] {
  if (queue.length < 2) return [...queue, nextEvent];

  const first = queue[0];
  const collapsed = diffOasisSceneSnapshots(first.before, nextEvent.after);
  return collapsed ? [collapsed] : [];
}

export function useOasisSceneController(
  targetSnapshot: OasisSceneSnapshot | null,
  { reducedMotion }: ControllerOptions,
): OasisSceneController {
  const [displayedSnapshot, setDisplayedSnapshot] =
    useState<OasisSceneSnapshot | null>(targetSnapshot);
  const [queue, setQueue] = useState<OasisSceneEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<OasisSceneEvent | null>(null);
  const [phase, setPhase] = useState<OasisSceneSequencePhase>("idle");
  const [impactIndex, setImpactIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const lastTargetRef = useRef<OasisSceneSnapshot | null>(targetSnapshot);
  const targetKey = useMemo(
    () => (targetSnapshot ? getOasisSceneSnapshotKey(targetSnapshot) : "empty"),
    [targetSnapshot],
  );

  useEffect(() => {
    if (!targetSnapshot) {
      lastTargetRef.current = null;
      setDisplayedSnapshot(null);
      setQueue([]);
      setActiveEvent(null);
      setPhase("idle");
      setImpactIndex(0);
      return;
    }

    const before = lastTargetRef.current;
    lastTargetRef.current = targetSnapshot;

    if (!before) {
      setDisplayedSnapshot(targetSnapshot);
      return;
    }

    const event = diffOasisSceneSnapshots(before, targetSnapshot);
    if (!event) return;

    if (reducedMotion || event.kind === "reconciliation") {
      setQueue([]);
      setActiveEvent(null);
      setPhase("idle");
      setImpactIndex(0);
      setDisplayedSnapshot(targetSnapshot);
      setAnnouncement(getOasisSceneAnnouncement(event));
      return;
    }

    setQueue((currentQueue) => collapseQueue(currentQueue, event));
  }, [targetKey, targetSnapshot, reducedMotion]);

  useEffect(() => {
    if (!reducedMotion) return;
    const latest = lastTargetRef.current;
    if (latest) setDisplayedSnapshot(latest);
    setQueue([]);
    setActiveEvent(null);
    setPhase("idle");
    setImpactIndex(0);
  }, [reducedMotion]);

  useEffect(() => {
    if (activeEvent || queue.length === 0) return;
    const [nextEvent, ...remaining] = queue;
    setQueue(remaining);
    setActiveEvent(nextEvent);
    setDisplayedSnapshot(nextEvent.before);
    setPhase("source");
    setImpactIndex(0);
  }, [activeEvent, queue]);

  const finishActiveEvent = useCallback((event: OasisSceneEvent) => {
    setDisplayedSnapshot(event.after);
    setAnnouncement(getOasisSceneAnnouncement(event));
    setImpactIndex(0);
    setPhase("idle");
    setActiveEvent((current) => (current?.id === event.id ? null : current));
  }, []);

  const completeTravel = useCallback(() => {
    if (!activeEvent || phase !== "travel") return;
    setPhase("impact");
  }, [activeEvent, phase]);

  const completeImpact = useCallback(() => {
    if (
      !activeEvent ||
      activeEvent.kind !== "contribution" ||
      phase !== "impact"
    ) {
      return;
    }

    const advance = advanceOasisImpact(activeEvent, impactIndex);
    setImpactIndex(advance.nextImpactIndex);
    setDisplayedSnapshot(advance.displayedSnapshot);
    setPhase(advance.hasRemainingDrops ? "travel" : "growth");
  }, [activeEvent, impactIndex, phase]);

  useEffect(() => {
    if (!activeEvent || phase !== "source") return;

    if (activeEvent.kind === "participation-only") {
      const timer = setTimeout(
        () => finishActiveEvent(activeEvent),
        OASIS_SCENE_TIMING.participationDuration,
      );
      return () => clearTimeout(timer);
    }

    if (activeEvent.kind !== "contribution") {
      finishActiveEvent(activeEvent);
      return;
    }

    const timer = setTimeout(
      () => setPhase("travel"),
      OASIS_SCENE_TIMING.sourceDuration,
    );
    return () => clearTimeout(timer);
  }, [activeEvent, finishActiveEvent, phase]);

  // 이전 장면 변형에서도 상태 머신이 멈추지 않도록 Motion 콜백의
  // 안전망만 둔다. shared 장면에서는 완료 콜백이 이 타이머보다 먼저
  // 다음 단계로 전환한다.
  useEffect(() => {
    if (!activeEvent || phase !== "travel") return;
    const timer = setTimeout(
      completeTravel,
      OASIS_SCENE_TIMING.travelDuration + 120,
    );
    return () => clearTimeout(timer);
  }, [activeEvent, completeTravel, phase]);

  useEffect(() => {
    if (!activeEvent || phase !== "impact") return;
    const timer = setTimeout(
      completeImpact,
      OASIS_SCENE_TIMING.impactDuration + 120,
    );
    return () => clearTimeout(timer);
  }, [activeEvent, completeImpact, phase]);

  useEffect(() => {
    if (!activeEvent || phase !== "growth") return;
    const timer = setTimeout(() => {
      if (activeEvent.crossed.includes(75)) {
        setPhase("celebrate-75");
      } else if (activeEvent.crossed.includes(100)) {
        setPhase("celebrate-100");
      } else {
        finishActiveEvent(activeEvent);
      }
    }, OASIS_SCENE_TIMING.growthDuration);
    return () => clearTimeout(timer);
  }, [activeEvent, finishActiveEvent, phase]);

  useEffect(() => {
    if (!activeEvent || phase !== "celebrate-75") return;
    const duration = activeEvent.crossed.includes(100)
      ? OASIS_SCENE_TIMING.celebrate75To100Delay
      : OASIS_SCENE_TIMING.celebrate75Duration;
    const timer = setTimeout(() => {
      if (activeEvent.crossed.includes(100)) {
        setPhase("celebrate-100");
      } else {
        finishActiveEvent(activeEvent);
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [activeEvent, finishActiveEvent, phase]);

  useEffect(() => {
    if (!activeEvent || phase !== "celebrate-100") return;
    const timer = setTimeout(
      () => finishActiveEvent(activeEvent),
      OASIS_SCENE_TIMING.celebrate100Duration,
    );
    return () => clearTimeout(timer);
  }, [activeEvent, finishActiveEvent, phase]);

  const hasUnsettledTarget =
    !reducedMotion &&
    targetSnapshot !== null &&
    displayedSnapshot !== null &&
    getOasisSceneSnapshotKey(targetSnapshot) !==
      getOasisSceneSnapshotKey(displayedSnapshot);

  return {
    displayedSnapshot,
    activeEvent,
    phase,
    impactIndex,
    announcement,
    isAnimating: activeEvent !== null || queue.length > 0 || hasUnsettledTarget,
    completeTravel,
    completeImpact,
  };
}
