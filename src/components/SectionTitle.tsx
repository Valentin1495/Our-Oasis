import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  right?: ReactNode;
}

export function SectionTitle({ children, right }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        marginBottom: '8px',
      }}
    >
      <h2
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-label-alternative)',
          margin: 0,
          letterSpacing: '0.01em',
        }}
      >
        {children}
      </h2>
      {right}
    </div>
  );
}
