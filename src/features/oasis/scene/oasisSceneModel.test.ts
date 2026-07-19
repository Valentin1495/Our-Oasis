import { describe, expect, it } from "vitest";
import { deriveOasisSceneModel } from "./oasisSceneModel";

describe("deriveOasisSceneModel", () => {
  it.each([
    [0, "dry"],
    [1, "first-life"],
    [24, "first-life"],
    [25, "growing"],
    [49, "growing"],
    [50, "thriving"],
    [74, "thriving"],
    [75, "community-success"],
    [99, "community-success"],
    [100, "perfect"],
  ] as const)("%s%%를 %s 상태로 변환한다", (percent, phase) => {
    expect(deriveOasisSceneModel(percent).phase).toBe(phase);
  });

  it("0%에서는 물이 없다", () => {
    expect(deriveOasisSceneModel(0)).toMatchObject({
      waterLevel: 0,
      hasWater: false,
    });
  });

  it("1%부터 식별 가능한 최소 수위가 활성화된다", () => {
    const model = deriveOasisSceneModel(1);

    expect(model.hasWater).toBe(true);
    expect(model.waterLevel).toBeGreaterThan(0);
    expect(model.bloomState).toBe("none");
    expect(model.edgePlantLevel).toBe(0);
  });

  it("25%부터 연못 가장자리 잎이 활성화된다", () => {
    expect(deriveOasisSceneModel(25)).toMatchObject({
      edgePlantLevel: 1,
      bloomState: "none",
    });
  });

  it("75%는 공동 성공 상태다", () => {
    expect(deriveOasisSceneModel(75)).toMatchObject({
      phase: "community-success",
      isCommunitySuccess: true,
      isPerfect: false,
      bloomState: "bud",
      edgePlantLevel: 1,
      bloomProgress: 0.55,
    });
  });

  it("76~99%에서는 잎과 꽃봉오리가 점진적으로 성장한다", () => {
    const at76 = deriveOasisSceneModel(76);
    const at99 = deriveOasisSceneModel(99);

    expect(at76.edgePlantLevel).toBe(2);
    expect(at99.edgePlantLevel).toBe(2);
    expect(at99.bloomProgress).toBeGreaterThan(at76.bloomProgress);
    expect(at99.bloomProgress).toBeLessThan(1);
  });

  it("100%는 완벽 성공 상태다", () => {
    expect(deriveOasisSceneModel(100)).toMatchObject({
      phase: "perfect",
      isCommunitySuccess: true,
      isPerfect: true,
      waterLevel: 1,
      bloomState: "flower",
      edgePlantLevel: 2,
      bloomProgress: 1,
    });
  });

  it("범위를 벗어난 입력을 0~100으로 제한한다", () => {
    expect(deriveOasisSceneModel(-10)).toMatchObject({
      percent: 0,
      phase: "dry",
      waterLevel: 0,
    });
    expect(deriveOasisSceneModel(120)).toMatchObject({
      percent: 100,
      phase: "perfect",
      waterLevel: 1,
    });
  });
});
