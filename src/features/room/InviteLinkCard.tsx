import { useEffect, useRef, useState } from "react";
import { Button } from "@toss/tds-mobile";
import { buildInviteUrl, copyInviteLink } from "./inviteLink";

interface Props {
  roomId: string;
}

export function InviteLinkCard({ roomId }: Props) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  async function handleCopy() {
    const didCopy = await copyInviteLink(roomId);
    setCopied(didCopy);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (didCopy) {
      resetTimerRef.current = setTimeout(() => setCopied(false), 2500);
    }
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
        친구에게 초대 링크를 보내세요
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
        variant={copied ? "weak" : "fill"}
        onClick={handleCopy}
        aria-label={copied ? "초대 링크 복사 완료" : "초대 링크 복사하기"}
        style={{ width: "100%" }}
      >
        {copied ? "복사 완료 ✓" : "초대 링크 복사하기"}
      </Button>
    </div>
  );
}
