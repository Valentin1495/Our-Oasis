import {
  createOasisSceneSnapshot,
  type OasisSceneSnapshot,
} from "./oasisSceneModel";

export type OasisSceneEventKind =
  "contribution" | "participation-only" | "reconciliation";

export type OasisSceneSequencePhase =
  | "idle"
  | "source"
  | "travel"
  | "impact"
  | "growth"
  | "celebrate-75"
  | "celebrate-100";

export interface OasisSceneEvent {
  id: string;
  kind: OasisSceneEventKind;
  origin: "local" | "remote" | "aggregate" | "system";
  actorMemberId: string | null;
  dropActorMemberIds: string[];
  dropsAdded: number;
  before: OasisSceneSnapshot;
  after: OasisSceneSnapshot;
  crossed: Array<75 | 100>;
}

export interface OasisSceneTimelineStep {
  at: number;
  phase: OasisSceneSequencePhase;
  impactIndex?: number;
}

export const OASIS_SCENE_TIMING = {
  sourceDuration: 160,
  travelDuration: 2200,
  impactDuration: 300,
  growthDuration: 360,
  participationDuration: 360,
  celebrate75Duration: 600,
  celebrate75To100Delay: 450,
  celebrate100Duration: 900,
} as const;

function memberSignature(snapshot: OasisSceneSnapshot): string {
  return [...snapshot.members]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(
      (member) =>
        `${member.id}:${member.contributedDropsToday}:${member.hasWaterRecordToday ? 1 : 0}`,
    )
    .join("|");
}

export function getOasisSceneSnapshotKey(snapshot: OasisSceneSnapshot): string {
  const { progress } = snapshot;
  return [
    progress.totalDrops,
    progress.maxDrops,
    progress.displayPercent,
    progress.isCommunitySuccess ? 1 : 0,
    progress.isPerfect ? 1 : 0,
    memberSignature(snapshot),
    snapshot.currentMemberId ?? "",
  ].join(";");
}

function getDropActorMemberIds(
  before: OasisSceneSnapshot,
  after: OasisSceneSnapshot,
): string[] {
  const beforeById = new Map(
    before.members.map((member) => [member.id, member.contributedDropsToday]),
  );
  return after.members.flatMap((member) => {
    const added =
      member.contributedDropsToday - (beforeById.get(member.id) ?? 0);
    return added > 0 ? Array<string>(added).fill(member.id) : [];
  });
}

function getNewParticipantMembers(
  before: OasisSceneSnapshot,
  after: OasisSceneSnapshot,
): string[] {
  const beforeById = new Map(
    before.members.map((member) => [member.id, member.hasWaterRecordToday]),
  );
  return after.members
    .filter(
      (member) =>
        member.hasWaterRecordToday && !(beforeById.get(member.id) ?? false),
    )
    .map((member) => member.id);
}

export function diffOasisSceneSnapshots(
  before: OasisSceneSnapshot,
  after: OasisSceneSnapshot,
): OasisSceneEvent | null {
  if (getOasisSceneSnapshotKey(before) === getOasisSceneSnapshotKey(after)) {
    return null;
  }

  const dropsAdded = after.progress.totalDrops - before.progress.totalDrops;
  const dropActorMemberIds = getDropActorMemberIds(before, after);
  const contributionMembers = [...new Set(dropActorMemberIds)];
  const participantMembers = getNewParticipantMembers(before, after);
  const crossed: Array<75 | 100> = [];

  if (
    !before.progress.isCommunitySuccess &&
    after.progress.isCommunitySuccess
  ) {
    crossed.push(75);
  }
  if (!before.progress.isPerfect && after.progress.isPerfect) {
    crossed.push(100);
  }

  let kind: OasisSceneEventKind = "reconciliation";
  let actorMemberId: string | null = null;

  if (dropsAdded > 0) {
    kind = "contribution";
    actorMemberId =
      contributionMembers.length === 1 ? contributionMembers[0] : null;
  } else if (dropsAdded === 0 && participantMembers.length > 0) {
    kind = "participation-only";
    actorMemberId =
      participantMembers.length === 1 ? participantMembers[0] : null;
  }

  const origin =
    kind === "reconciliation"
      ? "system"
      : actorMemberId === null
        ? "aggregate"
        : actorMemberId === after.currentMemberId
          ? "local"
          : "remote";

  return {
    id: `${getOasisSceneSnapshotKey(before)}>${getOasisSceneSnapshotKey(after)}`,
    kind,
    origin,
    actorMemberId,
    dropActorMemberIds:
      kind === "contribution"
        ? dropActorMemberIds.slice(0, Math.max(0, dropsAdded))
        : [],
    dropsAdded: Math.max(0, dropsAdded),
    before,
    after,
    crossed,
  };
}

