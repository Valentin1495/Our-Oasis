import { useState } from 'react';
import { Button, TextField } from '@toss/tds-mobile';
import { extractRoomIdFromInput } from './inviteLink';
import { getJoinRoomErrorMessage } from './joinRoomError';

interface Props {
  initialRoomId?: string;
  onSubmit: (roomId: string) => void;
  onInputChange?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function JoinRoomForm({
  initialRoomId = '',
  onSubmit,
  onInputChange,
  isSubmitting = false,
  error,
}: Props) {
  const [roomId, setRoomId] = useState(initialRoomId);

  const isValid = roomId.trim().length >= 1;
  const errorMessage = getJoinRoomErrorMessage(error);

  function handleRoomIdChange(value: string) {
    setRoomId(extractRoomIdFromInput(value));
    onInputChange?.();
  }

  return (
    <div style={{ padding: '0 var(--screen-padding-x)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <TextField
        label="초대 코드"
        placeholder="친구에게 받은 초대 링크를 붙여넣기 하세요"
        value={roomId}
        onChange={(e) => handleRoomIdChange(e.target.value)}
        variant="box"
        hasError={!!errorMessage}
        help={errorMessage}
      />

      <Button
        size="xlarge"
        variant="fill"
        onClick={() => isValid && onSubmit(roomId.trim())}
        disabled={!isValid || isSubmitting}
        aria-label="오아시스 방에 참여하기"
        style={{ width: '100%' }}
      >
        {isSubmitting ? '참여 중...' : '방 참여하기'}
      </Button>
    </div>
  );
}
