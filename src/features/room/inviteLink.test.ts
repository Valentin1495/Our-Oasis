import { describe, expect, it, vi } from "vitest";
import {
  buildInviteUrl,
  buildTossInviteDeepLink,
  canInviteMoreMembers,
  copyTextWithFallback,
  extractRoomIdFromInput,
  shareInviteLink,
} from "./inviteLink";

describe("buildInviteUrl", () => {
  it("HashRouter 초대 링크를 생성한다", () => {
    expect(buildInviteUrl("room 1", "https://example.com/app/")).toBe(
      "https://example.com/app/#/room/join?roomId=room%201",
    );
  });
});

describe("buildTossInviteDeepLink", () => {
  it("intoss 스킴 딥링크를 생성한다", () => {
    expect(buildTossInviteDeepLink("room 1", "our-oasis")).toBe(
      "intoss://our-oasis/room/join?roomId=room%201",
    );
  });
});

describe("shareInviteLink", () => {
  it("네이티브 공유가 성공하면 shared를 반환한다", async () => {
    const buildTossShareLink = vi
      .fn()
      .mockResolvedValue("intoss-share-link");
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      shareInviteLink("room-1", {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("shared");
    expect(nativeShare).toHaveBeenCalledWith("intoss-share-link");
    expect(fallbackCopy).not.toHaveBeenCalled();
  });

  it("네이티브 공유가 실패하면 클립보드 복사로 폴백한다", async () => {
    const buildTossShareLink = vi
      .fn()
      .mockRejectedValue(new Error("토스 앱 밖이에요"));
    const nativeShare = vi.fn();
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      shareInviteLink("room-1", {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("copied");
    expect(nativeShare).not.toHaveBeenCalled();
    expect(fallbackCopy).toHaveBeenCalledWith("room-1");
  });

  it("공유와 폴백 복사 모두 실패하면 failed를 반환한다", async () => {
    const buildTossShareLink = vi
      .fn()
      .mockRejectedValue(new Error("토스 앱 밖이에요"));
    const nativeShare = vi.fn();
    const fallbackCopy = vi.fn().mockResolvedValue(false);

    await expect(
      shareInviteLink("room-1", {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("failed");
  });
});

describe("extractRoomIdFromInput", () => {
  it("초대 링크 전체를 붙여넣으면 roomId만 추출한다", () => {
    expect(
      extractRoomIdFromInput(
        "https://example.com/app/#/room/join?roomId=room%201",
      ),
    ).toBe("room 1");
  });

  it("뒤에 다른 쿼리 파라미터가 있어도 roomId만 추출한다", () => {
    expect(
      extractRoomIdFromInput(
        "https://example.com/#/room/join?roomId=ABC123&ref=share",
      ),
    ).toBe("ABC123");
  });

  it("코드만 입력하면 그대로 반환한다", () => {
    expect(extractRoomIdFromInput("ABC123")).toBe("ABC123");
  });

  it("앞뒤 공백을 제거한다", () => {
    expect(extractRoomIdFromInput("  ABC123  ")).toBe("ABC123");
  });
});

describe("canInviteMoreMembers", () => {
  it("정원 전에는 초대할 수 있다", () => {
    expect(canInviteMoreMembers(4, 5)).toBe(true);
  });

  it("정원에 도달하면 초대할 수 없다", () => {
    expect(canInviteMoreMembers(5, 5)).toBe(false);
  });
});

describe("copyTextWithFallback", () => {
  it("기본 클립보드 writer를 우선 사용한다", async () => {
    const primary = vi.fn().mockResolvedValue(undefined);
    const fallback = vi.fn().mockResolvedValue(undefined);

    await expect(
      copyTextWithFallback("invite", primary, fallback),
    ).resolves.toBe(true);
    expect(primary).toHaveBeenCalledWith("invite");
    expect(fallback).not.toHaveBeenCalled();
  });

  it("기본 writer 실패 시 fallback을 사용한다", async () => {
    const primary = vi.fn().mockRejectedValue(new Error("unsupported"));
    const fallback = vi.fn().mockResolvedValue(undefined);

    await expect(
      copyTextWithFallback("invite", primary, fallback),
    ).resolves.toBe(true);
    expect(fallback).toHaveBeenCalledWith("invite");
  });

  it("두 writer가 모두 실패하면 false를 반환한다", async () => {
    const primary = vi.fn().mockRejectedValue(new Error("unsupported"));
    const fallback = vi.fn().mockRejectedValue(new Error("denied"));

    await expect(
      copyTextWithFallback("invite", primary, fallback),
    ).resolves.toBe(false);
  });
});
