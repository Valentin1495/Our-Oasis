import { useEffect, useState } from "react";
import { BottomSheet, Button } from "@toss/tds-mobile";
import type { OasisState } from "../../../types";
import { trackOasisEvent } from "../../../lib/analytics/oasisAnalytics";
import { WEEKLY_OASIS_TARGET_DAYS, getOasisAchievements } from "../oasisRules";
import { shareOasisResult, type ResultShareOutcome } from "../resultShare";

interface Props {
  open: boolean;
  oasisState: OasisState;
  onClose: () => void;
  onViewHistory: () => void;
}

export function DayResultModal({
  open,
  oasisState,
  onClose,
  onViewHistory,
}: Props) {
  const [shareStatus, setShareStatus] = useState<
    "idle" | "sharing" | ResultShareOutcome
  >("idle");
  const { sharedProgressPercent, totalDrops, room } = oasisState;
  const daysLeft = room.durationDays - room.dayIndex;
  const {
    isTodayComplete,
    isTodayFullComplete,
    allMembersParticipatedToday,
    completedDays,
    fullCompleteDays,
    allParticipatedDays,
    isWeeklyGoalComplete,
    areAllSevenDaysComplete,
  } = getOasisAchievements(oasisState);

  useEffect(() => {
    if (!open) setShareStatus("idle");
  }, [open]);

  const resultGrade = isTodayFullComplete
    ? "perfect_success"
    : "shared_success";
  const shareLabel = "오아시스 공유하기";
  const shareFeedback =
    shareStatus === "shared"
      ? "공유 화면을 열었어요."
      : shareStatus === "copied"
        ? "결과 메시지를 복사했어요."
        : shareStatus === "failed"
          ? "공유하지 못했어요. 다시 시도해 주세요."
          : null;

  async function handleShareResult() {
    if (!isTodayComplete || shareStatus === "sharing") return;
    setShareStatus("sharing");
    const outcome = await shareOasisResult({
      kind: resultGrade,
      roomId: room.id,
      roomName: room.name,
      dayIndex: room.dayIndex,
      completionPercent: sharedProgressPercent,
      allParticipated: allMembersParticipatedToday,
    });
    setShareStatus(outcome);

    if (outcome !== "failed") {
      trackOasisEvent("daily_result_shared", {
        result_grade: resultGrade,
        share_method: outcome === "shared" ? "native_share" : "clipboard",
        day_index: room.dayIndex,
        completion_percent: sharedProgressPercent,
        room_member_count: oasisState.members.length,
        all_participated: allMembersParticipatedToday,
      });
    }
  }

  return (
    <BottomSheet
      open={open}
      aria-label="오늘 하루 결과"
      header={<BottomSheet.Header>오늘 하루 결과</BottomSheet.Header>}
      cta={
        <BottomSheet.DoubleCTA
          topAccessory={
            shareFeedback ? (
              <span
                aria-live="polite"
                style={{
                  display: "block",
                  minHeight: "20px",
                  fontSize: "13px",
                  lineHeight: "20px",
                  color:
                    shareStatus === "failed"
                      ? "var(--color-status-negative, #e42939)"
                      : "var(--color-label-alternative)",
                  textAlign: "center",
                }}
              >
                {shareFeedback}
              </span>
            ) : undefined
          }
          leftButton={
            <Button
              type="button"
              variant="weak"
              display="full"
              onClick={onViewHistory}
              style={{ borderRadius: "16px" }}
            >
              7일 기록 보기
            </Button>
          }
          rightButton={
            isTodayComplete ? (
              <Button
                type="button"
                display="full"
                onClick={() => void handleShareResult()}
                disabled={shareStatus === "sharing"}
                loading={shareStatus === "sharing"}
                aria-label={shareLabel}
                style={{
                  borderRadius: "16px",
                  backgroundColor: isTodayFullComplete
                    ? "var(--oasis-perfect-500)"
                    : "var(--oasis-mint-700)",
                }}
              >
                {shareLabel}
              </Button>
            ) : (
              <Button
                type="button"
                display="full"
                onClick={onClose}
                style={{ borderRadius: "16px" }}
              >
                확인
              </Button>
            )
          }
        />
      }
      ctaContentGap={16}
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
          gap: "12px",
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
            label="주간 공동 목표"
            value={`${completedDays}/${WEEKLY_OASIS_TARGET_DAYS}일`}
          />
          <ResultRow label="100% 완벽 달성" value={`${fullCompleteDays}일`} />
          <ResultRow label="전원 참여" value={`${allParticipatedDays}일`} />
          {daysLeft > 0 && (
            <ResultRow label="남은 기간" value={`${daysLeft}일`} />
          )}
        </div>

        {isWeeklyGoalComplete && (
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--oasis-mint-500)",
              textAlign: "center",
            }}
          >
            {areAllSevenDaysComplete
              ? "✨ 7일 모두 오아시스를 완성했어요!"
              : "🎉 5일 공동 목표를 달성했어요!"}
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
