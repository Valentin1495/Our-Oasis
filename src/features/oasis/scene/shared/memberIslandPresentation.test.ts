import { describe, expect, it } from "vitest";
import {
  getMemberAccent,
  getIslandVisualState,
  getMemberAnimationTiming,
  getMemberIslandStatus,
  getMemberLabelSide,
  MEMBER_ACCENT_PALETTE,
  normalizeMemberDrops,
} from "./memberIslandPresentation";

describe("memberIslandPresentation", () => {
  it.each([
    [{ drops: 0, hasWaterRecordToday: false }, "pending"],
    [{ drops: 0, hasWaterRecordToday: true }, "participated"],
    [{ drops: 1, hasWaterRecordToday: true }, "contributing"],
    [{ drops: 3, hasWaterRecordToday: true }, "contributing"],
    [{ drops: 4, hasWaterRecordToday: true }, "complete"],
  ] as const)("%o 입력을 %s 상태로 표현한다", (input, expected) => {
    expect(getMemberIslandStatus(input)).toBe(expected);
  });

  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [-2, 0],
    [1.6, 2],
    [8, 4],
  ])("물방울 %s를 %s로 정규화한다", (drops, expected) => {
    expect(normalizeMemberDrops(drops)).toBe(expected);
  });

  it("같은 멤버 ID에는 항상 같은 허용 팔레트 색을 배정한다", () => {
    const first = getMemberAccent("member-alpha");
    const second = getMemberAccent("member-alpha");

    expect(second).toBe(first);
    expect(MEMBER_ACCENT_PALETTE).toContain(first);
  });

  it("서로 다른 배열 순서에서도 멤버별 색을 유지한다", () => {
    const ids = ["member-alpha", "member-beta", "member-gamma"];
    const original = Object.fromEntries(
      ids.map((id) => [id, getMemberAccent(id)]),
    );
    const reordered = Object.fromEntries(
      [...ids].reverse().map((id) => [id, getMemberAccent(id)]),
    );

    expect(reordered).toEqual(original);
  });

  it("물방울이 늘수록 섬은 높아지고 그림자는 작고 흐려진다", () => {
    const presentations = [0, 1, 2, 3, 4].map((drops) =>
      getIslandVisualState(drops, 4),
    );

    for (let index = 1; index < presentations.length; index += 1) {
      const previous = presentations[index - 1];
      const current = presentations[index];

      expect(current.liftPx).toBeGreaterThan(previous.liftPx);
      expect(current.floatAmountPx).toBeGreaterThan(previous.floatAmountPx);
      expect(current.shadowScaleX).toBeLessThan(previous.shadowScaleX);
      expect(current.shadowScaleY).toBeLessThan(previous.shadowScaleY);
      expect(current.shadowOpacity).toBeLessThan(previous.shadowOpacity);
      expect(current.shadowBlurPx).toBeGreaterThan(previous.shadowBlurPx);
      expect(current.hazeOpacity).toBeGreaterThan(previous.hazeOpacity);
      expect(current.mirageTailOpacity).toBeGreaterThan(
        previous.mirageTailOpacity,
      );
      expect(current.saturation).toBeGreaterThan(previous.saturation);
      expect(current.brightness).toBeGreaterThan(previous.brightness);
      expect(current.islandOpacity).toBeGreaterThan(previous.islandOpacity);
      expect(current.connectionOpacity).toBeGreaterThan(
        previous.connectionOpacity,
      );
    }

    expect(presentations[0]).toMatchObject({
      progress: 0,
      easedProgress: 0,
      liftPx: 8,
      floatAmountPx: 2,
      shadowScaleX: 0.95,
      shadowScaleY: 0.82,
      shadowOpacity: 0.21,
      shadowBlurPx: 7,
      hazeOpacity: 0.1,
      mirageTailOpacity: 0.22,
      saturation: 0.62,
      brightness: 0.9,
      islandOpacity: 0.86,
      connectionOpacity: 0.1,
    });
    expect(presentations[4]).toMatchObject({
      progress: 1,
      easedProgress: 1,
      liftPx: 30,
      floatAmountPx: 4,
      shadowScaleX: 0.7,
      shadowScaleY: 0.6,
      shadowOpacity: 0.11,
      shadowBlurPx: 18,
      hazeOpacity: 0.28,
      mirageTailOpacity: 0.52,
      saturation: 1,
      brightness: 1.03,
      islandOpacity: 1,
      connectionOpacity: 0.58,
    });
  });

  it.each([
    [Number.NaN, 4, 0],
    [2, Number.NaN, 0],
    [2, 0, 0],
    [-1, 4, 0],
    [8, 4, 1],
  ])(
    "completed %s, total %s를 진행률 %s로 제한한다",
    (completed, total, expected) => {
      expect(getIslandVisualState(completed, total).progress).toBe(expected);
    },
  );

  it("선형 진행률에 cubic ease-out을 적용한다", () => {
    expect(getIslandVisualState(1, 4)).toMatchObject({
      progress: 0.25,
      easedProgress: 0.578,
    });
  });

  it("멤버 ID에 따라 4~5.4초 주기와 결정적인 위상을 사용한다", () => {
    const ids = ["member-alpha", "member-beta", "member-gamma"];
    const original = Object.fromEntries(
      ids.map((id) => [id, getMemberAnimationTiming(id)]),
    );
    const reordered = Object.fromEntries(
      [...ids].reverse().map((id) => [id, getMemberAnimationTiming(id)]),
    );

    expect(reordered).toEqual(original);
    expect(
      Object.values(original).every(
        ({ durationSeconds }) => durationSeconds >= 4 && durationSeconds <= 5.4,
      ),
    ).toBe(true);
    expect(
      Object.values(original).every(({ delaySeconds }) => delaySeconds <= 0),
    ).toBe(true);
    expect(
      new Set(Object.values(original).map(({ delaySeconds }) => delaySeconds))
        .size,
    ).toBeGreaterThan(1);
  });

  it.each([
    [10, "left"],
    [44.9, "left"],
    [45, "center"],
    [55, "center"],
    [55.1, "right"],
    [90, "right"],
  ] as const)(
    "수평 위치 %s%%의 명패를 %s 방향으로 펼친다",
    (xPercent, expected) => {
      expect(getMemberLabelSide(xPercent)).toBe(expected);
    },
  );
});
