import type { CSSProperties, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  hasBottomCTA?: boolean;
}

export function ScreenContainer({
  children,
  style,
  className,
  hasBottomCTA = false,
}: Props) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-background)',
        paddingBottom: hasBottomCTA ? 'calc(var(--bottom-cta-height, 80px) + env(safe-area-inset-bottom, 0px))' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
