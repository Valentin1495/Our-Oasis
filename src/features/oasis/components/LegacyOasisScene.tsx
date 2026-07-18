import type { OasisStage } from "../../../types";
import styles from "./OasisScene.module.css";

interface Props {
  stage: OasisStage;
  sharedProgressPercent: number;
  dropAnimationTick: number;
  isFullComplete: boolean;
  showSpecialCharacter?: boolean;
  isFinalOasisUnlocked?: boolean;
  reducedMotion?: boolean;
}

const STAGE_LABELS: Record<OasisStage, string> = {
  1: "마른 웅덩이",
  2: "새싹이 돋아요",
  3: "야자수가 자라요",
  4: "오늘의 오아시스를 완성했어요",
  5: "완벽한 오아시스",
};

export function LegacyOasisScene({
  stage,
  sharedProgressPercent,
  dropAnimationTick,
  isFullComplete,
  showSpecialCharacter = false,
  isFinalOasisUnlocked = false,
  reducedMotion = false,
}: Props) {
  const waterHeight = Math.max(
    8,
    Math.round((sharedProgressPercent / 100) * 100),
  );
  const showSprout = stage === 2;
  const showTree = stage === 3;
  const showFullTree = stage >= 4 || isFinalOasisUnlocked;
  const showDrop = dropAnimationTick > 0;

  return (
    <div
      className={`${styles.scene} ${reducedMotion ? styles.reducedMotion : ""}`}
      role="img"
      aria-label={`오아시스 현재 단계: ${isFinalOasisUnlocked ? "최종 오아시스" : STAGE_LABELS[stage]}, 공동 달성률 ${sharedProgressPercent}%${showSpecialCharacter ? ", 모든 팀원이 참여해 특별 캐릭터가 찾아왔어요" : ""}`}
    >
      <svg
        viewBox="0 0 320 240"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-hidden="true"
      >
        {/* 하늘 배경 */}
        <rect
          x="0"
          y="0"
          width="320"
          height="240"
          fill={stage >= 4 || isFinalOasisUnlocked ? "#e3f6fa" : "#f0f8ff"}
        />

        {/* 땅 */}
        <ellipse cx="160" cy="210" rx="140" ry="22" fill="#d4b896" />
        <rect x="20" y="208" width="280" height="32" fill="#d4b896" rx="4" />

        {/* 물 웅덩이 */}
        <WaterPond
          waterHeight={isFinalOasisUnlocked ? 100 : waterHeight}
          stage={isFinalOasisUnlocked ? 5 : stage}
        />

        {/* 새싹 */}
        {showSprout && <Sprout />}

        {/* 작은 나무 */}
        {showTree && <SmallPalmTree />}

        {/* 풍성한 나무 */}
        {showFullTree && <FullPalmTree />}

        {/* 오늘 100% 최고 등급 보상 */}
        {isFullComplete && <PerfectOasisDecorations />}

        {/* 5일 완성 보상 */}
        {isFinalOasisUnlocked && <FinalOasisDecorations />}

        {/* 오늘 전원 참여 보상 */}
        {showSpecialCharacter && <SpecialCharacter />}

        {/* 물방울 애니메이션 */}
        {showDrop && <WaterDrop key={dropAnimationTick} />}
      </svg>

      {/* 단계 레이블 */}
      <p className={styles.stageLabel} aria-hidden="true">
        {isFinalOasisUnlocked ? "최종 오아시스" : STAGE_LABELS[stage]}
      </p>
    </div>
  );
}

function SpecialCharacter() {
  return (
    <g className={styles.characterArrival}>
      {/* 오아시스를 찾아온 사막여우 */}
      <path d="M248 184 L254 164 L262 181" fill="#f4b45f" />
      <path d="M266 181 L274 164 L278 187" fill="#f4b45f" />
      <ellipse cx="263" cy="190" rx="18" ry="15" fill="#f4b45f" />
      <ellipse cx="258" cy="188" rx="2.3" ry="3" fill="#3f352d" />
      <ellipse cx="269" cy="188" rx="2.3" ry="3" fill="#3f352d" />
      <circle cx="264" cy="194" r="2.2" fill="#3f352d" />
      <path d="M255 204 Q264 211 274 203" fill="#f4b45f" />
      <path
        d="M246 203 Q235 197 239 188"
        fill="none"
        stroke="#f4b45f"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </g>
  );
}

