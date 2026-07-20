import { describe, expect, it } from "vitest";
import {
  getMemberAccent,
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
