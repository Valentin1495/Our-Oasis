import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import memberAvatar01 from "./shared/assets/avatars/member_avatar_01.png";
import memberAvatar02 from "./shared/assets/avatars/member_avatar_02.png";
import islandBenchImage from "./shared/assets/island_bench.png";
import islandCampfireImage from "./shared/assets/island_campfire.png";
import { SharedOasisScene, type Member } from "./SharedOasisScene";
import {
  diffOasisSceneSnapshots,
  type OasisSceneEvent,
  type OasisSceneSequencePhase,
} from "./oasisSceneEvents";
import { createOasisSceneSnapshot } from "./oasisSceneModel";
import {
  deriveOrganicProgress,
  getMemberDockPosition,
  getMeasuredWaterDropArc,
  getWakeUpHintLayout,
  SHARED_OASIS_LAYOUT,
} from "./sharedOasisSceneLayout";

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
      onWakeUpMember={() => undefined}
    />,
  );
}

function createContributionEvent(actorId = "me"): OasisSceneEvent {
  const beforeMembers = MEMBERS.map((member) => ({
    id: member.id,
    nickname: member.name,
    contributedDropsToday:
      actorId === "friend" && member.id === "friend" ? 2 : member.drops,
    hasWaterRecordToday: member.hasWaterRecordToday,
  }));
  const afterMembers = beforeMembers.map((member) =>
    member.id === actorId
      ? { ...member, contributedDropsToday: member.contributedDropsToday + 1 }
      : member,
  );
  const beforeTotal = beforeMembers.reduce(
    (sum, member) => sum + member.contributedDropsToday,
    0,
  );
  const before = createOasisSceneSnapshot({
    totalDrops: beforeTotal,
    maxDrops: 8,
    members: beforeMembers,
    currentMemberId: "me",
  });
  const after = createOasisSceneSnapshot({
    totalDrops: beforeTotal + 1,
    maxDrops: 8,
    members: afterMembers,
    currentMemberId: "me",
  });
  const event = diffOasisSceneSnapshots(before, after);
  if (!event) throw new Error("기여 이벤트가 필요합니다.");
  return event;
}

describe("오아시스 유기적 진행 표현", () => {
  it.each([
    [0, 0, 0],
    [74, 0.987, 0],
    [75, 1, 0],
    [76, 1, 0.04],
    [99, 1, 0.96],
    [100, 1, 1],
  ] as const)(
    "%s%%를 물길 %s, 생명 빛 %s로 분리한다",
    (percent, waterwayProgress, lifeProgress) => {
      expect(deriveOrganicProgress(percent)).toEqual({
        waterwayProgress,
        lifeProgress,
      });
    },
  );

  it.each([
    [Number.NaN, { waterwayProgress: 0, lifeProgress: 0 }],
    [Number.POSITIVE_INFINITY, { waterwayProgress: 0, lifeProgress: 0 }],
    [-10, { waterwayProgress: 0, lifeProgress: 0 }],
    [125, { waterwayProgress: 1, lifeProgress: 1 }],
  ])("비정상 입력 %s를 안전하게 정규화한다", (input, expected) => {
    expect(deriveOrganicProgress(input as number)).toEqual(expected);
  });

  it.each([
    [0, "0", "0"],
    [75, "1", "0"],
    [76, "1", "0.04"],
    [100, "1", "1"],
  ])(
    "%s%% 진행을 오아시스의 통합 후광으로 렌더링한다",
    (percent, waterway, lifeProgress) => {
      const markup = renderScene({ percent });

      expect(markup).toContain(`--waterway-progress:${waterway}`);
      expect(markup).toContain(`data-life-progress="${lifeProgress}"`);
      expect(markup).toContain("shared-oasis-scene__life-aura");
      expect(markup).toContain("shared-oasis-scene__water-sheen");
      expect(markup).not.toContain("shared-oasis-scene__life-crown");
    },
  );

  it("상시 물길 대신 실제 위치 측정을 위한 보이지 않는 기준점을 렌더링한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(
      markup.match(/class="shared-oasis-scene__member-water-origin"/g),
    ).toHaveLength(2);
    expect(markup).toContain("shared-oasis-scene__oasis-water-target");
    expect(markup).not.toContain("shared-oasis-scene__waterways");
    expect(markup).not.toContain("member-waterway-connector");
  });
});

