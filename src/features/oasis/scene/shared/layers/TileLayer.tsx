import styles from "../OasisSvgScene.module.css";
import {
  OASIS_TILE_PLACEMENTS,
  type OasisTilePlacement,
  type SharedOasisPresentation,
} from "../sharedOasisSceneConfig";
import {
  BridgeTile,
  CactusTile,
  FlowerTile,
  LilyTile,
  Lotus,
  PalmTile,
  RockTile,
  ShrubTile,
  SproutTile,
} from "../tiles/OasisTiles";

interface Props {
  layer: OasisTilePlacement["layer"];
  presentation: SharedOasisPresentation;
}

export function TileLayer({ layer, presentation }: Props) {
  const tiles = OASIS_TILE_PLACEMENTS.filter(
    (tile) =>
      tile.layer === layer &&
      presentation.visibleTileIds.has(tile.id),
  );

  return (
    <g data-layer={`tiles-${layer}`}>
      {tiles.map((tile) => (
        <g
          key={tile.id}
          className={styles.tileReveal}
          data-tile-id={tile.id}
        >
          <OasisTile placement={tile} />
        </g>
      ))}

      {layer === "middle" && presentation.bloomState !== "none" && (
        <g
          className={
            presentation.bloomState === "flower"
              ? styles.flowerReveal
              : styles.budGrowth
          }
          data-bloom={presentation.bloomState}
        >
          <Lotus state={presentation.bloomState} />
        </g>
      )}
    </g>
  );
}

function OasisTile({
  placement,
}: {
  placement: OasisTilePlacement;
}) {
  const props = {
    x: placement.x,
    y: placement.y,
    scale: placement.scale,
    flip: placement.flip,
  };

  switch (placement.kind) {
    case "rock":
      return <RockTile {...props} />;
    case "cactus":
      return <CactusTile {...props} />;
    case "sprout":
      return <SproutTile {...props} />;
    case "palm":
      return <PalmTile {...props} />;
    case "shrub":
      return <ShrubTile {...props} />;
    case "flower":
      return <FlowerTile {...props} />;
    case "lily":
      return <LilyTile {...props} />;
    case "bridge":
      return <BridgeTile {...props} />;
  }
}
