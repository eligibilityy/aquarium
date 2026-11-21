// npm run gallery -- [name filter]   (FORCE_COLOR=1 for colors)
import { renderToString } from "ink";
import { CRITTERS } from "../src/art/critters.js";
import { SPECIES } from "../src/art/fish.js";
import { DECORATIONS } from "../src/art/scenery.js";
import { Tank } from "../src/components/Tank.js";
import type { Sprite } from "../src/core/art.js";
import type { Scheme } from "../src/core/catalog.js";
import { createGrid, stamp } from "../src/core/grid.js";

const filter = process.argv[2]?.toLowerCase() ?? "";
const GAP = 4;

function show(title: string, sprites: readonly Sprite[], scheme?: Scheme) {
  if (!title.toLowerCase().includes(filter)) return;
  const width = sprites.reduce((sum, s) => sum + s.width + GAP, 0);
  const height = Math.max(...sprites.map((s) => s.height));
  const grid = createGrid(width, height);
  let x = 0;
  for (const sprite of sprites) {
    stamp(grid, sprite, x, height - sprite.height, scheme);
    x += sprite.width + GAP;
  }
  console.log(`\n${title} (${sprites[0].width}×${sprites[0].height})`);
  console.log(renderToString(<Tank grid={grid} />, { columns: width }));
}

for (const species of SPECIES) {
  show(`fish: ${species.name}`, [...species.right, ...species.left], species.schemes[0]);
}
for (const decoration of DECORATIONS) {
  show(`decoration: ${decoration.name}`, [...decoration.frames, ...(decoration.burst?.frames ?? [])]);
}
for (const { name, walk, rest, schemes } of CRITTERS) {
  show(`critter: ${name}`, [...walk.right, ...rest.right, ...walk.left], schemes[0]);
}
