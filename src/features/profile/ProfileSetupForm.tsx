import { useState } from 'react';
import { Button, TextField } from '@toss/tds-mobile';
import type { Profile } from '../../types';

const CUP_PRESETS = [150, 250, 350] as const;
const GOAL_PRESETS = [1000, 1500, 2000] as const;

interface Props {
  onSubmit: (profile: Omit<Profile, 'id'>) => void;
  isSubmitting?: boolean;
}

export function ProfileSetupForm({ onSubmit, isSubmitting = false }: Props) {
  const [nickname, setNickname] = useState('');
  const [cupMl, setCupMl] = useState<number>(250);
  const [cupCustom, setCupCustom] = useState('');
  const [isCupCustom, setIsCupCustom] = useState(false);
  const [goalMl, setGoalMl] = useState<number>(2000);
  const [goalCustom, setGoalCustom] = useState('');
  const [isGoalCustom, setIsGoalCustom] = useState(false);

  const effectiveCupMl = isCupCustom ? parseInt(cupCustom || '0', 10) : cupMl;
  const effectiveGoalMl = isGoalCustom ? parseInt(goalCustom || '0', 10) : goalMl;

  const isValid =
    nickname.trim().length >= 1 &&
    nickname.trim().length <= 8 &&
    effectiveCupMl >= 50 &&
    effectiveCupMl <= 2000 &&
    effectiveGoalMl >= 200 &&
    effectiveGoalMl <= 5000;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({
      nickname: nickname.trim(),
      cupMl: effectiveCupMl,
      dailyGoalMl: effectiveGoalMl,
    });
  }

  return (
    <div style={{ padding: '0 var(--screen-padding-x)', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 닉네임 */}
      <div>
        <TextField
          label="닉네임"
          placeholder="최대 8자"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={8}
          help={`${nickname.length}/8`}
          variant="box"
        />
      </div>

      {/* 컵 용량 */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: 'var(--color-label-normal)' }}>
          내 컵 용량
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CUP_PRESETS.map((ml) => (
            <PresetChip
              key={ml}
              label={`${ml}ml`}
              selected={!isCupCustom && cupMl === ml}
              onClick={() => { setCupMl(ml); setIsCupCustom(false); }}
            />
          ))}
          <PresetChip
            label="직접 입력"
            selected={isCupCustom}
            onClick={() => setIsCupCustom(true)}
          />
        </div>
        {isCupCustom && (
          <div style={{ marginTop: '10px' }}>
            <TextField
              label="컵 용량 (ml)"
              placeholder="예: 300"
              value={cupCustom}
              onChange={(e) => setCupCustom(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              variant="box"
            />
          </div>
        )}
      </div>

      {/* 하루 목표 */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 600, color: 'var(--color-label-normal)' }}>
          하루 목표량
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {GOAL_PRESETS.map((ml) => (
            <PresetChip
              key={ml}
              label={`${ml}ml`}
              selected={!isGoalCustom && goalMl === ml}
              onClick={() => { setGoalMl(ml); setIsGoalCustom(false); }}
            />
          ))}
          <PresetChip
            label="직접 입력"
            selected={isGoalCustom}
            onClick={() => setIsGoalCustom(true)}
          />
        </div>
        {isGoalCustom && (
          <div style={{ marginTop: '10px' }}>
            <TextField
              label="하루 목표 (ml)"
              placeholder="예: 1800"
              value={goalCustom}
              onChange={(e) => setGoalCustom(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              variant="box"
            />
          </div>
        )}
      </div>

      {/* 안내 문구 */}
      <p
        style={{
          fontSize: '12px',
          color: 'var(--color-label-assistive)',
          lineHeight: 1.6,
          margin: 0,
          padding: '12px',
          backgroundColor: 'var(--oasis-mint-100)',
          borderRadius: '8px',
        }}
      >
        💧 과도한 수분 섭취는 건강에 해로울 수 있어요. 하루 권장량은 개인 체중·건강 상태에 따라 다르니, 무리하지 않는 범위에서 목표를 설정해 주세요.
      </p>

      <Button
        size="xlarge"
        variant="fill"
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        aria-label="프로필 설정 완료"
        style={{ width: '100%' }}
      >
        {isSubmitting ? '저장 중...' : '설정 완료'}
      </Button>
    </div>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function PresetChip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        border: `1.5px solid ${selected ? 'var(--oasis-mint-500)' : 'var(--color-border)'}`,
        backgroundColor: selected ? 'var(--oasis-mint-100)' : 'var(--color-surface)',
        color: selected ? 'var(--oasis-mint-500)' : 'var(--color-label-normal)',
        fontSize: '14px',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
