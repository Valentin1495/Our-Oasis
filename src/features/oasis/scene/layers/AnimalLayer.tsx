import type { OasisSceneModel } from "../oasisSceneModel";
import styles from "../PrototypeOasisScene.module.css";

interface Props {
  model: OasisSceneModel;
  showSpecialCharacter: boolean;
}

export function AnimalLayer({ model, showSpecialCharacter }: Props) {
  const showFox = model.animalLevel >= 2 || showSpecialCharacter;

  return (
    <g>
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
      {model.animalLevel >= 2 && <Frog />}
    </g>
  );
}

function Bird() {
  return (
    <g transform="translate(220 131)">
      <ellipse cx="0" cy="0" rx="9" ry="7" fill="#6f86ad" />
      <circle cx="7" cy="-5" r="5" fill="#8199bc" />
      <path d="M12 -5 l7 3 -7 2Z" fill="#e4a948" />
      <circle cx="8" cy="-6" r="1.2" fill="#27354a" />
      <path
        d="M-5 0 Q0 -8 6 0"
        fill="none"
        stroke="#a9bbd2"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function FennecFox() {
  return (
    <g transform="translate(251 176)">
      <path d="M-14 -14 L-11 -37 L1 -17Z" fill="#efae58" />
      <path d="M5 -17 L17 -37 L16 -9Z" fill="#efae58" />
      <ellipse cx="2" cy="-5" rx="18" ry="15" fill="#f3b862" />
      <ellipse cx="-4" cy="-8" rx="2" ry="2.8" fill="#3e342c" />
      <ellipse cx="8" cy="-8" rx="2" ry="2.8" fill="#3e342c" />
      <circle cx="2" cy="-2" r="2" fill="#3e342c" />
      <path
        d="M-15 5 Q-28 3 -27 -8"
        fill="none"
        stroke="#efae58"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </g>
  );
}

function Frog() {
  return (
    <g transform="translate(119 195)">
      <ellipse cx="0" cy="0" rx="10" ry="5" fill="#56a867" />
      <circle cx="-5" cy="-5" r="3.5" fill="#6abe78" />
      <circle cx="5" cy="-5" r="3.5" fill="#6abe78" />
      <circle cx="-5" cy="-6" r="1" fill="#26382a" />
      <circle cx="5" cy="-6" r="1" fill="#26382a" />
    </g>
  );
}

