import type { PendingRewardScene } from "../oasisRules";

const REWARD_SCENE_TITLES: Record<PendingRewardScene, string> = {
  "rare-final-oasis": "희귀 최종 오아시스",
  "special-character": "특별 캐릭터 정착",
  "rare-final-oasis-with-special-character": "희귀 오아시스 + 특별 캐릭터",
};

export function PendingRewardSceneNotice({
  scene,
}: {
  scene: PendingRewardScene;
}) {
  const title = REWARD_SCENE_TITLES[scene];

  return (
    <div
      role="status"
      aria-label={`${title} 조건 달성, 보상 장면 준비 중`}
      style={{
        padding: "14px 16px",
        borderRadius: "14px",
        border: "1px dashed var(--oasis-mint-300)",
        backgroundColor: "var(--oasis-mint-100)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--color-label-normal)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "13px",
          color: "var(--color-label-alternative)",
        }}
      >
        조건 달성 · 보상 장면 준비 중
      </p>
    </div>
  );
}
