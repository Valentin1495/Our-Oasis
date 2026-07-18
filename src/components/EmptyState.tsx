import type { ReactNode } from 'react';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji = '🌵', title, description, action }: Props) {
  return (
    <div
      role="status"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '48px', lineHeight: 1 }} aria-hidden="true">
        {emoji}
      </span>
      <p
        style={{
          fontSize: '17px',
          fontWeight: 600,
          color: 'var(--color-label-normal)',
          margin: '8px 0 0',
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--color-label-alternative)',
            margin: '4px 0 0',
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '20px' }}>{action}</div>}
    </div>
  );
}
