import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
  showSpecialCharacter: boolean;
}

/**
 * animalLevel 1 → 새 한 마리 (thriving)
 * animalLevel 2 → 새 + 사막여우 + 개구리 (community-success / perfect)
 * showSpecialCharacter → 여우 강제 표시
 */
export function AnimalLayer({ model, showSpecialCharacter }: Props) {
  const showFox = model.animalLevel >= 2 || showSpecialCharacter;

  return (
    <g aria-hidden="true">
      {model.animalLevel >= 1 && (
        <g className={styles.layerReveal}>
          <Bird />
        </g>
      )}
      {showFox && (
        <g className={styles.layerReveal}>
          <FennecFox />
        </g>
      )}
      {model.animalLevel >= 2 && (
        <g className={styles.layerReveal}>
          <Frog />
        </g>
      )}
    </g>
  );
}

/* ─────────────────────────── 새 (Bird) ─────────────────────────── */
function Bird() {
  return (
    <g transform="translate(222 128)">
      {/* 날개 (뒤) */}
      <path
        d="M-5 2 Q0 -10 8 2"
        fill="none"
        stroke="#b0c4dc"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* 몸통 */}
      <ellipse cx="0" cy="0" rx="9.5" ry="7" fill="#6a85a8" />
      {/* 배 */}
      <ellipse cx="-1" cy="2" rx="5" ry="3.5" fill="#8eaacc" opacity="0.6" />
      {/* 머리 */}
      <circle cx="7" cy="-5" r="5.5" fill="#7e9abc" />
      {/* 부리 */}
      <path d="M12 -5 l7 2 -7 2Z" fill="#e8a040" />
      {/* 눈 */}
      <circle cx="8.5" cy="-6" r="1.4" fill="#1e2e40" />
      <circle cx="9" cy="-6.4" r="0.5" fill="#ffffff" opacity="0.7" />
      {/* 날개 (앞) */}
      <path
        d="M-6 -1 Q-1 -9 5 -1"
        fill="none"
        stroke="#9ab4cc"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  );
}

/* ─────────────────────────── 사막여우 (Fennec Fox) ─────────────────────────── */
function FennecFox() {
  return (
    <g transform="translate(254 174)">
      {/* 꼬리 */}
      <path
        d="M-16 5 Q-30 2 -28 -9"
        fill="none"
        stroke="#f0ae54"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* 꼬리 끝 흰색 */}
      <circle cx="-28" cy="-9" r="4" fill="#f8e8cc" />
      {/* 몸통 */}
      <ellipse cx="1" cy="-3" rx="18" ry="15" fill="#f2b45e" />
      {/* 배 */}
      <ellipse cx="2" cy="2" rx="10" ry="8" fill="#f8dca8" opacity="0.7" />
      {/* 왼쪽 귀 */}
      <path d="M-13 -14 L-10 -38 L2 -17Z" fill="#f0ae54" />
      {/* 귀 안쪽 */}
      <path d="M-11 -16 L-9 -32 L0 -18Z" fill="#f8d0a0" opacity="0.6" />
      {/* 오른쪽 귀 */}
      <path d="M6 -17 L17 -38 L17 -9Z" fill="#f0ae54" />
      {/* 귀 안쪽 */}
      <path d="M8 -17 L16 -32 L15 -11Z" fill="#f8d0a0" opacity="0.6" />
      {/* 눈 */}
      <ellipse cx="-4" cy="-8" rx="2.2" ry="2.8" fill="#2e2420" />
      <ellipse cx="8" cy="-8" rx="2.2" ry="2.8" fill="#2e2420" />
      {/* 눈 하이라이트 */}
      <circle cx="-3" cy="-9.2" r="0.8" fill="#ffffff" opacity="0.75" />
      <circle cx="9" cy="-9.2" r="0.8" fill="#ffffff" opacity="0.75" />
      {/* 코 */}
      <circle cx="2" cy="-2" r="2.2" fill="#2e2420" />
      {/* 코 하이라이트 */}
      <circle cx="1.2" cy="-2.6" r="0.7" fill="#ffffff" opacity="0.5" />
    </g>
  );
}

/* ─────────────────────────── 개구리 (Frog) ─────────────────────────── */
function Frog() {
  return (
    <g transform="translate(120 194)">
      {/* 뒷발 */}
      <ellipse cx="-8" cy="4" rx="7" ry="3" fill="#4a9e5c" opacity="0.6" />
      <ellipse cx="8" cy="4" rx="7" ry="3" fill="#4a9e5c" opacity="0.6" />
      {/* 몸통 */}
      <ellipse cx="0" cy="0" rx="11" ry="6.5" fill="#52a864" />
      {/* 배 */}
      <ellipse cx="0" cy="1" rx="7" ry="4" fill="#78cc84" opacity="0.5" />
      {/* 눈 (볼록) */}
      <circle cx="-5.5" cy="-5.5" r="4" fill="#64ba72" />
      <circle cx="5.5" cy="-5.5" r="4" fill="#64ba72" />
      {/* 눈동자 */}
      <circle cx="-5.5" cy="-5.8" r="1.8" fill="#1e3022" />
      <circle cx="5.5" cy="-5.8" r="1.8" fill="#1e3022" />
      {/* 눈 하이라이트 */}
      <circle cx="-4.8" cy="-6.4" r="0.7" fill="#ffffff" opacity="0.8" />
      <circle cx="6.2" cy="-6.4" r="0.7" fill="#ffffff" opacity="0.8" />
      {/* 입 */}
      <path
        d="M-3 1 Q0 3 3 1"
        fill="none"
        stroke="#2e6038"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}
