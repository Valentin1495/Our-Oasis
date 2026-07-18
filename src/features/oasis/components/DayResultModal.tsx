import { BottomSheet } from "@toss/tds-mobile";
import type { OasisState } from "../../../types";
import { WEEKLY_OASIS_TARGET_DAYS, getOasisAchievements } from "../oasisRules";

interface Props {
  open: boolean;
  oasisState: OasisState;
  onClose: () => void;
}

export function DayResultModal({ open, oasisState, onClose }: Props) {
  const { sharedProgressPercent, totalDrops, room } = oasisState;
  const daysLeft = room.durationDays - room.dayIndex;
  const {
    isTodayComplete,
    isTodayFullComplete,
    allMembersParticipatedToday,
    completedDays,
    fullCompleteStarCount,
    allParticipatedStarCount,
    isFinalOasisUnlocked,
    isRareFinalOasisUnlocked,
    isSpecialCharacterSettled,
  } = getOasisAchievements(oasisState);

  return (
    <BottomSheet
      open={open}
      aria-label="오늘 하루 결과"
      header={<BottomSheet.Header>오늘 하루 결과</BottomSheet.Header>}
      cta={<BottomSheet.CTA onClick={onClose}>확인</BottomSheet.CTA>}
      maxHeight="85vh"
      expandedMaxHeight="100vh"
      expandBottomSheet
      expandBottomSheetWhenScroll
      onClose={onClose}
    >
      <div
        style={{
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            padding: "20px",
            backgroundColor: "var(--oasis-mint-100)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <ResultRow
            label="공동 달성률"
            value={`${sharedProgressPercent}%`}
            highlight
          />
          <ResultRow
            label="오늘의 오아시스"
            value={
              isTodayFullComplete
                ? "최고 등급 완성"
                : isTodayComplete
                  ? "완성"
                  : "키우는 중"
            }
            highlight={isTodayComplete}
          />
          <ResultRow
            label="팀원 참여"
            value={
              allMembersParticipatedToday ? "전원 참여" : "참여 기다리는 중"
            }
            highlight={allMembersParticipatedToday}
          />
          <ResultRow label="모인 물방울" value={`${totalDrops}개`} />
          <ResultRow
            label="주간 완성"
            value={`${completedDays}일 / ${WEEKLY_OASIS_TARGET_DAYS}일`}
          />
          <ResultRow
            label="100% 별 조각"
            value={`${fullCompleteStarCount}개`}
          />
          <ResultRow
            label="전원 참여 별 조각"
            value={`${allParticipatedStarCount}개`}
          />
          {daysLeft > 0 && (
            <ResultRow label="남은 기간" value={`${daysLeft}일`} />
          )}
        </div>

        {(allMembersParticipatedToday ||
          isFinalOasisUnlocked ||
          isSpecialCharacterSettled) && (
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--oasis-mint-500)",
              textAlign: "center",
            }}
          >
            {isRareFinalOasisUnlocked
              ? "✨ 7일 모두 완성해 희귀 오아시스를 얻었어요!"
              : isSpecialCharacterSettled
                ? "🦊 특별 캐릭터가 오아시스에 정착했어요!"
                : isFinalOasisUnlocked
                  ? "🎉 최종 오아시스를 얻었어요!"
              : "🦊 모든 팀원이 참여해 특별 캐릭터가 찾아왔어요!"}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{ fontSize: "14px", color: "var(--color-label-alternative)" }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: highlight
            ? "var(--oasis-mint-500)"
            : "var(--color-label-normal)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
