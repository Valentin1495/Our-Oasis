import memberAvatar01 from "./assets/avatars/member_avatar_01.png";
import memberAvatar02 from "./assets/avatars/member_avatar_02.png";
import memberAvatar03 from "./assets/avatars/member_avatar_03.png";
import memberAvatar04 from "./assets/avatars/member_avatar_04.png";
import memberAvatar05 from "./assets/avatars/member_avatar_05.png";

export const MEMBER_AVATAR_IMAGES = [
  memberAvatar01,
  memberAvatar02,
  memberAvatar03,
  memberAvatar04,
  memberAvatar05,
] as const;

function hashMemberId(memberId: string): number {
  let hash = 0;

  for (const character of memberId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return hash;
}

/**
 * 배열 순서와 무관하게 같은 방의 최대 5명에게 서로 다른 아바타를 배정한다.
 * 선호 슬롯이 충돌하면 다음 빈 슬롯을 사용한다.
 */
export function assignMemberAvatarImages(
  memberIds: readonly string[],
): ReadonlyMap<string, string> {
  const assignments = new Map<string, string>();
  const usedIndexes = new Set<number>();
  const uniqueMemberIds = [...new Set(memberIds)].sort();

  uniqueMemberIds.forEach((memberId) => {
    const preferredIndex = hashMemberId(memberId) % MEMBER_AVATAR_IMAGES.length;
    let avatarIndex = preferredIndex;

    for (let offset = 0; offset < MEMBER_AVATAR_IMAGES.length; offset += 1) {
      const candidateIndex =
        (preferredIndex + offset) % MEMBER_AVATAR_IMAGES.length;

      if (!usedIndexes.has(candidateIndex)) {
        avatarIndex = candidateIndex;
        break;
      }
    }

    assignments.set(memberId, MEMBER_AVATAR_IMAGES[avatarIndex]);
    usedIndexes.add(avatarIndex);
  });

  return assignments;
}
