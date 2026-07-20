import { describe, expect, it } from "vitest";
import {
  advanceOasisImpact,
  createIntermediateSnapshot,
  createOasisSceneTimeline,
  diffOasisSceneSnapshots,
} from "./oasisSceneEvents";
import {
  createOasisSceneSnapshot,
  type OasisSceneMember,
} from "./oasisSceneModel";

const MEMBERS: OasisSceneMember[] = [
  {
    id: "me",
    nickname: "나",
    contributedDropsToday: 1,
    hasWaterRecordToday: true,
  },
  {
    id: "friend",
    nickname: "친구",
    contributedDropsToday: 1,
    hasWaterRecordToday: true,
  },
];

function snapshot(
  totalDrops: number,
  members: OasisSceneMember[] = MEMBERS,
  maxDrops = 8,
) {
  return createOasisSceneSnapshot({
    totalDrops,
    maxDrops,
    members,
    currentMemberId: "me",
  });
}

describe("diffOasisSceneSnapshots", () => {
  it("같은 snapshot은 이벤트를 만들지 않는다", () => {
    const current = snapshot(2);
    expect(diffOasisSceneSnapshots(current, current)).toBeNull();
  });

  it("한 멤버의 로컬 기여자를 식별한다", () => {
    const nextMembers = MEMBERS.map((member) =>
      member.id === "me" ? { ...member, contributedDropsToday: 2 } : member,
    );
    expect(
      diffOasisSceneSnapshots(snapshot(2), snapshot(3, nextMembers)),
    ).toMatchObject({
      kind: "contribution",
      origin: "local",
      actorMemberId: "me",
      dropActorMemberIds: ["me"],
      dropsAdded: 1,
    });
  });

  it("여러 멤버가 변하면 합산 기여로 처리한다", () => {
    const nextMembers = MEMBERS.map((member) => ({
      ...member,
      contributedDropsToday: member.contributedDropsToday + 1,
    }));
    expect(
      diffOasisSceneSnapshots(snapshot(2), snapshot(4, nextMembers)),
    ).toMatchObject({
      kind: "contribution",
      origin: "aggregate",
      actorMemberId: null,
      dropActorMemberIds: ["me", "friend"],
      dropsAdded: 2,
    });
  });

  it("멤버별 증가량만큼 출발 멤버 ID를 순서대로 반복한다", () => {
    const nextMembers = MEMBERS.map((member) =>
      member.id === "me"
        ? { ...member, contributedDropsToday: 2 }
        : { ...member, contributedDropsToday: 3 },
    );

    expect(
      diffOasisSceneSnapshots(snapshot(2), snapshot(5, nextMembers))
        ?.dropActorMemberIds,
    ).toEqual(["me", "friend", "friend"]);
  });

  it("공동 물방울 없이 참여만 바뀐 경우를 구분한다", () => {
    const beforeMembers = [
      MEMBERS[0],
      { ...MEMBERS[1], hasWaterRecordToday: false },
    ];
    expect(
      diffOasisSceneSnapshots(snapshot(2, beforeMembers), snapshot(2, MEMBERS)),
    ).toMatchObject({
      kind: "participation-only",
      origin: "remote",
      actorMemberId: "friend",
      dropsAdded: 0,
    });
  });

  it("분모 변경과 감소 보정은 reconciliation으로 처리한다", () => {
    expect(
      diffOasisSceneSnapshots(snapshot(2), snapshot(2, MEMBERS, 12)),
    ).toMatchObject({ kind: "reconciliation", origin: "system" });
    expect(diffOasisSceneSnapshots(snapshot(2), snapshot(1))).toMatchObject({
      kind: "reconciliation",
      origin: "system",
    });
  });

  it("75%와 100% 통과를 순서대로 기록한다", () => {
    const before = createOasisSceneSnapshot({
      totalDrops: 2,
      maxDrops: 4,
      members: MEMBERS,
    });
    const after = createOasisSceneSnapshot({
      totalDrops: 4,
      maxDrops: 4,
      members: MEMBERS.map((member) => ({
        ...member,
        contributedDropsToday: member.contributedDropsToday + 1,
      })),
    });
    expect(diffOasisSceneSnapshots(before, after)?.crossed).toEqual([75, 100]);
  });
});

describe("createOasisSceneTimeline", () => {
  it("비행과 300ms 충격을 끝낸 뒤 다음 물방울을 순차 처리한다", () => {
    const afterMembers = MEMBERS.map((member) =>
      member.id === "friend" ? { ...member, contributedDropsToday: 3 } : member,
    );
    const event = diffOasisSceneSnapshots(
      snapshot(2),
      snapshot(4, afterMembers),
    );
    if (!event) throw new Error("event가 필요합니다.");

    const timeline = createOasisSceneTimeline(event);
    const impacts = timeline.filter((step) => step.phase === "impact");

    expect(timeline[1]).toEqual({
      at: 160,
      phase: "travel",
      impactIndex: 0,
    });
    expect(impacts).toEqual([
      { at: 2360, phase: "impact", impactIndex: 1 },
      { at: 4860, phase: "impact", impactIndex: 2 },
    ]);
    expect(createIntermediateSnapshot(event, 0).progress.totalDrops).toBe(2);

    const firstImpact = advanceOasisImpact(event, 0);
    expect(firstImpact.displayedSnapshot.progress.totalDrops).toBe(3);
    expect(
      firstImpact.displayedSnapshot.members.find(
        (member) => member.id === "friend",
      )?.contributedDropsToday,
    ).toBe(2);
    expect(firstImpact.hasRemainingDrops).toBe(true);

    const secondImpact = advanceOasisImpact(event, firstImpact.nextImpactIndex);
    expect(secondImpact.displayedSnapshot.progress.totalDrops).toBe(4);
    expect(secondImpact.hasRemainingDrops).toBe(false);
  });

  it("75% 다음 450ms 뒤 100% 완벽 연출로 이어간다", () => {
    const before = createOasisSceneSnapshot({
      totalDrops: 2,
      maxDrops: 4,
      members: MEMBERS,
    });
    const after = createOasisSceneSnapshot({
      totalDrops: 4,
      maxDrops: 4,
      members: MEMBERS.map((member) => ({
        ...member,
        contributedDropsToday: member.contributedDropsToday + 1,
      })),
    });
    const event = diffOasisSceneSnapshots(before, after);
    if (!event) throw new Error("event가 필요합니다.");

    const timeline = createOasisSceneTimeline(event);
    const success = timeline.find((step) => step.phase === "celebrate-75");
    const perfect = timeline.find((step) => step.phase === "celebrate-100");

    expect(success).toBeDefined();
    expect(perfect?.at).toBe((success?.at ?? 0) + 450);
  });

  it("참여-only 이벤트에는 거짓 물방울이나 성장 단계를 만들지 않는다", () => {
    const beforeMembers = [
      MEMBERS[0],
      { ...MEMBERS[1], hasWaterRecordToday: false },
    ];
    const event = diffOasisSceneSnapshots(
      snapshot(2, beforeMembers),
      snapshot(2, MEMBERS),
    );
    if (!event) throw new Error("event가 필요합니다.");

    expect(createOasisSceneTimeline(event)).toEqual([
      { at: 0, phase: "source" },
      { at: 360, phase: "idle" },
    ]);
  });
});
