import type { CSSProperties } from "react";
import { deriveOasisSceneModel } from "./oasisSceneModel";
import styles from "./ConceptATerrarium.module.css";

interface Props {
  percent: number;
  dropAnimationTick: number;
  reducedMotion?: boolean;
}

export function ConceptATerrarium({ percent, dropAnimationTick, reducedMotion }: Props) {
  const model = deriveOasisSceneModel(percent);
  
  // Lighting classes
  let timeClass = styles.dawn;
  if (model.percent >= 25) timeClass = styles.morning;
  if (model.percent >= 50) timeClass = styles.afternoon;
  if (model.percent >= 75) timeClass = styles.goldenHour;
  if (model.isPerfect) timeClass = styles.magicNight;

  return (
    <div className={`${styles.container} ${timeClass} ${reducedMotion ? styles.reducedMotion : ""}`}>
      <svg viewBox="0 0 400 300" className={styles.svg}>
        <defs>
          <radialGradient id="water-grad" cx="50%" cy="50%" r="50%">
             <stop offset="0%" stopColor="var(--water-center)" />
             <stop offset="100%" stopColor="var(--water-edge)" />
          </radialGradient>
        </defs>
        
        {/* Isometric Base / Terrarium Dirt */}
        <ellipse cx="200" cy="180" rx="140" ry="70" fill="var(--soil-top)" className={styles.terrainTransition} />
        <path d="M60 180 v30 q140 70 280 0 v-30 Z" fill="var(--soil-side)" className={styles.terrainTransition} />

        {/* Water / Pond (Isometric) */}
        <g className={styles.waterGroup} style={{ "--water-scale": model.waterLevel } as CSSProperties}>
           <ellipse cx="200" cy="180" rx="100" ry="50" fill="url(#water-grad)" opacity="0.9" />
           {model.isCommunitySuccess && (
             <ellipse cx="200" cy="180" rx="80" ry="40" fill="var(--water-deep)" opacity="0.5" className={styles.waterDeep} />
           )}
        </g>

        {/* Flora/Plants */}
        {model.edgePlantLevel > 0 && (
          <g className={styles.flora}>
             <path d="M260 160 Q280 100 250 80" fill="none" stroke="var(--plant-stem)" strokeWidth="6" strokeLinecap="round" />
             <ellipse cx="250" cy="80" rx="15" ry="8" fill="var(--plant-leaf)" transform="rotate(-30 250 80)" />
             {model.edgePlantLevel >= 2 && (
                <g className={styles.floraSecondary}>
                  <path d="M260 160 Q230 110 210 90" fill="none" stroke="var(--plant-stem)" strokeWidth="4" strokeLinecap="round" />
                  <ellipse cx="210" cy="90" rx="10" ry="5" fill="var(--plant-leaf)" transform="rotate(20 210 90)" />
                </g>
             )}
             
             {model.bloomState === "bud" && (
                <ellipse cx="250" cy="70" rx="12" ry="16" fill="var(--flower-bud)" className={styles.bud} style={{ "--bud-scale": model.bloomProgress } as CSSProperties} />
             )}

             {model.bloomState === "flower" && (
                <g className={styles.flower} transform="translate(250 70)">
                   <circle cx="0" cy="0" r="18" fill="var(--flower-bloom-1)" className={styles.petal} />
                   <circle cx="-10" cy="-10" r="14" fill="var(--flower-bloom-2)" className={styles.petal} />
                   <circle cx="10" cy="-10" r="14" fill="var(--flower-bloom-2)" className={styles.petal} />
                   <circle cx="-10" cy="10" r="14" fill="var(--flower-bloom-2)" className={styles.petal} />
                   <circle cx="10" cy="10" r="14" fill="var(--flower-bloom-2)" className={styles.petal} />
                   <circle cx="0" cy="0" r="8" fill="var(--flower-center)" />
                </g>
             )}
          </g>
        )}

        {/* 100% Sparkles and Fireflies */}
        {model.isPerfect && (
           <g className={styles.magicEffects}>
             <circle cx="150" cy="130" r="3" fill="#fff" className={styles.firefly} style={{ animationDelay: "0s" }} />
             <circle cx="280" cy="100" r="2.5" fill="#fff" className={styles.firefly} style={{ animationDelay: "0.5s" }} />
             <circle cx="200" cy="80" r="4" fill="#fff" className={styles.firefly} style={{ animationDelay: "1s" }} />
           </g>
        )}

        {/* User Interaction Drop */}
        {dropAnimationTick > 0 && (
          <g key={dropAnimationTick}>
            <circle cx="200" cy="180" r="4" fill="var(--water-edge)" className={styles.dropFall} />
            <ellipse cx="200" cy="180" rx="40" ry="20" fill="none" stroke="var(--water-edge)" strokeWidth="3" className={styles.impactRipple} />
          </g>
        )}
      </svg>
      
      <p className={styles.percentLabel}>
        컨셉 A (테라리움) · {Math.round(model.percent)}%
      </p>
    </div>
  );
}
