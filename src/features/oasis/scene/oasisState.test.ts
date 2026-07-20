import { describe, expect, it } from "vitest";
import {
  getOasisStatus,
  normalizeProgressPercentage,
} from "./oasisState";

describe("getOasisStatus", () => {
  it.each([
    [-10, "IN_PROGRESS"],
    [0, "IN_PROGRESS"],
    [74.99, "IN_PROGRESS"],
    [75, "SHARED_SUCCESS"],
    [99.99, "SHARED_SUCCESS"],
    [100, "PERFECT_SUCCESS"],
    [120, "PERFECT_SUCCESS"],
    [Number.NaN, "IN_PROGRESS"],
  ] as const)("%s를 %s 상태로 변환한다", (percent, expected) => {
    expect(getOasisStatus(percent)).toBe(expected);
  });

  it("유효하지 않거나 범위를 벗어난 진행률을 정규화한다", () => {
    expect(normalizeProgressPercentage(-1)).toBe(0);
    expect(normalizeProgressPercentage(101)).toBe(100);
    expect(normalizeProgressPercentage(Number.NaN)).toBe(0);
    expect(normalizeProgressPercentage(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
