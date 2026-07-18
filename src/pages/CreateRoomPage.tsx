import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Top } from '@toss/tds-mobile';
import { ScreenContainer, InlineError } from '../components';
import { CreateRoomForm, InviteLinkCard } from '../features/room';
import { useOasisStore } from '../lib/store/useOasisStore';
import { getAnonymousUserKey } from '../lib/toss/getAnonymousUserKey';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const { profile, repository, setCurrentRoom, setProfile } = useOasisStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);

  async function handleCreate(roomName: string) {
    if (!profile) {
      navigate('/profile?next=create');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const tossAnonymousKey = await getAnonymousUserKey();
      const { room, memberId } = await repository.createRoom({
        name: roomName,
        profile,
        tossAnonymousKey,
      });
      setCurrentRoom(room);
      // mock이 발급한 실제 memberId로 store 동기화
      setProfile(profile, memberId);
      setCreatedRoomId(room.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '방 만들기에 실패했어요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoToOasis() {
    if (createdRoomId) navigate(`/oasis/${createdRoomId}`);
  }

  return (
    <ScreenContainer>
      <Top
        title={<Top.TitleParagraph size={22}>방 만들기</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            7일 동안 함께 오아시스를 키워요
          </Top.SubtitleParagraph>
        }
        upperGap={16}
        lowerGap={24}
      />

      {createdRoomId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '0 20px' }}>
            <p
              style={{
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--color-label-normal)',
                margin: 0,
              }}
            >
              방이 만들어졌어요! 🎉
            </p>
            <p style={{ fontSize: '14px', color: 'var(--color-label-alternative)', margin: '8px 0 0' }}>
              아래 링크를 친구에게 보내 함께 시작해요.
            </p>
          </div>
          <InviteLinkCard roomId={createdRoomId} />
          <div style={{ padding: '0 20px' }}>
            <button
              type="button"
              onClick={handleGoToOasis}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--oasis-mint-500)',
                color: '#fff',
                fontSize: '17px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
              }}
              aria-label="오아시스 메인 화면으로 이동"
            >
              오아시스 시작하기
            </button>
          </div>
        </div>
      ) : (
        <>
          <CreateRoomForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
          {error && <InlineError message={error} onRetry={() => setError(null)} />}
        </>
      )}
    </ScreenContainer>
  );
}
