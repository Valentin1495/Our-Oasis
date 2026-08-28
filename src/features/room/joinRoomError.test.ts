import { describe, expect, it } from "vitest";
import { getJoinRoomErrorMessage } from "./joinRoomError";

describe("getJoinRoomErrorMessage", () => {
  it.each([
    [
      "방을 찾을 수 없어요.",
      "참여할 방을 찾지 못했어요. 초대 링크를 다시 확인해 주세요.",
    ],
    [
      "방이 가득 찼어요.",
      "참여 인원이 모두 찼어요. 친구에게 새 방을 만들어 달라고 요청해 주세요.",
    ],
    [
      "Failed to fetch",
      "인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
    ],
    [
      "멤버를 등록할 수 없어요.",
      "프로필을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
    ],
    [
      'duplicate key value violates unique constraint "room_members_pkey"',
      "초대 링크를 다시 확인해 주세요. 계속 참여되지 않으면 잠시 후 다시 시도해 주세요.",
    ],
  ])("기술 오류를 사용자가 이해할 수 있는 문구로 바꾼다", (error, expected) => {
    expect(getJoinRoomErrorMessage(error)).toBe(expected);
  });

  it("오류가 없으면 도움말을 표시하지 않는다", () => {
    expect(getJoinRoomErrorMessage(null)).toBeUndefined();
  });
});
