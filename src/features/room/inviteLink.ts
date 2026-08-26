import {
  getTossShareLink,
  setClipboardText,
  share,
} from "@apps-in-toss/web-framework";

type ClipboardWriter = (text: string) => Promise<void>;

const TOSS_APP_NAME = "our-oasis";

export function buildInviteUrl(
  roomId: string,
  base = window.location.origin + window.location.pathname,
): string {
  return `${base}#/room/join?roomId=${encodeURIComponent(roomId)}`;
}

export function buildTossInviteDeepLink(
  roomId: string,
  appName = TOSS_APP_NAME,
): string {
  return `intoss://${appName}/room/join?roomId=${encodeURIComponent(roomId)}`;
}

export function extractRoomIdFromInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const roomIdParamMatch = trimmed.match(/[?&]roomId=([^&]+)/);
  if (!roomIdParamMatch) return trimmed;

  try {
    return decodeURIComponent(roomIdParamMatch[1]);
  } catch {
    return roomIdParamMatch[1];
  }
}

export function canInviteMoreMembers(
  memberCount: number,
  maxMembers: number,
): boolean {
  return memberCount < maxMembers;
}

export async function copyTextWithFallback(
  text: string,
  primaryWriter: ClipboardWriter,
  fallbackWriter: ClipboardWriter,
): Promise<boolean> {
  try {
    await primaryWriter(text);
    return true;
  } catch {
    try {
      await fallbackWriter(text);
      return true;
    } catch {
      return false;
    }
  }
}

export async function copyInviteLink(roomId: string): Promise<boolean> {
  const url = buildInviteUrl(roomId);
  const fallbackWriter: ClipboardWriter = async (text) => {
    if (!navigator.clipboard) {
      throw new Error("클립보드를 사용할 수 없어요.");
    }
    await navigator.clipboard.writeText(text);
  };

  return copyTextWithFallback(url, setClipboardText, fallbackWriter);
}

export type ShareInviteLinkResult = "shared" | "copied" | "failed";

/**
 * 초대 링크를 공유한다.
 *
 * 토스 앱 안에서는 네이티브 공유 시트(`share`)로 딥링크(`intoss://`)를 바로 전달해서,
 * 받는 사람이 토스 앱 안에서 참여 화면으로 곧장 들어올 수 있게 한다.
 * 토스 앱 밖(브라우저 미리보기 등)이거나 API 호출이 실패하면
 * 기존 https 링크를 클립보드에 복사하는 방식으로 폴백한다.
 */
export async function shareInviteLink(
  roomId: string,
  {
    buildTossShareLink = getTossShareLink,
    nativeShare = (message: string) => share({ message }),
    fallbackCopy = copyInviteLink,
  }: {
    buildTossShareLink?: (deepLink: string) => Promise<string>;
    nativeShare?: (message: string) => Promise<void>;
    fallbackCopy?: (roomId: string) => Promise<boolean>;
  } = {},
): Promise<ShareInviteLinkResult> {
  try {
    const tossLink = await buildTossShareLink(buildTossInviteDeepLink(roomId));
    await nativeShare(tossLink);
    return "shared";
  } catch {
    const copied = await fallbackCopy(roomId);
    return copied ? "copied" : "failed";
  }
}