export function createOasisSceneTimeline(
  event: OasisSceneEvent,
): OasisSceneTimelineStep[] {
  if (event.kind === "reconciliation") {
    return [{ at: 0, phase: "idle" }];
  }

  if (event.kind === "participation-only") {
    return [
      { at: 0, phase: "source" },
      { at: OASIS_SCENE_TIMING.participationDuration, phase: "idle" },
    ];
  }

  const steps: OasisSceneTimelineStep[] = [{ at: 0, phase: "source" }];
  let cursor = OASIS_SCENE_TIMING.sourceDuration;
  for (let index = 0; index < event.dropsAdded; index += 1) {
    steps.push({
      at: cursor,
      phase: "travel",
      impactIndex: index,
    });
    cursor += OASIS_SCENE_TIMING.travelDuration;
    steps.push({
      at: cursor,
      phase: "impact",
      impactIndex: index + 1,
    });
    cursor += OASIS_SCENE_TIMING.impactDuration;
  }

  const growthAt = cursor;
  steps.push({ at: growthAt, phase: "growth" });

  if (event.crossed.includes(75)) {
    const celebrate75At = growthAt + OASIS_SCENE_TIMING.growthDuration;
    steps.push({ at: celebrate75At, phase: "celebrate-75" });

    if (event.crossed.includes(100)) {
      const celebrate100At =
        celebrate75At + OASIS_SCENE_TIMING.celebrate75To100Delay;
      steps.push({ at: celebrate100At, phase: "celebrate-100" });
      steps.push({
        at: celebrate100At + OASIS_SCENE_TIMING.celebrate100Duration,
        phase: "idle",
      });
      return steps;
    }

    steps.push({
      at: celebrate75At + OASIS_SCENE_TIMING.celebrate75Duration,
      phase: "idle",
    });
    return steps;
  }

  if (event.crossed.includes(100)) {
    const celebrate100At = growthAt + OASIS_SCENE_TIMING.growthDuration;
    steps.push({ at: celebrate100At, phase: "celebrate-100" });
    steps.push({
      at: celebrate100At + OASIS_SCENE_TIMING.celebrate100Duration,
      phase: "idle",
    });
    return steps;
  }

  steps.push({
    at: growthAt + OASIS_SCENE_TIMING.growthDuration,
    phase: "idle",
  });
  return steps;
}

export function createIntermediateSnapshot(
  event: OasisSceneEvent,
  impactIndex: number,
): OasisSceneSnapshot {
  if (event.kind !== "contribution" || impactIndex >= event.dropsAdded) {
    return event.after;
  }

  const totalDrops =
    event.before.progress.totalDrops + Math.max(0, impactIndex);
  const maxDrops = event.after.progress.maxDrops;
  const displayPercent = maxDrops > 0 ? (totalDrops / maxDrops) * 100 : 0;
  const completedDropsByMember = event.dropActorMemberIds
    .slice(0, Math.max(0, impactIndex))
    .reduce((counts, memberId) => {
      counts.set(memberId, (counts.get(memberId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>());
  const beforeMembersById = new Map(
    event.before.members.map((member) => [member.id, member]),
  );
  const members = event.after.members.map((afterMember) => {
    const beforeMember = beforeMembersById.get(afterMember.id);
    const completedDrops = completedDropsByMember.get(afterMember.id) ?? 0;
    if (!beforeMember) return afterMember;

    return {
      ...afterMember,
      contributedDropsToday: Math.min(
        afterMember.contributedDropsToday,
        beforeMember.contributedDropsToday + completedDrops,
      ),
      hasWaterRecordToday:
        completedDrops > 0
          ? afterMember.hasWaterRecordToday
          : beforeMember.hasWaterRecordToday,
    };
  });

  return createOasisSceneSnapshot({
    totalDrops,
    maxDrops,
    displayPercent,
    members,
    currentMemberId: event.after.currentMemberId,
  });
}

export interface OasisImpactAdvance {
  nextImpactIndex: number;
  displayedSnapshot: OasisSceneSnapshot;
  hasRemainingDrops: boolean;
}

export function advanceOasisImpact(
  event: OasisSceneEvent,
  completedImpactCount: number,
): OasisImpactAdvance {
  const nextImpactIndex = Math.min(
    event.dropsAdded,
    Math.max(0, completedImpactCount) + 1,
  );

  return {
    nextImpactIndex,
    displayedSnapshot: createIntermediateSnapshot(event, nextImpactIndex),
    hasRemainingDrops: nextImpactIndex < event.dropsAdded,
  };
}

export function getOasisSceneAnnouncement(event: OasisSceneEvent): string {
  const actor = event.after.members.find(
    (member) => member.id === event.actorMemberId,
  );

  if (event.kind === "participation-only") {
    return actor
      ? `${actor.nickname}님이 오늘 물 기록에 참여했어요.`
      : "친구가 오늘 물 기록에 참여했어요.";
  }
  if (event.kind !== "contribution") return "";
  if (event.crossed.includes(100)) {
    return "모두 함께 오아시스를 100% 완벽하게 채웠어요.";
  }
  if (event.crossed.includes(75)) {
    return "모두 함께 오늘의 오아시스를 완성했어요.";
  }
  if (event.origin === "local") return "";
  return actor
    ? `${actor.nickname}님이 물방울 ${event.dropsAdded}개를 보탰어요.`
    : `친구들이 물방울 ${event.dropsAdded}개를 보탰어요.`;
}
