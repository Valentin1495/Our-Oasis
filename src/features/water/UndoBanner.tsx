import { Toast } from "@toss/tds-mobile";
import { useOasisStore } from "../../lib/store/useOasisStore";

interface Props {
  bottomOffset: number;
}

export function UndoBanner({ bottomOffset }: Props) {
  const { undoWindow, undoWaterCup, waterLogFeedback } = useOasisStore();
  const text = waterLogFeedback?.warning ?? "물 한 컵을 기록했어요";

  return (
    <Toast
      position="bottom"
      open={undoWindow !== null}
      text={text}
      button={
        <Toast.Button onClick={undoWaterCup} aria-label="물 기록 실행 취소">
          실행 취소
        </Toast.Button>
      }
      duration={Infinity}
      aria-live="polite"
      style={{
        bottom: `${bottomOffset}px`,
        whiteSpace: waterLogFeedback?.warning ? "pre-line" : undefined,
      }}
    />
  );
}
