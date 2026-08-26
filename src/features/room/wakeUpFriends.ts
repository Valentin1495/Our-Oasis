import {
  getTossShareLink,
  setClipboardText,
  share,
} from "@apps-in-toss/web-framework";
import {
  buildInviteUrl,
  buildTossInviteDeepLink,
  copyTextWithFallback,
} from "./inviteLink";

/**
 * 오늘 하루 물방울 4개를 아직 다 채우지 못한 멤버에게 보낼 넛지 메시지를 만든다.
 * 한 번도 기록하지 않은 사람뿐 아니라 이미 일부 기여한 사람도 대상이 될 수
 * 있으므로, "아직 시작 안 함"을 단정하는 표현 대신 "마저 채우자"는 표현을
 * 쓴다. 닉네임만 노출하고 ml/순위 등 개인정보는 포함하지 않는다.
 */
export function buildWakeUpMessage(
  roomName: string,
  pendingNicknames: string[],
  inviteUrl: string,
): string {
  const intro =
    pendingNicknames.length > 0
      ? `${roomName} 오아시스, ${pendingNicknames.join(
          ", ",
        )}님과 함께 물방울을 마저 채워요!`
      : `${roomName} 오아시스가 오늘의 물방울을 기다리고 있어요!`;

  return `${intro} 물 한 잔으로 함께 완성해요 💧\n${inviteUrl}`;
}

export type WakeUpFriendsResult = "shared" | "copied" | "failed";

/**
 * 실제 푸시 발송 없이, 토스 네이티브 공유 시트로 넛지 메시지를 전달한다.
 * `shareInviteLink`와 같은 방식으로 딥링크를 짧은 공유 링크로 바꿔 전달하고,
 * 토스 앱 밖(브라우저 미리보기 등)이거나 공유가 실패하면 클립보드 복사로
 * 폴백한다.
 */
export async function wakeUpFriends(
  roomId: string,
  roomName: string,
  pendingNicknames: string[],
  {
    buildTossShareLink = getTossShareLink,
    nativeShare = (message: string) => share({ message }),
    fallbackCopy = (message: string) =>
      copyTextWithFallback(message, setClipboardText, async (text) => {
        if (!navigator.clipboard) {
          throw new Error("클립보드를 사용할 수 없어요.");
        }
        await navigator.clipboard.writeText(text);
      }),
  }: {
    buildTossShareLink?: (deepLink: string) => Promise<string>;
    nativeShare?: (message: string) => Promise<void>;
    fallbackCopy?: (message: string) => Promise<boolean>;
  } = {},
): Promise<WakeUpFriendsResult> {
  let inviteUrl: string;
  try {
    inviteUrl = await buildTossShareLink(buildTossInviteDeepLink(roomId));
  } catch {
    inviteUrl = buildInviteUrl(roomId);
  }

  const message = buildWakeUpMessage(roomName, pendingNicknames, inviteUrl);

  try {
    await nativeShare(message);
    return "shared";
  } catch {
    const copied = await fallbackCopy(message);
    return copied ? "copied" : "failed";
  }
}