function PerfectOasisDecorations() {
  return (
    <g className={styles.fadeIn} aria-label="100% 완성 장식">
      {/* 반짝이는 물결 */}
      <path
        d="M105 202 Q128 194 151 202 T198 202 T235 202"
        fill="none"
        stroke="#fff7b2"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* 꽃과 반짝임 */}
      <circle cx="91" cy="204" r="4" fill="#ff8fb3" />
      <circle cx="226" cy="205" r="4" fill="#a889e8" />
      <path d="M65 72 h12 M71 66 v12" stroke="#ffd66b" strokeWidth="3" />
      <path d="M246 84 h10 M251 79 v10" stroke="#ffd66b" strokeWidth="3" />
      {/* 완성 배지 */}
      <circle cx="282" cy="28" r="15" fill="#ffd66b" />
      <path
        d="M275 28 l5 5 9-10"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function FinalOasisDecorations() {
  return (
    <g className={styles.fadeIn}>
      <circle cx="272" cy="42" r="18" fill="#ffd66b" opacity="0.9" />
      <circle cx="75" cy="205" r="4" fill="#ff8ba7" />
      <circle cx="82" cy="210" r="4" fill="#ffd66b" />
      <circle cx="232" cy="204" r="4" fill="#a889e8" />
      <circle cx="239" cy="209" r="4" fill="#ff8ba7" />
      <path
        d="M55 180 Q72 164 90 180"
        fill="none"
        stroke="#75c98b"
        strokeWidth="4"
      />
      <path
        d="M224 180 Q242 162 258 181"
        fill="none"
        stroke="#75c98b"
        strokeWidth="4"
      />
    </g>
  );
}

function WaterPond({
  waterHeight,
  stage,
}: {
  waterHeight: number;
  stage: OasisStage;
}) {
  const pondColor =
    stage === 1 ? "#c8a87a" : stage === 2 ? "#7ec8c8" : "#4ecdc4";
  const pondHeight = 20 + waterHeight * 0.5;

  return (
    <g>
      {/* 웅덩이 테두리 */}
      <ellipse cx="160" cy="205" rx="90" ry="16" fill="#b89a6e" />
      {/* 물 */}
      <ellipse
        cx="160"
        cy="205"
        rx="88"
        ry={Math.max(4, pondHeight * 0.16)}
        fill={pondColor}
        style={{ transition: "ry 0.6s ease" }}
        className={stage > 1 ? styles.waterRise : undefined}
      />
      {/* 물 반짝임 */}
      {stage > 1 && (
        <>
          <ellipse
            cx="140"
            cy="203"
            rx="10"
            ry="3"
            fill="rgba(255,255,255,0.35)"
          />
          <ellipse
            cx="175"
            cy="207"
            rx="7"
            ry="2"
            fill="rgba(255,255,255,0.25)"
          />
        </>
      )}
    </g>
  );
}

function Sprout() {
  return (
    <g className={styles.fadeIn}>
      {/* 줄기 */}
      <line
        x1="160"
        y1="200"
        x2="160"
        y2="170"
        stroke="#4a8c3f"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 왼쪽 잎 */}
      <ellipse
        cx="148"
        cy="178"
        rx="12"
        ry="6"
        fill="#6dbf6d"
        transform="rotate(-30 148 178)"
      />
      {/* 오른쪽 잎 */}
      <ellipse
        cx="172"
        cy="178"
        rx="12"
        ry="6"
        fill="#6dbf6d"
        transform="rotate(30 172 178)"
      />
    </g>
  );
}

function SmallPalmTree() {
  return (
    <g className={styles.fadeIn}>
      {/* 줄기 */}
      <path
        d="M157 205 Q155 180 160 160"
        stroke="#8b6914"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* 잎 */}
      <ellipse
        cx="148"
        cy="158"
        rx="20"
        ry="8"
        fill="#4ecdc4"
        transform="rotate(-40 148 158)"
      />
      <ellipse
        cx="172"
        cy="160"
        rx="20"
        ry="8"
        fill="#4ecdc4"
        transform="rotate(30 172 160)"
      />
      <ellipse
        cx="160"
        cy="153"
        rx="18"
        ry="7"
        fill="#2db8af"
        transform="rotate(-10 160 153)"
      />
      {/* 야자열매 */}
      <circle cx="160" cy="163" r="5" fill="#e8a020" />
    </g>
  );
}

function FullPalmTree() {
  return (
    <g className={styles.fadeIn}>
      {/* 굵은 줄기 */}
      <path
        d="M155 208 Q150 180 158 148"
        stroke="#a07820"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* 잎 5개 */}
      <ellipse
        cx="135"
        cy="145"
        rx="28"
        ry="9"
        fill="#4ecdc4"
        transform="rotate(-50 135 145)"
      />
      <ellipse
        cx="185"
        cy="148"
        rx="28"
        ry="9"
        fill="#4ecdc4"
        transform="rotate(40 185 148)"
      />
      <ellipse
        cx="158"
        cy="135"
        rx="26"
        ry="8"
        fill="#2db8af"
        transform="rotate(-5 158 135)"
      />
      <ellipse
        cx="143"
        cy="152"
        rx="22"
        ry="8"
        fill="#3ec8be"
        transform="rotate(-25 143 152)"
      />
      <ellipse
        cx="175"
        cy="152"
        rx="22"
        ry="8"
        fill="#3ec8be"
        transform="rotate(20 175 152)"
      />
      {/* 야자열매 두 개 */}
      <circle cx="155" cy="155" r="7" fill="#e8a020" />
      <circle cx="168" cy="158" r="6" fill="#e8a020" />
      {/* 풀 */}
      <ellipse cx="100" cy="208" rx="18" ry="6" fill="#6dbf6d" />
      <ellipse cx="220" cy="206" rx="20" ry="6" fill="#6dbf6d" />
    </g>
  );
}

function WaterDrop() {
  return (
    <g className={styles.dropFall}>
      <path
        d="M160 60 Q155 80 160 90 Q165 80 160 60Z"
        fill="var(--oasis-blue-400)"
        opacity="0.85"
      />
    </g>
  );
}