describe("오아시스 스테이지 상태", () => {
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

  it("75% 공동 성공과 100% 완벽 성공을 서로 다른 이미지와 생명 빛으로 표현한다", () => {
    const sharedSuccess = renderScene({ percent: 75 });
    const perfectSuccess = renderScene({ percent: 100 });

    expect(sharedSuccess).toContain("oasis_lush");
    expect(sharedSuccess).toContain('data-life-progress="0"');
    expect(sharedSuccess).toContain("shared-oasis-scene__life-aura");

    expect(perfectSuccess).toContain("oasis_mystic");
    expect(perfectSuccess).toContain('data-life-progress="1"');
    expect(perfectSuccess).toContain("shared-oasis-scene__water-sheen");
  });

  it("상태와 달성률을 장면 접근성 이름으로 제공한다", () => {
    expect(renderScene({ percent: 75 })).toContain(
      'aria-label="친구들과 완성한 풍성한 오아시스, 공동 달성률 75%"',
    );
  });
});

describe("멤버 도크", () => {
  it.each([1, 2, 3, 4, 5])(
    "%s명을 화면 안의 수평 도크에 균등하게 배치한다",
    (memberCount) => {
      const positions = Array.from({ length: memberCount }, (_, index) =>
        getMemberDockPosition(index, memberCount),
      );

      expect(positions.every((position) => position.yPercent === 84)).toBe(
        true,
      );
      expect(
        positions.every(
          (position) =>
            position.xPercent >= SHARED_OASIS_LAYOUT.dockMinXPercent &&
            position.xPercent <= SHARED_OASIS_LAYOUT.dockMaxXPercent,
        ),
      ).toBe(true);

      if (memberCount > 1) {
        const gaps = positions
          .slice(1)
          .map(
            (position, index) => position.xPercent - positions[index].xPercent,
          );
        for (const gap of gaps.slice(1)) {
          expect(gap).toBeCloseTo(gaps[0], 2);
        }
      }
    },
  );

  it("친구가 2명일 때는 도크 양 끝이 아니라 중앙 쪽에 모아 배치한다", () => {
    const [first, second] = [0, 1].map((index) =>
      getMemberDockPosition(index, 2),
    );

    expect(first.xPercent).toBeGreaterThan(SHARED_OASIS_LAYOUT.dockMinXPercent);
    expect(second.xPercent).toBeLessThan(SHARED_OASIS_LAYOUT.dockMaxXPercent);
    expect(SHARED_OASIS_LAYOUT.centerXPercent - first.xPercent).toBeCloseTo(
      second.xPercent - SHARED_OASIS_LAYOUT.centerXPercent,
      5,
    );
  });

  it.each([
    [
      12,
      { anchorPositionByRatio: 0.35, clipToEnd: "none", horizontalInset: 12 },
    ],
    [50, { anchorPositionByRatio: 0.5, clipToEnd: "none", horizontalInset: 0 }],
    [
      88,
      { anchorPositionByRatio: 0.65, clipToEnd: "none", horizontalInset: -12 },
    ],
  ] as const)(
    "가로 위치가 %s%%인 섬의 깨우기 툴팁을 화면 안쪽으로 배치한다",
    (xPercent, expected) => {
      expect(getWakeUpHintLayout(xPercent)).toEqual(expected);
    },
  );

  it("멤버별 0~4개 물방울 슬롯과 참여 상태를 렌더링한다", () => {
    const members = Array.from({ length: 5 }, (_, index) => ({
      ...MEMBERS[index % MEMBERS.length],
      id: `member-${index}`,
      name: `친구${index}`,
      drops: index,
      hasWaterRecordToday: index > 0,
    }));
    const markup = renderScene({ percent: 50, members });

    expect(
      markup.match(/class="shared-oasis-scene__member-slot"/g),
    ).toHaveLength(20);
    expect(markup.match(/data-filled="true"/g)).toHaveLength(10);
    expect(markup).toContain('data-member-status="pending"');
    expect(markup).toContain('data-member-status="contributing"');
    expect(markup).toContain('data-member-status="complete"');
  });

  it("기록했지만 방울이 없는 멤버를 참여만 상태로 구분한다", () => {
    const markup = renderScene({
      percent: 0,
      members: [
        {
          ...MEMBERS[0],
          drops: 0,
          hasWaterRecordToday: true,
        },
      ],
    });

    expect(markup).toContain('data-member-status="participated"');
  });

  it("첫 참여 연출에서도 내 섬에서 출발 파동을 보여준다", () => {
    const beforeMembers = [
      {
        id: "me",
        nickname: "지우",
        contributedDropsToday: 0,
        hasWaterRecordToday: false,
      },
    ];
    const afterMembers = [{ ...beforeMembers[0], hasWaterRecordToday: true }];
    const event = diffOasisSceneSnapshots(
      createOasisSceneSnapshot({
        totalDrops: 0,
        maxDrops: 4,
        members: beforeMembers,
        currentMemberId: "me",
      }),
      createOasisSceneSnapshot({
        totalDrops: 0,
        maxDrops: 4,
        members: afterMembers,
        currentMemberId: "me",
      }),
    );
    if (!event) throw new Error("참여 이벤트가 필요합니다.");

    const markup = renderScene({
      percent: 0,
      members: [{ ...MEMBERS[0], drops: 0, hasWaterRecordToday: false }],
      currentMemberId: "me",
      event,
      phase: "source",
    });

    expect(event.kind).toBe("participation-only");
    expect(markup).toContain("shared-oasis-scene__member-source-ripple");
    expect(markup).toContain("shared-oasis-scene__member--active");
  });

  it("메인 오아시스와 각 멤버 섬을 같은 스티커 스타일로 표시한다", () => {
    const markup = renderScene({ percent: 50 });

    expect(markup.match(/data-visual-style="sticker"/g)).toHaveLength(
      MEMBERS.length + 1,
    );
  });

  it("현재 사용자의 섬은 클릭할 수 없고, 다른 멤버의 섬은 깨우기 위해 클릭할 수 있다", () => {
    const markup = renderScene({
      percent: 50,
      currentMemberId: "me",
    });

    expect(markup).toContain('data-current-member="true"');
    expect(markup).toContain("현재 사용자");
    expect(markup).toContain("민수의 섬, 오늘 물방울을 모두 채웠어요");
  });

  it("아직 물방울을 다 채우지 않은 멤버의 섬은 깨우기 대상으로 안내한다", () => {
    const markup = renderScene({
      percent: 50,
      currentMemberId: "me",
      members: [
        MEMBERS[0],
        { ...MEMBERS[1], drops: 2, hasWaterRecordToday: true },
      ],
    });

    expect(markup).toContain("민수의 섬, 오늘 물방울 2개 기여. 깨우기");
  });

  it("애니메이션 또는 처리 중에는 다른 멤버 섬 클릭을 비활성화한다", () => {
    expect(
      renderScene({
        percent: 50,
        currentMemberId: "me",
        isAnimating: true,
      }),
    ).toMatch(/<button[^>]*disabled=""/);

    expect(
      renderScene({
        percent: 50,
        currentMemberId: "me",
        isInteractionDisabled: true,
      }),
    ).toMatch(/<button[^>]*disabled=""/);
  });

  it("처리 중에는 다른 멤버 섬에 처리 중 상태를 안내한다", () => {
    const markup = renderScene({
      percent: 50,
      currentMemberId: "me",
      isInteractionDisabled: true,
    });

    expect(markup).toContain("민수의 섬, 처리 중");
  });
});

