import { bubbleGlyph } from "./bubbles.js";
import { critterSprite } from "./critters.js";
import { decorationFrame } from "./decorations.js";
import { fishSprite, fishTop } from "./fish.js";
import { createGrid, put, stamp, type Grid } from "./grid.js";
import { clamp, mod } from "./math.js";
import type { Tone } from "./palette.js";
import { drawPlant } from "./plants.js";
import { floorRow, sandRow, waterRows, type Fish, type World } from "./world.js";

/** Back to front: water, back fish, plants, decorations, bubbles, front fish, critters. */
export function renderWorld(world: World): Grid {
  const grid = createGrid(world.width, world.height);
  drawSurface(grid, world);
  drawSand(grid, world);

  // Larger fish first, so small ones in the same layer stay visible.
  const fish = world.fish.toSorted((a, b) => area(b) - area(a));
  for (const f of fish) if (f.layer === "back") drawFish(grid, world, f);
  drawPlants(grid, world);
  drawDecorations(grid, world);
  drawBubbles(grid, world);
  for (const f of fish) if (f.layer === "front") drawFish(grid, world, f);
  drawCritters(grid, world);

  return grid;
}

const area = (fish: Fish) => fish.species.width * fish.species.height;

const WAVE = ["_", ".", "-", "~", "'"];

function drawSurface(grid: Grid, { width, time }: World) {
  const rippleShift = Math.floor(time * 2.5);
  for (let x = 0; x < width; x++) {
    const height = 0.6 * Math.sin(x * 0.22 - time * 1.7) + 0.4 * Math.sin(x * 0.09 + time * 1.1 + 1);
    const level = clamp(Math.floor(((height + 1) / 2) * WAVE.length), 0, WAVE.length - 1);
    put(grid, x, 0, WAVE[level], level >= 3 ? "foam" : "surface");
    if (mod(x * 7 - rippleShift, 23) === 0) put(grid, x, 1, "~", "surface", true);
  }
}

const SAND_TONES: Readonly<Record<string, Tone>> = { o: "rock", "*": "coral" };

function drawSand(grid: Grid, world: World) {
  const row = sandRow(world);
  for (let x = 0; x < world.width; x++) {
    const ch = world.layout.sand[x] ?? "_";
    put(grid, x, row, ch, SAND_TONES[ch] ?? "sand", true);
  }
}

function drawFish(grid: Grid, world: World, fish: Fish) {
  stamp(grid, fishSprite(fish), fish.x, fishTop(world, fish), {
    ...fish.scheme,
    dim: fish.layer === "back",
  });
}

function drawPlants(grid: Grid, world: World) {
  const depth = waterRows(world);
  const floor = floorRow(world);
  for (const plant of world.layout.plants) drawPlant(grid, plant, floor, depth, world.time);
}

function drawDecorations(grid: Grid, world: World) {
  const floor = floorRow(world);
  for (const state of world.decorations) {
    const sprite = decorationFrame(state, world.time);
    stamp(grid, sprite, state.x, floor - sprite.height + 1);
  }
}

function drawBubbles(grid: Grid, world: World) {
  for (const bubble of world.bubbles) {
    const { x, y, ch } = bubbleGlyph(bubble);
    put(grid, x, y, ch, "bubble", bubble.dim);
  }
}

function drawCritters(grid: Grid, world: World) {
  const floor = floorRow(world);
  for (const critter of world.critters) {
    const sprite = critterSprite(critter);
    stamp(grid, sprite, critter.x, floor - sprite.height + 1, critter.scheme);
  }
}
