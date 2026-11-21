import { CRITTERS } from "../art/critters.js";
import type { Sprite } from "./art.js";
import type { CritterKind } from "./catalog.js";
import { clamp } from "./math.js";
import type { Critter, World } from "./world.js";

const TURN_CHANCE = 0.4;

/** Adds or removes critters to match what fits the width. */
export function syncCritters(world: World) {
  world.critters = world.critters.filter((critter) => world.width >= critter.kind.minWidth);
  for (const kind of CRITTERS) {
    const present = world.critters.some((critter) => critter.kind === kind);
    if (!present && world.width >= kind.minWidth) world.critters.push(spawnCritter(world, kind));
  }
  for (const critter of world.critters) {
    critter.x = clamp(critter.x, 0, world.width - critter.kind.width);
  }
}

function spawnCritter(world: World, kind: CritterKind): Critter {
  const { rng, time } = world;
  return {
    kind,
    scheme: rng.pick(kind.schemes),
    x: rng.range(0, world.width - kind.width),
    dir: rng.chance(0.5) ? 1 : -1,
    speed: rng.range(...kind.speed),
    mode: "walk",
    until: time + rng.range(...kind.walkFor),
    stroke: 0,
    restTime: 0,
  };
}

export function stepCritter(world: World, critter: Critter, dt: number) {
  const { rng, time } = world;
  const { kind } = critter;

  if (time >= critter.until) {
    if (critter.mode === "walk") {
      critter.mode = "rest";
      critter.restTime = 0;
      critter.until = time + rng.range(...kind.restFor);
    } else {
      critter.mode = "walk";
      if (rng.chance(TURN_CHANCE)) critter.dir = critter.dir === 1 ? -1 : 1;
      critter.until = time + rng.range(...kind.walkFor);
    }
  }

  if (critter.mode === "rest") {
    critter.restTime += dt;
    return;
  }

  critter.x += critter.dir * critter.speed * dt;
  critter.stroke += critter.speed * dt;
  const maxX = world.width - kind.width;
  if (critter.x <= 0) {
    critter.x = 0;
    critter.dir = 1;
  } else if (critter.x >= maxX) {
    critter.x = maxX;
    critter.dir = -1;
  }
}

export function critterSprite({ kind, mode, dir, stroke, restTime }: Critter): Sprite {
  const set = mode === "walk" ? kind.walk : kind.rest;
  const frames = dir === 1 ? set.right : set.left;
  const index =
    mode === "walk"
      ? Math.floor(stroke / kind.stride)
      : Math.floor(restTime * kind.restFrameRate);
  return frames[index % frames.length];
}