describe("친구 깨우기 힌트", () => {
  it("깨울 친구가 있고 힌트를 아직 배우지 않았다면 첫 대상 친구의 섬 위에 힌트를 보여준다", () => {
    const markup = renderToStaticMarkup(
      <SharedOasisScene
        progressPercentage={50}
        members={[
          MEMBERS[0],
          { ...MEMBERS[1], drops: 2, hasWaterRecordToday: true },
        ]}
        currentMemberId="me"
        onWakeUpMember={() => undefined}
        showWakeUpHint
      />,
    );

    // TDS Tooltip은 말풍선 내용을 portal로 렌더링하므로 SSR 마크업에는 나타나지 않는다.
    // 대신 열림 상태에서 트리거(아바타)에 추가되는 aria-describedby로 확인한다.
    expect(markup).toContain(
      'shared-oasis-scene__member-avatar" aria-describedby=',
    );
  });

  it("이미 힌트를 배웠거나(showWakeUpHint=false) 깨울 대상이 없으면 힌트를 보여주지 않는다", () => {
    const learnedMarkup = renderToStaticMarkup(
      <SharedOasisScene
        progressPercentage={50}
        members={[
          MEMBERS[0],
          { ...MEMBERS[1], drops: 2, hasWaterRecordToday: true },
        ]}
        currentMemberId="me"
        onWakeUpMember={() => undefined}
        showWakeUpHint={false}
      />,
    );
    expect(learnedMarkup).not.toContain("aria-describedby");

    const allCompleteMarkup = renderToStaticMarkup(
      <SharedOasisScene
        progressPercentage={100}
        members={MEMBERS}
        currentMemberId="me"
        onWakeUpMember={() => undefined}
        showWakeUpHint
      />,
    );
    expect(allCompleteMarkup).not.toContain("aria-describedby");
  });
});

