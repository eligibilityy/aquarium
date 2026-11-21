import { put, type Grid } from "./grid.js";
import type { Plant } from "./layout.js";
import { clamp } from "./math.js";
import type { Tone } from "./palette.js";

export function drawPlant(grid: Grid, plant: Plant, floor: number, depth: number, time: number) {
  const height = clamp(Math.round(plant.size * depth), 2, depth - 2);
  if (plant.kind === "kelp") drawKelp(grid, plant, floor, height, time);
  else drawGrass(grid, plant, floor, height, time);
}

/**
 * Sideways offset of each segment from root to tip: a wave travelling up the
 * stalk, scaled up toward the tip so the root stays planted.
 */
function sway(height: number, time: number, rate: number, phase: number, reach: number, lean = 0) {
  return Array.from({ length: height + 1 }, (_, k) => {
    const wave = Math.sin(time * rate + phase - k * 0.35);
    return Math.round((reach * wave + lean) * (k / height) ** 1.5);
  });
}

/** A segment's character follows where the next segment goes. */
function drawStalk(grid: Grid, x: number, floor: number, offsets: readonly number[], tone: Tone) {
  for (let k = 0; k < offsets.length - 1; k++) {
    const step = offsets[k + 1] - offsets[k];
    put(grid, x + offsets[k], floor - k, step > 0 ? "/" : step < 0 ? "\\" : "|", tone);
  }
}

function drawKelp(grid: Grid, plant: Plant, floor: number, height: number, time: number) {
  const offsets = sway(height, time, plant.rate, plant.phase, Math.min(2.5, height / 4));
  const leafTone: Tone = plant.tone === "kelp" ? "weed" : "kelp";

  drawStalk(grid, plant.x, floor, offsets, plant.tone);
  for (let k = 1; k < height; k += 2) {
    const left = (k - 1) % 4 === 0;
    put(grid, plant.x + offsets[k] + (left ? -1 : 1), floor - k, left ? "\\" : "/", leafTone);
  }
}

const BLADES = [
  { dx: -1, size: 0.65, lean: -1.5, phase: 0.7 },
  { dx: 0, size: 1, lean: 0, phase: 0 },
  { dx: 1, size: 0.8, lean: 1.5, phase: -0.6 },
];

function drawGrass(grid: Grid, plant: Plant, floor: number, height: number, time: number) {
  for (const blade of BLADES) {
    const bladeHeight = Math.max(1, Math.round(height * blade.size));
    const offsets = sway(bladeHeight, time, plant.rate, plant.phase + blade.phase, 1, blade.lean);
    drawStalk(grid, plant.x + blade.dx, floor, offsets, plant.tone);
  }
}
