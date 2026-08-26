import { describe, expect, it } from "vitest";
import {
  computeContributionDropsFromCups,
  computeCupsPerDrop,
} from "./computeContributionDrops";

describe("computeContributionDropsFromCups", () => {
  it("첫 잔에서 물방울 1개를 준다", () => {
    expect(computeContributionDropsFromCups(1, 0)).toBe(1);
  });

  it("이미 4개면 더 주지 않는다", () => {
    expect(computeContributionDropsFromCups(5, 4)).toBe(0);
  });
});

describe("computeCupsPerDrop", () => {
  it("한 잔이 물방울 1개다", () => {
    expect(computeCupsPerDrop(250)).toBe(1);
  });
});
