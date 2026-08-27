import { useState } from 'react';
import { Button, TextField } from '@toss/tds-mobile';

interface Props {
  onSubmit: (roomName: string) => void;
  isSubmitting?: boolean;
}

export function CreateRoomForm({ onSubmit, isSubmitting = false }: Props) {
  const [roomName, setRoomName] = useState('');

  const isValid = roomName.trim().length >= 1 && roomName.trim().length <= 20;

  return (
    <div style={{ padding: '0 var(--screen-padding-x)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TextField
        label="방 이름"
        placeholder="예: 여름 수분 챌린지"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        maxLength={20}
        help={`${roomName.length}/20`}
        variant="box"
      />

      {/* 규칙 안내 */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--oasis-blue-100)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <RuleItem icon="🗓️" text="친구들과 7일 동안 함께해요" />
        <RuleItem icon="👥" text="최대 5명" />
        <RuleItem icon="💧" text="물 한 잔마다 물방울 1개, 하루 최대 4개" />
        <RuleItem
          icon="🌱"
          text="물방울 75%면 오늘 완성, 100%면 완벽 달성이에요"
        />
        <RuleItem
          icon="🏝️"
          text="7일 중 5일을 완성하면 최종 오아시스를 얻어요"
        />
      </div>

      <Button
        size="xlarge"
        variant="fill"
        onClick={() => isValid && onSubmit(roomName.trim())}
        disabled={!isValid || isSubmitting}
        aria-label="방 만들고 친구 초대하기"
        style={{ width: '100%' }}
      >
        {isSubmitting ? '방 만드는 중...' : '방 만들고 친구 초대하기'}
      </Button>
    </div>
  );
}

function RuleItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '15px', flexShrink: 0 }} aria-hidden="true">{icon}</span>
      <span style={{ fontSize: '14px', color: 'var(--color-label-normal)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
