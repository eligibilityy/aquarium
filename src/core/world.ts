import type { CritterKind, Decoration, Scheme, Species } from "./catalog.js";
import type { Layout } from "./layout.js";
import type { Rng } from "./rng.js";

export const MIN_WIDTH = 30;
export const MIN_HEIGHT = 10;

/** Caps a frame's time step, so a stalled process doesn't teleport the fish. */
export const MAX_DT = 0.25;

/** Row 0 is the surface. */
export const WATER_TOP = 1;

type Direction = 1 | -1;

export type Fish = {
  readonly id: number;
  readonly species: Species;
  readonly scheme: Scheme;
  /** Back fish swim behind the scenery, dimmer and slower. */
  readonly layer: "back" | "front";
  x: number;
  y: number;
  targetY: number;
  dir: Direction;
  readonly speed: number;
  readonly bobPhase: number;
  readonly bobPeriod: number;
  /** Distance swum, which drives the tail animation. */
  stroke: number;
  mode: "entering" | "swimming" | "leaving";
  leaveAt: number;
  /** Seconds left in a turn; the fish slows, then flips. */
  turning: number;
  nextWander: number;
  nextBubble: number;
};

export type Critter = {
  readonly kind: CritterKind;
  readonly scheme: Scheme;
  x: number;
  dir: Direction;
  readonly speed: number;
  mode: "walk" | "rest";
  until: number;
  stroke: number;
  restTime: number;
};

export type Bubble = {
  x: number;
  y: number;
  readonly startY: number;
  readonly speed: number;
  readonly phase: number;
  readonly dim: boolean;
  poppedAt: number | null;
};

export type DecorationState = {
  readonly decoration: Decoration;
  readonly x: number;
  burstUntil: number;
  nextBurst: number;
};

/** Mutated in place by `step()` every frame. */
export type World = {
  readonly seed: number;
  width: number;
  height: number;
  time: number;
  readonly rng: Rng;
  layout: Layout;
  decorations: DecorationState[];
  fish: Fish[];
  critters: Critter[];
  bubbles: Bubble[];
  targetFish: number;
  spawnTimer: number;
  nextId: number;
};

type Size = Pick<World, "height">;

export const sandRow = (world: Size) => world.height - 1;
export const floorRow = (world: Size) => world.height - 2;
export const waterRows = (world: Size) => floorRow(world) - WATER_TOP + 1;
