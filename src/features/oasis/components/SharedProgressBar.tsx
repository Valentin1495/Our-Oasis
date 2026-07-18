import { ProgressBar } from "@toss/tds-mobile";
import {
  DAILY_OASIS_TARGET_PERCENT,
  isDailyOasisComplete,
} from "../oasisRules";

interface Props {
  percent: number;
  totalDrops: number;
}

export function SharedProgressBar({ percent, totalDrops }: Props) {
  const isComplete = isDailyOasisComplete(percent);
  const isFullComplete = percent >= 100;

  return (
    <div style={{ padding: "0 var(--screen-padding-x)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--color-label-normal)",
          }}
        >
          오늘의 공동 달성률
        </span>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--oasis-mint-500)",
          }}
        >
          {percent}%
        </span>
      </div>
      <ProgressBar progress={percent / 100} size="bold" />
      <p
        style={{
          margin: "6px 0 0",
          fontSize: "12px",
          color: "var(--color-label-assistive)",
        }}
      >
        {isFullComplete
          ? `최고 등급 오아시스 완성 · 물방울 ${totalDrops}개`
          : isComplete
            ? `오늘의 오아시스를 완성했어요 · 물방울 ${totalDrops}개`
          : `${DAILY_OASIS_TARGET_PERCENT}% 이상이면 오늘의 오아시스가 완성돼요 · 물방울 ${totalDrops}개`}
      </p>
    </div>
  );
}
