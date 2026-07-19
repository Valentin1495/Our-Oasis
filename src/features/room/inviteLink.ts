import { setClipboardText } from "@apps-in-toss/web-framework";

type ClipboardWriter = (text: string) => Promise<void>;

export function buildInviteUrl(
  roomId: string,
  base = window.location.origin + window.location.pathname,
): string {
  return `${base}#/room/join?roomId=${encodeURIComponent(roomId)}`;
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
