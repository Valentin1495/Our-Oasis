import { getAnonymousKey } from '@apps-in-toss/web-framework';

let cachedKey: string | null | undefined;

/**
 * 앱인토스 비게임 미니앱 전용 사용자 식별키를 가져온다.
 *
 * 공식 문서 기준:
 * - SDK 2.4.5 이상에서만 지원되고, 그 이하에서는 undefined가 반환된다.
 * - 반환되는 hash는 토스 서버 API 호출용 키가 아니라 내부 사용자 식별용이므로,
 *   별도의 서버 측 "토스 검증" 없이 그대로 내부 식별자로 사용해도 된다.
 * - 샌드박스 환경에서는 mock 값이 내려오고, 실제 동작은 QR 테스트로만 확인 가능하다.
 *
 * 이 앱은 결제·개인정보가 없는 캐주얼 습관 트래커이므로, 이 키는
 * "같은 사용자가 같은 방에 중복으로 들어오는 것을 막는" 용도로만 사용한다.
 * 키를 가져오지 못하는 환경(브라우저 미리보기 등)에서는 null을 반환해
 * 매번 새 멤버로 참여하는 기존 동작으로 자연스럽게 폴백한다.
 */
export async function getAnonymousUserKey(): Promise<string | null> {
  if (cachedKey !== undefined) return cachedKey;

  try {
    const result = await getAnonymousKey();
    if (result && typeof result === 'object' && result.type === 'HASH') {
      cachedKey = result.hash;
    } else {
      cachedKey = null;
    }
  } catch {
    cachedKey = null;
  }

  return cachedKey;
}
