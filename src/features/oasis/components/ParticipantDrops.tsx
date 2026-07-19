import type { Member } from "../../../types";
import { deriveParticipantSummary } from "../oasisMainViewModel";
import styles from "./ParticipantDrops.module.css";

interface Props {
  members: Member[];
  currentMemberId: string | null;
}

export function ParticipantDrops({ members, currentMemberId }: Props) {
  const visibleMembers = members.slice(0, 5);
  const summary = deriveParticipantSummary(visibleMembers);

  return (
    <div className={styles.container}>
      {visibleMembers.length > 0 && (
        <ul className={styles.list} aria-label="오늘 멤버 참여 상태">
          {visibleMembers.map((member) => {
            const isMe = member.id === currentMemberId;
            const isComplete = member.hasWaterRecordToday;
            return (
              <li
                key={member.id}
                className={styles.item}
              >
                <span
                  className={`${styles.seed} ${isComplete ? styles.complete : styles.pending}`}
                  aria-hidden="true"
                />
                {isMe && (
                  <span className={styles.meDot} aria-hidden="true" />
                )}
                <span className="visually-hidden">
                  {member.nickname}
                  {isMe ? ", 나" : ""},{" "}
                  {isComplete ? "오늘 참여 완료" : "오늘 참여 대기"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.summary}>{summary.label}</p>
    </div>
  );
}
