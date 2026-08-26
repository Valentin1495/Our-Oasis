import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WaterLogButton } from "./WaterLogButton";

describe("WaterLogButton", () => {
  it("공동 기여가 남아 있으면 오아시스에 물을 채우는 행동을 제공한다", () => {
    const markup = renderToStaticMarkup(
      <WaterLogButton
        hydration={{
          consumedMl: 500,
          goalMl: 2000,
          contributionDrops: 2,
        }}
      />,
    );

    expect(markup).toContain("물 한 잔 채우기");
    expect(markup).toContain("오늘 공동 기여 2/4");
    expect(markup).toContain('viewBox="0 0 32 40"');
  });

  it("공동 기여 4개 완료 후에도 개인 물 기록 행동을 유지한다", () => {
    const markup = renderToStaticMarkup(
      <WaterLogButton
        hydration={{
          consumedMl: 1000,
          goalMl: 2000,
          contributionDrops: 4,
        }}
      />,
    );

    expect(markup).toContain("물 한 잔 기록하기");
    expect(markup).toContain("오늘 공동 기여 4개 완료");
    expect(markup).not.toContain('disabled=""');
  });

  it("장면 피드백 중에는 중복 기록을 비활성화한다", () => {
    const markup = renderToStaticMarkup(
      <WaterLogButton
        hydration={{
          consumedMl: 500,
          goalMl: 2000,
          contributionDrops: 2,
        }}
        isVisualFeedbackPlaying
      />,
    );

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-label="물 기록 처리 중"');
    expect(markup).toContain("기록 중...");
  });

  it("되돌리기 배너가 떠 있어도 버튼은 활성 상태를 유지한다", () => {
    // undoWindow는 버튼을 막지 않는다 — 스토어에서 처리하는 별도 상태
    const markup = renderToStaticMarkup(
      <WaterLogButton
        hydration={{
          consumedMl: 500,
          goalMl: 2000,
          contributionDrops: 2,
        }}
      />,
    );

    expect(markup).not.toContain('disabled=""');
    expect(markup).toContain("물 한 잔 채우기");
  });

  it("다른 멤버가 기록 중이어도 내 버튼은 활성 상태를 유지한다", () => {
    // presence 기반 원격 잠금이 제거됐으므로, 버튼은 내 상태만으로 제어된다
    const markup = renderToStaticMarkup(
      <WaterLogButton
        hydration={{
          consumedMl: 500,
          goalMl: 2000,
          contributionDrops: 2,
        }}
      />,
    );

    expect(markup).not.toContain('disabled=""');
    expect(markup).toContain("물 한 잔 채우기");
  });
});
