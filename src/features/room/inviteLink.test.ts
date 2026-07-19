import { describe, expect, it, vi } from "vitest";
import {
  buildInviteUrl,
  canInviteMoreMembers,
  copyTextWithFallback,
} from "./inviteLink";

describe("buildInviteUrl", () => {
  it("HashRouter 초대 링크를 생성한다", () => {
    expect(buildInviteUrl("room 1", "https://example.com/app/")).toBe(
      "https://example.com/app/#/room/join?roomId=room%201",
    );
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
