import { describe, expect, it } from "vitest";
import {
  assignMemberAvatarImages,
  MEMBER_AVATAR_IMAGES,
} from "./memberAvatarImage";

describe("assignMemberAvatarImages", () => {
  it("최대 5명의 멤버에게 중복되지 않는 아바타를 배정한다", () => {
    const memberIds = ["alpha", "beta", "gamma", "delta", "epsilon"];
    const assignments = assignMemberAvatarImages(memberIds);

    expect(assignments.size).toBe(5);
    expect(new Set(assignments.values()).size).toBe(5);
    assignments.forEach((image) => {
      expect(MEMBER_AVATAR_IMAGES).toContain(image);
    });
  });

  it("멤버 배열 순서가 바뀌어도 같은 아바타를 유지한다", () => {
    const memberIds = ["alpha", "beta", "gamma", "delta"];
    const original = assignMemberAvatarImages(memberIds);
    const reordered = assignMemberAvatarImages([...memberIds].reverse());

    memberIds.forEach((memberId) => {
      expect(reordered.get(memberId)).toBe(original.get(memberId));
    });
  });

  it("중복된 멤버 ID는 한 번만 배정한다", () => {
    const assignments = assignMemberAvatarImages(["alpha", "alpha", "beta"]);

    expect(assignments.size).toBe(2);
  });
});
