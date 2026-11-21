// npm run preview -- [width] [height] [seconds] [seed] [fish]
import { renderToString } from "ink";
import { Tank } from "../src/components/Tank.js";
import { renderWorld } from "../src/core/render.js";
import { createWorld, step } from "../src/core/sim.js";

const [width = 80, height = 20, seconds = 0, seed = 1, fish] = process.argv
  .slice(2)
  .map(Number);

const world = createWorld({ seed, width, height, fish });
for (let t = 0; t < seconds; t += 1 / 12) step(world, 1 / 12);

console.log(renderToString(<Tank grid={renderWorld(world)} />, { columns: width }));
