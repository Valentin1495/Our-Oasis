import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Top } from '@toss/tds-mobile';
import { ScreenContainer } from '../components';
import { ProfileSetupForm } from '../features/profile';
import { useOasisStore } from '../lib/store/useOasisStore';
import { getAnonymousUserKey } from '../lib/toss/getAnonymousUserKey';
import type { Profile } from '../types';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') ?? 'create';
  const roomId = searchParams.get('roomId');
  const { setProfile, repository, setCurrentRoom, rememberJoinedRoom } =
    useOasisStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(profileData: Omit<Profile, 'id'>) {
    setIsSubmitting(true);
    setError(null);
    const tempId = Math.random().toString(36).slice(2, 10);
    const profile: Profile = { ...profileData, id: tempId };
    setProfile(profile, tempId);

    if (next === 'join' && roomId) {
      // 초대 링크로 들어온 경우: 프로필 설정 완료 후 중간 확인 없이 바로 방에 입장한다.
      try {
        const tossAnonymousKey = await getAnonymousUserKey();
        const { room, memberId } = await repository.joinRoom(
          roomId,
          profile,
          tossAnonymousKey,
        );
        setCurrentRoom(room);
        setProfile(profile, memberId);
        rememberJoinedRoom({
          room,
          memberId,
          nickname: profile.nickname,
          cupMl: profile.cupMl,
          dailyGoalMl: profile.dailyGoalMl,
        });
        navigate(`/oasis/${room.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : '방 참여에 실패했어요.');
        setIsSubmitting(false);
      }
      return;
    }

    if (next === 'join') {
      navigate('/room/join');
    } else {
      navigate('/room/new');
    }
    setIsSubmitting(false);
  }

  return (
    <ScreenContainer>
      <Top
        title={<Top.TitleParagraph size={22}>프로필 설정</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            닉네임과 수분 목표를 설정해 주세요
          </Top.SubtitleParagraph>
        }
        upperGap={16}
        lowerGap={24}
      />
      {error && (
        <p
          role="alert"
          style={{
            margin: '0 var(--screen-padding-x) 16px',
            fontSize: '13px',
            color: 'var(--color-red-500, #f04452)',
          }}
        >
          {error}
        </p>
      )}
      <ProfileSetupForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </ScreenContainer>
  );
}
