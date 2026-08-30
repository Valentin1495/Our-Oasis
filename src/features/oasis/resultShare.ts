import {
  getTossShareLink,
  setClipboardText,
  share,
} from "@apps-in-toss/web-framework";
import {
  buildInviteUrl,
  buildTossInviteDeepLink,
  copyTextWithFallback,
} from "../room/inviteLink";

export type ResultShareOutcome = "shared" | "copied" | "failed";

export type OasisResultShareInput =
  | {
      kind: "shared_success" | "perfect_success";
      roomId: string;
      roomName: string;
      dayIndex: number;
      completionPercent: number;
      allParticipated: boolean;
    }
  | {
      kind: "weekly_success" | "seven_day_perfect";
      roomId: string;
      roomName: string;
      completedDays: number;
      perfectDays: number;
      allParticipatedDays: number;
    };

type ClipboardWriter = (message: string) => Promise<boolean>;
type TossShareLinkBuilder = (
  deepLink: string,
  ogImageUrl?: string,
) => Promise<string>;

const configuredOgImageUrl = import.meta.env.VITE_OASIS_OG_IMAGE_URL?.trim();

export function getValidOasisOgImageUrl(
  value = configuredOgImageUrl,
): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function buildOasisResultShareMessage(
  input: OasisResultShareInput,
  participationLink: string,
): string {
  switch (input.kind) {
    case "shared_success": {
      const participation = input.allParticipated
        ? "오늘은 모든 팀원이 함께했어요.\n"
        : "";
      return `🌴 ${input.roomName}의 ${input.dayIndex}일차 오아시스를 완성했어요!\n친구들의 물방울이 모여 ${input.completionPercent}%가 됐어요.\n${participation}\n같이 키우고 싶다면 💧\n${participationLink}`;
    }
    case "perfect_success":
      return `✨ ${input.roomName}의 ${input.dayIndex}일차 오아시스를 완벽하게 완성했어요!\n모두의 물방울이 모여 100%를 채웠어요.\n\n같이 키우고 싶다면 💧\n${participationLink}`;
    case "weekly_success":
      return `🎉 ${input.roomName}에서 7일 중 ${input.completedDays}일 오아시스를 완성했어요!\n100% 완벽 달성 ${input.perfectDays}일 · 전원 참여 ${input.allParticipatedDays}일\n\n같이 키우고 싶다면 🌴\n${participationLink}`;
    case "seven_day_perfect":
      return `🏆 ${input.roomName}에서 7일 모두 오아시스를 완성했어요!\n100% 완벽 달성 ${input.perfectDays}일 · 전원 참여 ${input.allParticipatedDays}일\n\n같이 키우고 싶다면 ✨\n${participationLink}`;
  }
}

async function copyResultMessage(message: string): Promise<boolean> {
  return copyTextWithFallback(message, setClipboardText, async (text) => {
    if (!navigator.clipboard) {
      throw new Error("클립보드를 사용할 수 없어요.");
    }
    await navigator.clipboard.writeText(text);
  });
}

/** 성취를 먼저 보여주고 참여 링크를 보조로 덧붙인 결과 메시지를 공유한다. */
export async function shareOasisResult(
  input: OasisResultShareInput,
  {
    buildTossShareLink = getTossShareLink,
    buildWebInviteLink = buildInviteUrl,
    ogImageUrl = getValidOasisOgImageUrl(),
    nativeShare = (message: string) => share({ message }),
    fallbackCopy = copyResultMessage,
  }: {
    buildTossShareLink?: TossShareLinkBuilder;
    buildWebInviteLink?: (roomId: string) => string;
    ogImageUrl?: string;
    nativeShare?: (message: string) => Promise<void>;
    fallbackCopy?: ClipboardWriter;
  } = {},
): Promise<ResultShareOutcome> {
  let participationLink: string;
  try {
    const deepLink = buildTossInviteDeepLink(input.roomId);
    participationLink = ogImageUrl
      ? await buildTossShareLink(deepLink, ogImageUrl)
      : await buildTossShareLink(deepLink);
  } catch {
    participationLink = buildWebInviteLink(input.roomId);
  }

  const message = buildOasisResultShareMessage(input, participationLink);
  try {
    await nativeShare(message);
    return "shared";
  } catch {
    const copied = await fallbackCopy(message);
    return copied ? "copied" : "failed";
  }
}
