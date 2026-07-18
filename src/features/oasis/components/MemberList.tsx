import type { Member } from "../../../types";

interface Props {
  members: Member[];
  currentMemberId: string | null;
}

export function MemberList({ members, currentMemberId }: Props) {
  if (members.length === 0) {
    return (
      <p
        style={{
          padding: "0 var(--screen-padding-x)",
          fontSize: "14px",
          color: "var(--color-label-assistive)",
        }}
      >
        아직 참여한 멤버가 없어요.
      </p>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        padding: "0 var(--screen-padding-x)",
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
      aria-label="멤버 목록"
    >
      {members.map((member) => (
        <MemberItem
          key={member.id}
          member={member}
          isMe={member.id === currentMemberId}
        />
      ))}
    </ul>
  );
}

function MemberItem({
  member,
  isMe,
}: {
  member: Member;
  isMe: boolean;
}) {
  const dropCount = member.contributedDropsToday;
  const isActive = member.hasWaterRecordToday;
  const status = !isActive
    ? "아직 쉬는 중"
    : member.todayProgressPercent < 50
      ? "첫 물방울 완료"
      : member.todayProgressPercent < 100
        ? "목표 절반 달성"
        : "오늘 목표 완료";

  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        backgroundColor: isMe
          ? "var(--oasis-mint-100)"
          : "var(--color-surface)",
        borderRadius: "12px",
        border: `1px solid ${isMe ? "var(--oasis-mint-300)" : "var(--color-border)"}`,
      }}
    >
      {/* 아바타 */}
      <div
        aria-hidden="true"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: isActive
            ? "var(--oasis-mint-400)"
            : "var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "15px",
          fontWeight: 700,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {member.nickname.charAt(0)}
      </div>

      {/* 닉네임 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "15px",
            fontWeight: isMe ? 700 : 500,
            color: "var(--color-label-normal)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {member.nickname}
          {isMe && (
            <span
              style={{
                marginLeft: "6px",
                fontSize: "11px",
                color: "var(--oasis-mint-500)",
                fontWeight: 600,
              }}
            >
              나
            </span>
          )}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: "12px",
            color: "var(--color-label-assistive)",
          }}
          aria-label={`${status}, 오늘 물방울 ${dropCount}개 기여`}
        >
          {isActive ? `💧 ${status} · ${dropCount}개 기여` : status}
        </p>
      </div>

      {/* 참여 상태 */}
      <div
        aria-label={status}
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: isActive
            ? "var(--oasis-mint-500)"
            : "var(--color-border)",
          flexShrink: 0,
        }}
      />
    </li>
  );
}
