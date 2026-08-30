import { Analytics } from "@apps-in-toss/web-framework";

type AnalyticsPrimitive = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsPrimitive>;
type AnalyticsLogger = (
  params: { log_name: OasisAnalyticsEventName } & AnalyticsParams,
) => Promise<void> | undefined;

export type OasisAnalyticsEventName =
  | "room_created"
  | "invite_shared"
  | "invite_joined"
  | "first_water_logged"
  | "oasis_75_completed"
  | "oasis_100_completed"
  | "day_2_returned"
  | "weekly_oasis_completed"
  | "daily_result_shared"
  | "weekly_result_shared";

const MEMBERSHIP_START_KEY_PREFIX = "oasis:analytics:membership-start:";
const EVENT_ONCE_KEY_PREFIX = "oasis:analytics:event-once:";

const defaultLogger: AnalyticsLogger = (params) => Analytics.click(params);

/**
 * 분석 실패가 사용자의 핵심 행동을 막지 않도록 fire-and-forget으로 전송한다.
 * 이 모듈의 호출부에서는 방/멤버 ID, 닉네임 같은 식별값을 파라미터로 보내지 않는다.
 */
export function trackOasisEvent(
  logName: OasisAnalyticsEventName,
  params: AnalyticsParams = {},
  logger: AnalyticsLogger = defaultLogger,
): void {
  try {
    const pending = logger({ log_name: logName, ...params });
    void pending?.catch(() => undefined);
  } catch {
    // 분석 SDK가 없는 브라우저 미리보기에서도 제품 기능은 계속 동작해야 한다.
  }
}

export function trackOasisEventOnce(
  logName: OasisAnalyticsEventName,
  dedupeKey: string,
  params: AnalyticsParams = {},
  storage = getStorage(),
  track = trackOasisEvent,
): boolean {
  if (!storage) {
    track(logName, params);
    return true;
  }

  const key = `${EVENT_ONCE_KEY_PREFIX}${logName}:${dedupeKey}`;
  try {
    if (storage.getItem(key) === "1") return false;
    storage.setItem(key, "1");
    track(logName, params);
    return true;
  } catch {
    track(logName, params);
    return true;
  }
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 방을 처음 만들거나 참여한 캠페인 일차를 이 기기에만 보관한다. */
export function rememberMembershipStartDay(
  roomId: string,
  dayIndex: number,
  storage = getStorage(),
): void {
  if (!storage) return;
  const key = `${MEMBERSHIP_START_KEY_PREFIX}${roomId}`;
  try {
    if (storage.getItem(key) === null) {
      storage.setItem(key, String(dayIndex));
    }
  } catch {
    // 저장 차단 환경에서도 방 만들기/참여 흐름은 그대로 진행한다.
  }
}

/**
 * 가입 이후 다음 캠페인 일차에 처음 돌아온 순간을 방·멤버별 한 번만 기록한다.
 * 기존 사용자처럼 시작 일차가 없는 경우 현재 일차를 기준점으로만 저장한다.
 */
export function trackDayTwoReturnOnce({
  roomId,
  memberId,
  dayIndex,
  memberCount,
  storage = getStorage(),
  track = trackOasisEvent,
}: {
  roomId: string;
  memberId: string;
  dayIndex: number;
  memberCount: number;
  storage?: Storage | null;
  track?: typeof trackOasisEvent;
}): boolean {
  if (!storage) return false;

  const membershipKey = `${MEMBERSHIP_START_KEY_PREFIX}${roomId}`;
  const onceKey = `${EVENT_ONCE_KEY_PREFIX}day-2-returned:${roomId}:${memberId}`;

  try {
    const storedStartDay = storage.getItem(membershipKey);
    if (storedStartDay === null) {
      storage.setItem(membershipKey, String(dayIndex));
      return false;
    }

    const startDayIndex = Number(storedStartDay);
    if (
      !Number.isFinite(startDayIndex) ||
      dayIndex !== startDayIndex + 1 ||
      storage.getItem(onceKey) === "1"
    ) {
      return false;
    }

    // React Strict Mode나 빠른 재마운트에서도 중복 전송되지 않게 먼저 표시한다.
    storage.setItem(onceKey, "1");
    track("day_2_returned", {
      day_index: dayIndex,
      days_since_first_seen: dayIndex - startDayIndex,
      room_member_count: memberCount,
    });
    return true;
  } catch {
    return false;
  }
}
