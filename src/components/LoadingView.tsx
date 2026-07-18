import { Skeleton } from '@toss/tds-mobile';

interface Props {
  rows?: number;
}

export function LoadingView({ rows = 4 }: Props) {
  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} pattern="subtitleList" />
      ))}
    </div>
  );
}
