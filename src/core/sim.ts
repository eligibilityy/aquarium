import { stepBubbles } from "./bubbles.js";
import { stepCritter, syncCritters } from "./critters.js";
import { placeDecorations, stepDecorations } from "./decorations.js";
import {
  defaultFishCount,
  fishCapacity,
  fitsTank,
  manageSchool,
  removeFish,
  spawnFish,
  startLeaving,
  stepFish,
  swimRows,
} from "./fish.js";
import { EMPTY_LAYOUT, layoutScenery } from "./layout.js";
import { clamp } from "./math.js";
import { deriveRng } from "./rng.js";
import { MAX_DT, WATER_TOP, waterRows, type World } from "./world.js";

export { addFish, fishCapacity, removeFish, stayingFish } from "./fish.js";

type WorldOptions = {
  seed: number;
  width: number;
  height: number;
  /** Default: based on the tank size. */
  fish?: number;
};

export function createWorld({ seed, width, height, fish }: WorldOptions): World {
  const world: World = {
    seed,
    width: 0,
    height: 0,
    time: 0,
    rng: deriveRng(seed, "sim"),
    layout: EMPTY_LAYOUT,
    decorations: [],
    fish: [],
    critters: [],
    bubbles: [],
    targetFish: 0,
    spawnTimer: 0,
    nextId: 1,
  };
  resizeWorld(world, width, height);

  world.targetFish = clamp(fish ?? defaultFishCount(world), 0, fishCapacity(world));
  for (let i = 0; i < world.targetFish; i++) spawnFish(world, { entering: false });
  return world;
}

export function resizeWorld(world: World, width: number, height: number) {
  if (world.width === width && world.height === height) return;
  const oldWater = waterRows(world);
  const widthChanged = world.width !== width;
  world.width = width;
  world.height = height;

  if (widthChanged) {
    world.layout = layoutScenery(world.seed, width);
    world.decorations = placeDecorations(world.layout, world.rng, world.time);
    syncCritters(world);
  }

  // Keep each fish at the same relative depth.
  const scale = oldWater > 0 ? waterRows(world) / oldWater : 1;
  const rescale = (y: number) => WATER_TOP + (y - WATER_TOP) * scale;
  for (const fish of world.fish) {
    if (!fitsTank(world, fish.species)) startLeaving(world, fish);
    const [top, bottom] = swimRows(world, fish.species);
    fish.y = clamp(rescale(fish.y), top, bottom);
    fish.targetY = clamp(rescale(fish.targetY), top, bottom);
    if (fish.mode === "swimming") {
      fish.x = clamp(fish.x, 0, Math.max(0, width - fish.species.width));
    }
  }

  world.bubbles = [];
  while (world.targetFish > fishCapacity(world)) removeFish(world);
}

export function step(world: World, dt: number) {
  const seconds = clamp(dt, 0, MAX_DT);
  world.time += seconds;
  world.fish = world.fish.filter((fish) => stepFish(world, fish, seconds));
  manageSchool(world, seconds);
  for (const critter of world.critters) stepCritter(world, critter, seconds);
  stepDecorations(world, seconds);
  stepBubbles(world, seconds);
}
