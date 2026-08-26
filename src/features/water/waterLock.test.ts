import { describe, expect, it } from "vitest";
import { isWaterActionLocked } from "./waterLock";

describe("isWaterActionLocked", () => {
  it("아무 잠금도 없으면 입력할 수 있다", () => {
    expect(
      isWaterActionLocked({ isLoggingWater: false, isVisualFeedbackPlaying: false }),
    ).toBe(false);
  });

  it("RPC 호출 중이면 중복 기록을 막는다", () => {
    expect(
      isWaterActionLocked({ isLoggingWater: true, isVisualFeedbackPlaying: false }),
    ).toBe(true);
  });

  it("장면 애니메이션 중에는 기록을 막는다", () => {
    expect(
      isWaterActionLocked({ isLoggingWater: false, isVisualFeedbackPlaying: true }),
    ).toBe(true);
  });

  it("되돌리기 창이 열려 있어도 다음 기록은 막지 않는다", () => {
    // hasPendingUndo / isRemoteLocked는 더 이상 이 함수로 처리하지 않는다.
    expect(
      isWaterActionLocked({ isLoggingWater: false, isVisualFeedbackPlaying: false }),
    ).toBe(false);
  });
});
