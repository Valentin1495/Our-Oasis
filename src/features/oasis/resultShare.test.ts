import { describe, expect, it, vi } from "vitest";
import {
  buildOasisResultShareMessage,
  getValidOasisOgImageUrl,
  shareOasisResult,
  type OasisResultShareInput,
} from "./resultShare";

const sharedSuccess: OasisResultShareInput = {
  kind: "shared_success",
  roomId: "room-1",
  roomName: "여름 오아시스",
  dayIndex: 2,
  completionPercent: 75,
  allParticipated: true,
};

describe("buildOasisResultShareMessage", () => {
  it("75% 공동 성공은 참여와 공동 완성을 강조한다", () => {
    const message = buildOasisResultShareMessage(
      sharedSuccess,
      "https://toss.im/share",
    );

    expect(message).toContain("2일차 오아시스를 완성했어요");
    expect(message).toContain("75%");
    expect(message).toContain("모든 팀원이 함께했어요");
    expect(message).toContain("같이 키우고 싶다면");
    expect(message).not.toContain("완벽하게 완성");
  });

  it("100% 완벽 성공은 75%와 다른 등급 문구를 사용한다", () => {
    const message = buildOasisResultShareMessage(
      {
        ...sharedSuccess,
        kind: "perfect_success",
        completionPercent: 100,
      },
      "https://toss.im/share",
    );

    expect(message).toContain("완벽하게 완성했어요");
    expect(message).toContain("100%를 채웠어요");
  });

  it("주간 5일 성공과 7일 전체 성공을 구분한다", () => {
    const weekly = buildOasisResultShareMessage(
      {
        kind: "weekly_success",
        roomId: "room-1",
        roomName: "여름 오아시스",
        completedDays: 5,
        perfectDays: 2,
        allParticipatedDays: 3,
      },
      "https://toss.im/share",
    );
    const sevenDays = buildOasisResultShareMessage(
      {
        kind: "seven_day_perfect",
        roomId: "room-1",
        roomName: "여름 오아시스",
        completedDays: 7,
        perfectDays: 4,
        allParticipatedDays: 5,
      },
      "https://toss.im/share",
    );

    expect(weekly).toContain("7일 중 5일");
    expect(sevenDays).toContain("7일 모두");
  });
});

describe("getValidOasisOgImageUrl", () => {
  it("공개 HTTPS 이미지만 OG URL로 사용한다", () => {
    expect(getValidOasisOgImageUrl("https://cdn.example.com/oasis.png")).toBe(
      "https://cdn.example.com/oasis.png",
    );
    expect(getValidOasisOgImageUrl("http://example.com/oasis.png")).toBe(
      undefined,
    );
    expect(getValidOasisOgImageUrl("not-a-url")).toBe(undefined);
  });
});

describe("shareOasisResult", () => {
  it("운영 딥링크를 공유 링크로 바꿔 상태별 메시지와 함께 공유한다", async () => {
    const buildTossShareLink = vi.fn().mockResolvedValue("toss-share-link");
    const nativeShare = vi.fn().mockResolvedValue(undefined);

    await expect(
      shareOasisResult(sharedSuccess, {
        buildTossShareLink,
        ogImageUrl: "https://cdn.example.com/oasis-og.png",
        nativeShare,
      }),
    ).resolves.toBe("shared");

    expect(buildTossShareLink).toHaveBeenCalledWith(
      "intoss://our-oasis/room/join?roomId=room-1",
      "https://cdn.example.com/oasis-og.png",
    );
    expect(nativeShare.mock.calls[0][0]).toContain("toss-share-link");
  });

  it("네이티브 공유가 실패하면 전체 결과 메시지를 복사한다", async () => {
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      shareOasisResult(sharedSuccess, {
        buildTossShareLink: vi.fn().mockResolvedValue("toss-share-link"),
        nativeShare: vi.fn().mockRejectedValue(new Error("cancelled")),
        fallbackCopy,
      }),
    ).resolves.toBe("copied");

    expect(fallbackCopy.mock.calls[0][0]).toContain("75%");
    expect(fallbackCopy.mock.calls[0][0]).toContain("toss-share-link");
  });

  it("공유 링크 생성과 네이티브 공유가 실패해도 웹 링크 복사를 시도한다", async () => {
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      shareOasisResult(sharedSuccess, {
        buildTossShareLink: vi.fn().mockRejectedValue(new Error("offline")),
        buildWebInviteLink: (roomId) =>
          `https://example.com/#/room/join?roomId=${roomId}`,
        nativeShare: vi.fn().mockRejectedValue(new Error("unsupported")),
        fallbackCopy,
      }),
    ).resolves.toBe("copied");

    expect(fallbackCopy.mock.calls[0][0]).toContain(
      "#/room/join?roomId=room-1",
    );
  });

  it("공유와 복사가 모두 실패하면 failed를 반환한다", async () => {
    await expect(
      shareOasisResult(sharedSuccess, {
        buildTossShareLink: vi.fn().mockResolvedValue("toss-share-link"),
        nativeShare: vi.fn().mockRejectedValue(new Error("unsupported")),
        fallbackCopy: vi.fn().mockResolvedValue(false),
      }),
    ).resolves.toBe("failed");
  });
});
