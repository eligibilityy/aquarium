import { SPECIES } from "../art/fish.js";
import type { Sprite } from "./art.js";
import { emitBubble } from "./bubbles.js";
import type { Species } from "./catalog.js";
import { clamp } from "./math.js";
import { floorRow, WATER_TOP, waterRows, type Fish, type World } from "./world.js";

const BACK_LAYER_CHANCE = 0.35;
const BACK_LAYER_SPEED = 0.6;
const TURN_SECONDS = 0.5;
const TURN_CHANCE_PER_SECOND = 0.03;
const STAY_SECONDS = [25, 70] as const;
const WANDER_SECONDS = [4, 12] as const;
const BUBBLE_SECONDS = [4, 14] as const;
/** Cells swum per tail frame. */
const STROKE = 1.5;

/** At most half the water depth and a third of the width. */
export function fitsTank(world: World, species: Species) {
  return species.height <= waterRows(world) / 2 && species.width <= world.width / 3;
}

/** Inclusive range of rows the top of this species can be at. */
export function swimRows(world: World, species: Species): [number, number] {
  return [WATER_TOP, Math.max(WATER_TOP, floorRow(world) - species.height + 1)];
}

function pickRow(world: World, species: Species) {
  const [top, bottom] = swimRows(world, species);
  return top + world.rng.range(...species.depth) * (bottom - top);
}

export function fishCapacity(world: World) {
  return clamp(Math.floor((world.width * waterRows(world)) / 120), 4, 40);
}

export function defaultFishCount(world: World) {
  return clamp(Math.round((world.width * waterRows(world)) / 350), 3, 12);
}

export const stayingFish = (world: World) =>
  world.fish.filter((fish) => fish.mode !== "leaving");

/** `entering` fish swim in from an edge; the rest start inside the tank. */
export function spawnFish(world: World, { entering }: { entering: boolean }): Fish | undefined {
  const { rng, time } = world;
  const options = SPECIES.filter((species) => fitsTank(world, species));
  if (options.length === 0) return undefined;

  const species = rng.weighted(options, (s) => s.weight);
  const dir = rng.chance(0.5) ? 1 : -1;
  const edge = dir === 1 ? -species.width : world.width;
  const y = pickRow(world, species);

  const fish: Fish = {
    id: world.nextId++,
    species,
    scheme: rng.pick(species.schemes),
    layer: rng.chance(BACK_LAYER_CHANCE) ? "back" : "front",
    x: entering ? edge : rng.range(0, world.width - species.width),
    y,
    targetY: y,
    dir,
    speed: rng.range(...species.speed),
    bobPhase: rng.range(0, Math.PI * 2),
    bobPeriod: rng.range(3, 6),
    stroke: rng.range(0, STROKE * 2),
    mode: entering ? "entering" : "swimming",
    // The first fish leave at staggered times instead of all at once.
    leaveAt: time + (entering ? rng.range(...STAY_SECONDS) : rng.range(8, STAY_SECONDS[1])),
    turning: 0,
    nextWander: time + rng.range(...WANDER_SECONDS),
    nextBubble: time + rng.range(...BUBBLE_SECONDS),
  };
  world.fish.push(fish);
  return fish;
}

/** Sends a fish out through the nearest side. */
export function startLeaving(world: World, fish: Fish) {
  if (fish.mode === "leaving") return;
  fish.mode = "leaving";
  const exit = fish.x + fish.species.width / 2 < world.width / 2 ? -1 : 1;
  const heading = fish.turning > 0 ? -fish.dir : fish.dir;
  if (heading !== exit) fish.turning = fish.turning > 0 ? 0 : TURN_SECONDS;
}

/** Returns false once the fish has left the tank. */
export function stepFish(world: World, fish: Fish, dt: number): boolean {
  const { species } = fish;
  const { rng, time } = world;

  if (fish.turning > 0) {
    fish.turning -= dt;
    if (fish.turning <= 0) {
      fish.turning = 0;
      fish.dir = fish.dir === 1 ? -1 : 1;
    }
  }

  const speed =
    fish.speed *
    (fish.layer === "back" ? BACK_LAYER_SPEED : 1) *
    (fish.turning > 0 ? 0.2 : 1);
  fish.x += fish.dir * speed * dt;
  // The constant keeps very slow fish flapping.
  fish.stroke += (speed + 0.8) * dt;

  if (time >= fish.nextWander) {
    fish.targetY = pickRow(world, species);
    fish.nextWander = time + rng.range(...WANDER_SECONDS);
  }
  const climb = Math.max(0.5, speed * 0.3) * dt;
  fish.y += clamp(fish.targetY - fish.y, -climb, climb);

  const maxX = world.width - species.width;
  if (fish.mode === "entering" && fish.x >= 0 && fish.x <= maxX) fish.mode = "swimming";
  if (fish.mode === "swimming") {
    fish.x = clamp(fish.x, 0, maxX);
    if (time >= fish.leaveAt) {
      startLeaving(world, fish);
    } else if (fish.turning === 0) {
      const facingWall = fish.dir === 1 ? fish.x >= maxX : fish.x <= 0;
      if (facingWall || rng.chance(TURN_CHANCE_PER_SECOND * dt)) fish.turning = TURN_SECONDS;
    }
  }
  if (fish.mode === "leaving" && (fish.x > world.width || fish.x < -species.width)) {
    return false;
  }

  if (time >= fish.nextBubble) {
    fish.nextBubble = time + rng.range(...BUBBLE_SECONDS);
    const mouthX = fish.dir === 1 ? fish.x + species.width : fish.x - 1;
    const mouthY = fishTop(world, fish) + species.mouthRow;
    emitBubble(world, Math.round(mouthX), mouthY, fish.layer === "back");
  }
  return true;
}

/** Replaces fish that left, a few seconds apart. */
export function manageSchool(world: World, dt: number) {
  world.spawnTimer -= dt;
  if (world.spawnTimer > 0) return;
  if (stayingFish(world).length < world.targetFish) spawnFish(world, { entering: true });
  world.spawnTimer = world.rng.range(1, 4);
}

export function addFish(world: World): boolean {
  if (world.targetFish >= fishCapacity(world)) return false;
  world.targetFish++;
  if (stayingFish(world).length < world.targetFish) spawnFish(world, { entering: true });
  return true;
}

/** The fish nearest an edge swims out, since it's out of sight soonest. */
export function removeFish(world: World): boolean {
  const staying = stayingFish(world);
  if (world.targetFish === 0 && staying.length === 0) return false;
  world.targetFish = Math.max(0, world.targetFish - 1);

  const edgeDistance = (fish: Fish) =>
    Math.min(fish.x, world.width - fish.x - fish.species.width);
  const [nearest] = staying.toSorted((a, b) => edgeDistance(a) - edgeDistance(b));
  if (nearest) startLeaving(world, nearest);
  return true;
}

export function fishTop(world: World, fish: Fish) {
  const wave = (world.time * 2 * Math.PI) / fish.bobPeriod;
  const bob = Math.sin(fish.bobPhase + wave) * fish.species.bob;
  const [top, bottom] = swimRows(world, fish.species);
  return clamp(Math.round(fish.y + bob), top, bottom);
}

export function fishSprite(fish: Fish): Sprite {
  const frames = fish.dir === 1 ? fish.species.right : fish.species.left;
  return frames[Math.floor(fish.stroke / STROKE) % frames.length];
}
