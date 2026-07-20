import type { CSSProperties } from "react";
import type {
  OasisSceneEvent,
  OasisSceneSequencePhase,
} from "../oasisSceneEvents";
import type { OasisSceneSnapshot } from "../oasisSceneModel";
import styles from "./MemberChips.module.css";
import {
  getMemberAnchor,
  SHARED_OASIS_VIEW_BOX_SIZE,
} from "./sharedOasisSceneConfig";

interface Props {
  snapshot: OasisSceneSnapshot;
  event: OasisSceneEvent | null;
  phase: OasisSceneSequencePhase;
}

export function MemberChips({ snapshot, event, phase }: Props) {
  if (snapshot.members.length === 0) return null;

  return (
    <ul className={styles.list} aria-label="오늘 멤버 참여 상태">
      {snapshot.members.map((member, index) => {
        const anchor = getMemberAnchor(snapshot.members.length, index);
        const isMe = member.id === snapshot.currentMemberId;
        const isActive =
          event?.actorMemberId === member.id && phase !== "idle";
        const status =
          member.contributedDropsToday >= 4
            ? "complete"
            : member.contributedDropsToday > 0
              ? "contributing"
              : member.hasWaterRecordToday
                ? "participated"
                : "pending";

        return (
          <li
            key={member.id}
            className={`${styles.item} ${styles[status]} ${isActive ? styles.active : ""}`}
            data-member-status={status}
            data-current-member={isMe}
            style={
              {
                "--member-x": `${(anchor.x / SHARED_OASIS_VIEW_BOX_SIZE.width) * 100}%`,
                "--member-y": `${(anchor.y / SHARED_OASIS_VIEW_BOX_SIZE.height) * 100}%`,
                "--member-translate-x":
                  anchor.align === "left"
                    ? "0%"
                    : anchor.align === "right"
                      ? "-100%"
                      : "-50%",
              } as CSSProperties
            }
          >
            <span className={styles.avatar} aria-hidden="true">
              {member.nickname.trim().charAt(0) || "?"}
            </span>
            <span className={styles.copy}>
              <span className={styles.name}>
                {member.nickname}
                {isMe && <span className={styles.me}>나</span>}
              </span>
              <span className={styles.drops}>
                💧 {member.contributedDropsToday}/4
              </span>
            </span>
            <span className="visually-hidden">
              {isMe ? "현재 사용자, " : ""}
              {member.hasWaterRecordToday
                ? "오늘 기록 참여, "
                : "오늘 기록 대기, "}
              물방울 {member.contributedDropsToday}개 기여
            </span>
          </li>
        );
      })}
    </ul>
  );
}