describe("기여 애니메이션", () => {
  it("측정한 픽셀 좌표로 섬에서 오아시스까지 이동 곡선을 만든다", () => {
    const path = getMeasuredWaterDropArc(
      { x: 72, y: 480 },
      { x: 188, y: 170 },
      580,
    );

    expect(path.left[0]).toBe("72px");
    expect(path.left[2]).toBe("188px");
    expect(path.top[0]).toBe("480px");
    expect(path.top[2]).toBe("170px");
    expect(Number.parseFloat(path.top[1])).toBeLessThan((480 + 170) / 2);
  });

  it("travel 단계에서도 고정 좌표 경로나 상시 물길을 서버 렌더링하지 않는다", () => {
    const markup = renderScene({
      percent: 75,
      event: createContributionEvent("friend"),
      phase: "travel",
    });

    expect(markup).toContain("shared-oasis-scene__member-water-origin");
    expect(markup).toContain("shared-oasis-scene__oasis-water-target");
    expect(markup).not.toContain("data-path-left");
    expect(markup).not.toContain("shared-oasis-scene__waterways");
  });

  it("impact 단계에 이벤트별 잔물결을 렌더링한다", () => {
    const event = createContributionEvent();
    const markup = renderScene({
      percent: 75,
      event,
      phase: "impact",
      impactIndex: 1,
    });

    expect(markup).toContain("shared-oasis-scene__impact-ripple");
    expect(markup).toContain('data-impact-index="1"');
  });

  it("reduced motion 상태와 live announcement를 유지한다", () => {
    const markup = renderScene({
      percent: 75,
      reducedMotion: true,
      announcement: "오늘의 오아시스를 완성했어요.",
    });

    expect(markup).toContain('data-reduced-motion="true"');
    expect(markup).toContain("shared-oasis-scene--reduced-motion");
    expect(markup).toContain('role="status"');
    expect(markup).toContain("오늘의 오아시스를 완성했어요.");
  });
});
