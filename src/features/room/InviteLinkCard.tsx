import { useEffect, useRef, useState } from "react";
import { Button } from "@toss/tds-mobile";
import { buildInviteUrl, shareInviteLink } from "./inviteLink";
import type { ShareInviteLinkResult } from "./inviteLink";
import { trackOasisEvent } from "../../lib/analytics/oasisAnalytics";

interface Props {
  roomId: string;
}

const RESULT_LABEL: Record<ShareInviteLinkResult, string> = {
  shared: "공유 시트를 열었어요",
  copied: "복사 완료 ✓",
  failed: "공유에 실패했어요. 다시 시도해주세요.",
};

export function InviteLinkCard({ roomId }: Props) {
  const [result, setResult] = useState<ShareInviteLinkResult | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  async function handleShare() {
    const shareResult = await shareInviteLink(roomId);
    if (shareResult !== "failed") {
      trackOasisEvent("invite_shared", {
        entry_point: "room_created",
        share_method: shareResult === "shared" ? "native_share" : "clipboard",
      });
    }
    setResult(shareResult);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setResult(null), 2500);
  }

  return (
    <div
      style={{
        margin: "0 var(--screen-padding-x)",
        padding: "16px",
        backgroundColor: "var(--oasis-mint-100)",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "var(--color-label-normal)",
          fontWeight: 600,
        }}
      >
        함께 오아시스를 키울 친구를 초대하세요
      </p>
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "var(--color-surface)",
          borderRadius: "8px",
          fontSize: "12px",
          color: "var(--color-label-alternative)",
          wordBreak: "break-all",
        }}
        aria-label="초대 링크"
      >
        {buildInviteUrl(roomId)}
      </div>
      <Button
        size="medium"
        variant={result ? "weak" : "fill"}
        onClick={handleShare}
        aria-label={result ? RESULT_LABEL[result] : "함께할 친구 초대하기"}
        style={{ width: "100%" }}
      >
        {result ? RESULT_LABEL[result] : "함께할 친구 초대하기"}
      </Button>
    </div>
  );
}
