import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import memberAvatar01 from "./shared/assets/avatars/member_avatar_01.png";
import memberAvatar02 from "./shared/assets/avatars/member_avatar_02.png";
import islandBenchImage from "./shared/assets/island_bench.png";
import islandCampfireImage from "./shared/assets/island_campfire.png";
import { getMemberIslandImage } from "./shared/memberIslandImage";
import { getMemberLabelSide } from "./shared/memberIslandPresentation";
import { SharedOasisScene, type Member } from "./SharedOasisScene";
import {
  getMemberOrbitGeometry,
  getMemberOrbitPosition,
  getWaterDropArc,
  SHARED_OASIS_LAYOUT,
} from "./sharedOasisSceneLayout";
import {
  diffOasisSceneSnapshots,
  type OasisSceneEvent,
  type OasisSceneSequencePhase,
} from "./oasisSceneEvents";
import { createOasisSceneSnapshot } from "./oasisSceneModel";

const MEMBERS: Member[] = [
  {
    id: "me",
    name: "지우",
    drops: 1,
    hasWaterRecordToday: true,
    islandImage: islandBenchImage,
    avatarImage: memberAvatar01,
  },
  {
    id: "friend",
    name: "민수",
    drops: 4,
    hasWaterRecordToday: true,
    islandImage: islandCampfireImage,
    avatarImage: memberAvatar02,
  },
];

function renderScene({
  percent,
  members = MEMBERS,
  reducedMotion = false,
  announcement = "",
  currentMemberId = null,
  event = null,
  phase = "idle",
  impactIndex = 0,
  isAnimating = false,
  isInteractionDisabled = false,
}: {
  percent: number;
  members?: Member[];
  reducedMotion?: boolean;
  announcement?: string;
  currentMemberId?: string | null;
  event?: OasisSceneEvent | null;
  phase?: OasisSceneSequencePhase;
  impactIndex?: number;
  isAnimating?: boolean;
  isInteractionDisabled?: boolean;
}) {
  return renderToStaticMarkup(
    <SharedOasisScene
      progressPercentage={percent}
      members={members}
      reducedMotion={reducedMotion}
      announcement={announcement}
      currentMemberId={currentMemberId}
      event={event}
      phase={phase}
      impactIndex={impactIndex}
      isAnimating={isAnimating}
      isInteractionDisabled={isInteractionDisabled}
      onGiveWater={() => undefined}
    />,
  );
}

function createContributionEvent(): OasisSceneEvent {
  const beforeMembers = MEMBERS.map((member) => ({
    id: member.id,
    nickname: member.name,
    contributedDropsToday: member.drops,
    hasWaterRecordToday: true,
  }));
  const afterMembers = beforeMembers.map((member) =>
    member.id === "me"
      ? { ...member, contributedDropsToday: member.contributedDropsToday + 1 }
      : member,
  );
  const before = createOasisSceneSnapshot({
    totalDrops: 5,
    maxDrops: 8,
    members: beforeMembers,
    currentMemberId: "me",
  });
  const after = createOasisSceneSnapshot({
    totalDrops: 6,
    maxDrops: 8,
    members: afterMembers,
    currentMemberId: "me",
  });
  const event = diffOasisSceneSnapshots(before, after);
  if (!event) throw new Error("기여 이벤트가 필요합니다.");
  return event;
}

