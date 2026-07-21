import islandBenchImage from "./assets/island_bench_sand.png";
import islandCampfireImage from "./assets/island_campfire_sand.png";
import islandTentImage from "./assets/island_tent_sand.png";

const MEMBER_ISLAND_IMAGES = [
  islandBenchImage,
  islandCampfireImage,
  islandTentImage,
] as const;

export function getMemberIslandImage(memberId: string): string {
  let hash = 0;

  for (const character of memberId) {
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  }

  return (
    MEMBER_ISLAND_IMAGES[hash % MEMBER_ISLAND_IMAGES.length] ??
    islandBenchImage
  );
}
