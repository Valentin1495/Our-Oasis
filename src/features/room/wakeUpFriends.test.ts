import { describe, expect, it, vi } from "vitest";
import { buildWakeUpMessage, wakeUpFriends } from "./wakeUpFriends";

describe("buildWakeUpMessage", () => {
  it("아직 4개를 다 채우지 않은 멤버 닉네임을 메시지에 포함한다", () => {
    const message = buildWakeUpMessage(
      "여름 수분 챌린지",
      ["민지", "서연"],
      "https://example.com/#/room/join?roomId=room-1",
    );

    expect(message).toContain("민지, 서연");
    expect(message).toContain("여름 수분 챌린지");
    expect(message).toContain("https://example.com/#/room/join?roomId=room-1");
  });

  it("이미 일부 기여한 멤버에게도 '기다린다'는 단정 표현을 쓰지 않는다", () => {
    const message = buildWakeUpMessage(
      "여름 수분 챌린지",
      ["민지"],
      "https://example.com/#/room/join?roomId=room-1",
    );

    expect(message).not.toContain("민지님을 기다리고");
    expect(message).toContain("마저 채워요");
  });

  it("대상이 없다면 이름 없이 일반 넛지 메시지를 만든다", () => {
    const message = buildWakeUpMessage(
      "여름 수분 챌린지",
      [],
      "https://example.com/#/room/join?roomId=room-1",
    );

    expect(message).toContain("여름 수분 챌린지");
    expect(message).not.toContain("님과 함께");
  });
});

describe("wakeUpFriends", () => {
  it("네이티브 공유가 성공하면 shared를 반환한다", async () => {
    const buildTossShareLink = vi.fn().mockResolvedValue("intoss-share-link");
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      wakeUpFriends("room-1", "여름 수분 챌린지", ["민지"], {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("shared");
    expect(nativeShare).toHaveBeenCalledTimes(1);
    expect(nativeShare.mock.calls[0][0]).toContain("intoss-share-link");
    expect(fallbackCopy).not.toHaveBeenCalled();
  });

  it("네이티브 공유가 실패하면 클립보드 복사로 폴백한다", async () => {
    const buildTossShareLink = vi.fn().mockResolvedValue("intoss-share-link");
    const nativeShare = vi.fn().mockRejectedValue(new Error("토스 앱 밖이에요"));
    const fallbackCopy = vi.fn().mockResolvedValue(true);

    await expect(
      wakeUpFriends("room-1", "여름 수분 챌린지", ["민지"], {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("copied");
    expect(fallbackCopy).toHaveBeenCalledTimes(1);
  });

  it("공유와 폴백 복사 모두 실패하면 failed를 반환한다", async () => {
    const buildTossShareLink = vi.fn().mockResolvedValue("intoss-share-link");
    const nativeShare = vi.fn().mockRejectedValue(new Error("토스 앱 밖이에요"));
    const fallbackCopy = vi.fn().mockResolvedValue(false);

    await expect(
      wakeUpFriends("room-1", "여름 수분 챌린지", ["민지"], {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("failed");
  });

  it("공유 링크 생성이 실패해도 https 링크로 폴백해 계속 동작한다", async () => {
    const buildTossShareLink = vi
      .fn()
      .mockRejectedValue(new Error("토스 앱 밖이에요"));
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    const fallbackCopy = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("window", { location: { origin: "https://example.com", pathname: "/app/" } });

    await expect(
      wakeUpFriends("room-1", "여름 수분 챌린지", ["민지"], {
        buildTossShareLink,
        nativeShare,
        fallbackCopy,
      }),
    ).resolves.toBe("shared");
    expect(nativeShare.mock.calls[0][0]).toContain("https://example.com/app/");

    vi.unstubAllGlobals();
  });
});
