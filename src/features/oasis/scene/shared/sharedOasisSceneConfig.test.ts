import { describe, expect, it } from "vitest";
import { deriveOasisSceneModel } from "../oasisSceneModel";
import {
  deriveSharedOasisPresentation,
  getMemberAnchors,
} from "./sharedOasisSceneConfig";

function getPresentation(percent: number) {
  return deriveSharedOasisPresentation(deriveOasisSceneModel(percent));
}

describe("deriveSharedOasisPresentation", () => {
  it("0%에서는 연못과 생명 요소를 표시하지 않는다", () => {
    expect(getPresentation(0)).toMatchObject({
      hasWater: false,
      showDeepWater: false,
      edgePlantLevel: 0,
      bloomState: "none",
      showPerfectEffects: false,
    });
  });

  it("25%부터 가장자리 식물을 표시한다", () => {
    expect(getPresentation(25)).toMatchObject({
      hasWater: true,
      showDeepWater: false,
      edgePlantLevel: 1,
      bloomState: "none",
    });
  });

  it("50%부터 깊은 물 영역을 표시한다", () => {
    expect(getPresentation(50)).toMatchObject({
      showDeepWater: true,
      edgePlantLevel: 1,
    });
  });

  it("75% 공동 성공에서는 봉오리를 표시한다", () => {
    expect(getPresentation(75)).toMatchObject({
      edgePlantLevel: 2,
      bloomState: "bud",
      bloomProgress: 0.55,
      showPerfectEffects: false,
      lighting: "success",
    });
  });

  it("76%부터 추가 잎을 표시한다", () => {
    expect(getPresentation(76)).toMatchObject({
      edgePlantLevel: 2,
      bloomState: "bud",
    });
  });

  it("100% 완벽 성공에서는 꽃과 완벽 효과를 표시한다", () => {
    expect(getPresentation(100)).toMatchObject({
      edgePlantLevel: 2,
      bloomState: "flower",
      bloomProgress: 1,
      showPerfectEffects: true,
      lighting: "perfect",
    });
  });

  it("수위에 따라 연못 크기가 연속적으로 증가한다", () => {
    const at25 = getPresentation(25).pondScale;
    const at50 = getPresentation(50).pondScale;
    const at75 = getPresentation(75).pondScale;

    expect(at50).toBeGreaterThan(at25);
    expect(at75).toBeGreaterThan(at50);
  });

  it.each([1, 2, 3, 4, 5] as const)(
    "%s명용 고정 anchor를 장면 안에 제공한다",
    (memberCount) => {
      const anchors = getMemberAnchors(memberCount);
      expect(anchors).toHaveLength(memberCount);
      expect(new Set(anchors.map(({ x, y }) => `${x}:${y}`)).size)
        .toBe(memberCount);
      anchors.forEach((anchor) => {
        expect(anchor.x).toBeGreaterThanOrEqual(0);
        expect(anchor.x).toBeLessThanOrEqual(360);
        expect(anchor.y).toBeGreaterThanOrEqual(0);
        expect(anchor.y).toBeLessThanOrEqual(320);
      });
    },
  );
});
