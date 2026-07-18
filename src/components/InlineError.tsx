import { Button } from '@toss/tds-mobile';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      style={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '15px', color: 'var(--color-label-alternative)', margin: 0 }}>
        {message}
      </p>
      {onRetry && (
        <Button size="medium" variant="fill" onClick={onRetry}>
          다시 시도하기
        </Button>
      )}
    </div>
  );
}
