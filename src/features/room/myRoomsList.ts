import type { MyRoomSummary } from "../../types";

/**
 * 서버(getMyRooms)와 이 기기의 로컬 참여 기록을 합쳐 "참여 중인 오아시스" 목록을
 * 만든다. 같은 방이 양쪽에 있으면 서버 데이터가 최신이므로 그것을 쓰고,
 * 서버 조회가 실패하거나 익명 식별키가 없어 서버 목록이 비어 있어도 로컬
 * 기록만으로 목록을 보여줄 수 있게 한다.
 */
export function mergeRoomSummaries(
  serverRooms: MyRoomSummary[],
  localRooms: MyRoomSummary[],
): MyRoomSummary[] {
  const serverRoomIds = new Set(serverRooms.map((item) => item.room.id));
  const localOnlyRooms = localRooms.filter(
    (item) => !serverRoomIds.has(item.room.id),
  );
  return [...serverRooms, ...localOnlyRooms];
}
