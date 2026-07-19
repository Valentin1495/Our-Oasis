import { type CSSProperties } from "react";
import { deriveOasisSceneModel } from "./oasisSceneModel";
import styles from "./ConceptBWatercolor.module.css";

interface Props {
  percent: number;
  dropAnimationTick: number;
  reducedMotion?: boolean;
}

export function ConceptBWatercolor({ percent, dropAnimationTick, reducedMotion }: Props) {
  const model = deriveOasisSceneModel(percent);
  
  const isPerfect = model.isPerfect;
  const isSuccess = model.isCommunitySuccess;

  return (
    <div className={`${styles.wrapper} ${reducedMotion ? styles.reducedMotion : ""}`}>
      <div className={`${styles.canvas} ${isPerfect ? styles.prismMode : ""}`}>
        {/* Fluid background base */}
        <div className={styles.fluidContainer}>
           <div className={styles.waterBlob1} style={{ "--scale": model.waterLevel } as CSSProperties} />
           <div className={styles.waterBlob2} style={{ "--scale": model.waterLevel } as CSSProperties} />
        </div>

        {/* Glassmorphism elements overlay */}
        <div className={styles.glassLayer}>
           {model.edgePlantLevel > 0 && (
             <div className={`${styles.glassPlant} ${model.edgePlantLevel >= 2 ? styles.plantGrow2 : styles.plantGrow1}`} />
           )}

           {isSuccess && (
             <div className={styles.glassFlowerBase}>
               <div className={styles.glassPetal1} />
               <div className={styles.glassPetal2} />
               <div className={styles.glassPetal3} />
             </div>
           )}
           
           {isPerfect && (
             <div className={styles.prismOverlay}>
                <div className={styles.aurora} />
             </div>
           )}
        </div>

        {dropAnimationTick > 0 && (
           <div key={dropAnimationTick} className={styles.watercolorDrop} />
        )}
      </div>
      <p className={styles.percentLabel}>
        컨셉 B (수채화) · {Math.round(model.percent)}%
      </p>
    </div>
  );
}
