import { useState } from 'react';
import { Button } from '@toss/tds-mobile';
import { setClipboardText } from '@apps-in-toss/web-framework';

interface Props {
  roomId: string;
}

function buildInviteUrl(roomId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}#/room/join?roomId=${roomId}`;
}

export function InviteLinkCard({ roomId }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = buildInviteUrl(roomId);
    try {
      await setClipboardText(url);
    } catch {
      // WebView 밖(개발 환경)에서는 navigator.clipboard로 폴백
      await navigator.clipboard.writeText(url).catch(() => undefined);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div
      style={{
        margin: '0 var(--screen-padding-x)',
        padding: '16px',
        backgroundColor: 'var(--oasis-mint-100)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-label-normal)', fontWeight: 600 }}>
        친구에게 초대 링크를 보내세요
      </p>
      <div
        style={{
          padding: '10px 12px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--color-label-alternative)',
          wordBreak: 'break-all',
        }}
        aria-label="초대 링크"
      >
        {buildInviteUrl(roomId)}
      </div>
      <Button
        size="medium"
        variant={copied ? 'weak' : 'fill'}
        onClick={handleCopy}
        aria-label={copied ? '초대 링크 복사 완료' : '초대 링크 복사하기'}
        style={{ width: '100%' }}
      >
        {copied ? '복사 완료 ✓' : '초대 링크 복사하기'}
      </Button>
    </div>
  );
}
