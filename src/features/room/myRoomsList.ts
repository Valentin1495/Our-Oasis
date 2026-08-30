import type { MyRoomSummary } from "../../types";

/**
 * 서버(getMyRooms)와 이 기기의 로컬 참여 기록을 합쳐 "참여 중인 오아시스" 목록을
 * 만든다. 화면에 먼저 표시되는 로컬의 최근 방문 순서는 유지하되, 같은 방이
 * 양쪽에 있으면 내용은 최신 서버 데이터로 교체한다. 서버에만 있는 방은 서버
 * 순서대로 뒤에 추가하고, 서버 조회가 실패하거나 익명 식별키가 없어 서버
 * 목록이 비어 있어도 로컬 기록만으로 목록을 보여줄 수 있게 한다.
 */
export function mergeRoomSummaries(
  serverRooms: MyRoomSummary[],
  localRooms: MyRoomSummary[],
): MyRoomSummary[] {
  const serverRoomsById = new Map(
    serverRooms.map((item) => [item.room.id, item]),
  );
  const localRoomIds = new Set(localRooms.map((item) => item.room.id));
  const roomsInLocalOrder = localRooms.map(
    (item) => serverRoomsById.get(item.room.id) ?? item,
  );
  const serverOnlyRooms = serverRooms.filter(
    (item) => !localRoomIds.has(item.room.id),
  );

  return [...roomsInLocalOrder, ...serverOnlyRooms];
}
