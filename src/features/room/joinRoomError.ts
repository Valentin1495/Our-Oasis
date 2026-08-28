const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "load failed",
];

export function getJoinRoomErrorMessage(error?: string | null): string | undefined {
  if (!error) return undefined;

  const normalizedError = error.toLowerCase();

  if (error.includes("방을 찾을 수 없어요")) {
    return "참여할 방을 찾지 못했어요. 초대 링크를 다시 확인해 주세요.";
  }

  if (error.includes("방이 가득 찼어요")) {
    return "참여 인원이 모두 찼어요. 친구에게 새 방을 만들어 달라고 요청해 주세요.";
  }

  if (NETWORK_ERROR_PATTERNS.some((pattern) => normalizedError.includes(pattern))) {
    return "인터넷 연결을 확인한 뒤 다시 시도해 주세요.";
  }

  if (error.includes("멤버를 등록할 수 없어요")) {
    return "프로필을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.";
  }

  return "초대 링크를 다시 확인해 주세요. 계속 참여되지 않으면 잠시 후 다시 시도해 주세요.";
}