describe("SharedOasisScene", () => {
  it.each([
    [0, "IN_PROGRESS"],
    [75, "SHARED_SUCCESS"],
    [100, "PERFECT_SUCCESS"],
  ] as const)("%s%%에서 %s 이미지만 활성화한다", (percent, status) => {
    const markup = renderScene({ percent });

    expect(markup).toContain(`data-oasis-status="${status}"`);
    expect(markup).toContain(`data-oasis-layer="${status}" data-active="true"`);
    expect(markup.match(/data-active="true"/g)).toHaveLength(1);
    expect(markup.match(/data-oasis-layer=/g)).toHaveLength(3);
  });

  it("75% 공동 성공과 100% 완벽 성공은 서로 다른 이미지를 사용한다", () => {
    const sharedSuccess = renderScene({ percent: 75 });
    const perfectSuccess = renderScene({ percent: 100 });

    expect(sharedSuccess).toContain(
      'data-oasis-layer="SHARED_SUCCESS" data-active="true"',
    );
    expect(sharedSuccess).toContain("oasis_lush");
    expect(perfectSuccess).toContain(
      'data-oasis-layer="PERFECT_SUCCESS" data-active="true"',
    );
    expect(perfectSuccess).toContain("oasis_mystic");
  });

  it.each([1, 2, 3, 4, 5])(
    "%s명의 멤버를 인원별 아이소메트릭 타원 위에 배치한다",
    (memberCount) => {
      for (let index = 0; index < memberCount; index += 1) {
        const position = getMemberOrbitPosition(index, memberCount);
        const geometry = getMemberOrbitGeometry(memberCount);
        const normalizedX =
          (position.xPercent - SHARED_OASIS_LAYOUT.centerXPercent) /
          geometry.radiusXPercent;
        const normalizedY =
          (position.yPercent - SHARED_OASIS_LAYOUT.centerYPercent) /
          geometry.radiusYPercent;

        expect(normalizedX ** 2 + normalizedY ** 2).toBeCloseTo(1, 10);
      }
    },
  );

  it.each([1, 2, 3, 4, 5])(
    "%s명 배치에서 명패를 섬 위치에 맞춰 화면 안쪽으로 펼친다",
    (memberCount) => {
      const members = Array.from({ length: memberCount }, (_, index) => ({
        id: `member-${index}`,
        name: `친구${index}`,
        drops: index % 5,
        hasWaterRecordToday: index > 0,
        islandImage: islandBenchImage,
        avatarImage: memberAvatar01,
      }));
      const markup = renderScene({ percent: 50, members });

      for (let index = 0; index < memberCount; index += 1) {
        const position = getMemberOrbitPosition(index, memberCount);
        const labelSide = getMemberLabelSide(position.xPercent);

        expect(markup).toMatch(
          new RegExp(
            `data-member-id="member-${index}"[^>]*data-label-side="${labelSide}"`,
          ),
        );
      }
    },
  );

  it("앞쪽 섬을 중앙 오아시스와 뒤쪽 섬보다 높게 쌓는다", () => {
    const back = getMemberOrbitPosition(0, 2);
    const front = getMemberOrbitPosition(1, 2);

    expect(front.yPercent).toBeGreaterThan(SHARED_OASIS_LAYOUT.centerYPercent);
    expect(back.yPercent).toBeLessThan(SHARED_OASIS_LAYOUT.centerYPercent);
    expect(front.depth).toBe("front");
    expect(back.depth).toBe("back");
    expect(front.zIndex).toBeGreaterThan(SHARED_OASIS_LAYOUT.oasisZIndex);
    expect(back.zIndex).toBeLessThan(SHARED_OASIS_LAYOUT.oasisZIndex);
    expect(front.zIndex).toBeGreaterThan(back.zIndex);
  });

  it("0·25·50·75·100 진행 여정과 현재 도달 상태를 표시한다", () => {
    const markup = renderScene({ percent: 75 });

    expect(markup.match(/data-progress-milestone=/g)).toHaveLength(5);
    expect(markup).toContain(
      'data-progress-milestone="75" data-reached="true"',
    );
    expect(markup).toContain(
      'data-progress-milestone="100" data-reached="false"',
    );
    expect(markup).toContain("공동 성공");
    expect(markup).toContain("완벽 성공");
    expect(markup).toContain('class="shared-oasis-scene__share-mark"');
  });

  it.each([1, 2, 3, 4, 5])(
    "%s명 배치에서 섬 이미지가 수평 경계를 벗어나지 않는다",
    (memberCount) => {
      const halfMemberSize = SHARED_OASIS_LAYOUT.memberSizePercent / 2;

      for (let index = 0; index < memberCount; index += 1) {
        const position = getMemberOrbitPosition(index, memberCount);

        expect(position.xPercent - halfMemberSize).toBeGreaterThanOrEqual(0);
        expect(position.xPercent + halfMemberSize).toBeLessThanOrEqual(100);
      }
    },
  );

  it("섬과 명패를 같은 소유자 그룹에서 동일한 depth로 렌더링한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(markup).toContain(
      'data-member-id="friend" data-member-status="complete" data-current-member="false" data-depth="front" data-label-side="right"',
    );
    expect(markup).toContain('class="shared-oasis-scene__member-cluster"');
    expect(markup).toContain(
      'class="shared-oasis-scene__member-chip" data-depth="front" data-label-side="right"',
    );
  });

  it("그리드 대신 중앙 오아시스 하단에 블룸 오라를 렌더링한다", () => {
    const markup = renderScene({ percent: 75 });

    expect(markup).toContain('class="shared-oasis-scene__bloom-aura"');
    expect(markup).not.toContain("shared-oasis-scene__community-ring");
  });

  it("멤버마다 다른 지연값을 가진 부유 레이어를 렌더링한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(markup.match(/data-float-delay=/g)).toHaveLength(2);
    expect(markup).toContain('data-float-delay="0"');
    expect(markup).toContain('data-float-delay="0.18"');
  });

  it("현재 사용자 섬만 버튼이며 busy·외부 비활성 상태를 따른다", () => {
    const idle = renderScene({
      percent: 50,
      currentMemberId: "me",
    });
    const busy = renderScene({
      percent: 50,
      currentMemberId: "me",
      isAnimating: true,
    });
    const externallyDisabled = renderScene({
      percent: 50,
      currentMemberId: "me",
      isInteractionDisabled: true,
    });

    expect(idle.match(/<button/g)).toHaveLength(1);
    expect(idle).toContain('data-current-member="true"');
    expect(idle).toContain('class="shared-oasis-scene__member-me">나</span>');
    expect(idle).not.toContain('data-current-member="true" disabled');
    expect(busy).toMatch(/data-current-member="true"[^>]*disabled=""/);
    expect(externallyDisabled).toMatch(
      /data-current-member="true"[^>]*disabled=""/,
    );
  });

  it("actor 섬에서 제어점을 거쳐 중앙으로 향하는 물방울 경로를 만든다", () => {
    const event = createContributionEvent();
    const origin = getMemberOrbitPosition(0, MEMBERS.length);
    const arc = getWaterDropArc(origin);
    const markup = renderScene({
      percent: event.before.progress.displayPercent,
      currentMemberId: "me",
      event,
      phase: "travel",
    });

    expect(markup).toContain('data-actor-member-id="me"');
    expect(markup).toContain('data-drop-index="0"');
    expect(markup).toContain(
      'class="shared-oasis-scene__member shared-oasis-scene__member--active" data-member-id="me"',
    );
    expect(markup).toContain('class="shared-oasis-scene__island-ripple"');
    expect(markup).toContain(`data-path-left="${arc.left.join(",")}"`);
    expect(markup).toContain(`data-path-top="${arc.top.join(",")}"`);
    expect(arc.left[2]).toBe(`${SHARED_OASIS_LAYOUT.centerXPercent}%`);
    expect(arc.top[2]).toBe(`${SHARED_OASIS_LAYOUT.centerYPercent}%`);
  });

  it.each(["source", "travel"] as const)(
    "%s 단계에서 행동한 멤버의 소유자 그룹만 강조한다",
    (phase) => {
      const event = createContributionEvent();
      const markup = renderScene({
        percent: event.before.progress.displayPercent,
        currentMemberId: "me",
        event,
        phase,
      });

      expect(markup.match(/shared-oasis-scene__member--active/g)).toHaveLength(
        1,
      );
      expect(markup).toContain(
        'class="shared-oasis-scene__member shared-oasis-scene__member--active" data-member-id="me"',
      );
    },
  );

  it("impact 단계마다 별도 오라 리플을 렌더링한다", () => {
    const event = createContributionEvent();
    const markup = renderScene({
      percent: event.before.progress.displayPercent,
      event,
      phase: "impact",
      impactIndex: 0,
    });

    expect(markup).toContain('class="shared-oasis-scene__impact-ripple"');
    expect(markup).toContain('data-impact-index="0"');
  });

  it("배경 장식 물방울을 렌더링하지 않는다", () => {
    const markup = renderScene({ percent: 75 });

    expect(markup).not.toContain("shared-oasis-scene__water-effects");
  });

  it("멤버 이름과 물방울 기여 수를 장면 안에 표시한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(markup).toContain("지우");
    expect(markup).toContain("민수");
    expect(markup).toContain("1/4");
    expect(markup).toContain("4/4");
    expect(markup).toContain("오늘 물방울 1개 기여");
  });

  it("이니셜 대신 배정된 캐릭터 아바타 이미지를 표시한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(
      markup.match(/class="shared-oasis-scene__member-avatar-image"/g),
    ).toHaveLength(2);
    expect(markup).toContain("member_avatar_01");
    expect(markup).toContain("member_avatar_02");
    expect(markup).not.toContain(
      'class="shared-oasis-scene__member-avatar">지',
    );
  });

  it("참여 사실과 물방울 수를 네 가지 섬 상태로 구분한다", () => {
    const members: Member[] = [
      {
        id: "pending",
        name: "대기",
        drops: 0,
        hasWaterRecordToday: false,
        islandImage: islandBenchImage,
        avatarImage: memberAvatar01,
      },
      {
        id: "participated",
        name: "참여",
        drops: 0,
        hasWaterRecordToday: true,
        islandImage: islandCampfireImage,
        avatarImage: memberAvatar02,
      },
      {
        id: "contributing",
        name: "기여",
        drops: 3,
        hasWaterRecordToday: true,
        islandImage: islandBenchImage,
        avatarImage: memberAvatar01,
      },
      {
        id: "complete",
        name: "완료",
        drops: 4,
        hasWaterRecordToday: true,
        islandImage: islandCampfireImage,
        avatarImage: memberAvatar02,
      },
    ];
    const markup = renderScene({ percent: 50, members });

    for (const status of [
      "pending",
      "participated",
      "contributing",
      "complete",
    ]) {
      expect(markup).toContain(`data-member-status="${status}"`);
    }
    expect(markup).not.toContain("shared-oasis-scene__drop-slot");
    expect(markup).toContain(
      'class="shared-oasis-scene__island-complete-mark"',
    );
  });

  it("멤버가 없어도 중앙 오아시스와 상태 설명을 렌더링한다", () => {
    const markup = renderScene({ percent: 75, members: [] });

    expect(markup).toContain(
      'data-oasis-layer="SHARED_SUCCESS" data-active="true"',
    );
    expect(markup).not.toContain("data-member-id");
    expect(markup).toContain(
      "친구들과 완성한 풍성한 오아시스, 공동 달성률 75%",
    );
  });

  it("같은 멤버 ID는 배열 순서와 관계없이 같은 섬을 배정받는다", () => {
    const ids = ["member-alpha", "member-beta", "member-gamma"];
    const original = Object.fromEntries(
      ids.map((id) => [id, getMemberIslandImage(id)]),
    );
    const reordered = Object.fromEntries(
      [...ids].reverse().map((id) => [id, getMemberIslandImage(id)]),
    );

    expect(reordered).toEqual(original);
  });

  it("reduced motion과 live announcement를 유지한다", () => {
    const markup = renderScene({
      percent: 100,
      reducedMotion: true,
      announcement: "친구들의 오아시스가 완벽해졌어요.",
    });

    expect(markup).toContain('data-reduced-motion="true"');
    expect(markup).toContain('role="status"');
    expect(markup).toContain("친구들의 오아시스가 완벽해졌어요.");
  });
});
