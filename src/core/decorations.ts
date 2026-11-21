import type { Sprite } from "./art.js";
import { emitBubble } from "./bubbles.js";
import type { Layout } from "./layout.js";
import type { Rng } from "./rng.js";
import { floorRow, type DecorationState, type World } from "./world.js";

const SAND_VENT_RATE = 0.5;

export function placeDecorations(layout: Layout, rng: Rng, time: number): DecorationState[] {
  return layout.decorations.map(({ decoration, x }) => ({
    decoration,
    x,
    burstUntil: 0,
    nextBurst: decoration.burst ? time + rng.range(...decoration.burst.every) : Infinity,
  }));
}

export function decorationFrame({ decoration, burstUntil }: DecorationState, time: number): Sprite {
  const frames =
    decoration.burst && time < burstUntil ? decoration.burst.frames : decoration.frames;
  return frames[Math.floor(time * decoration.frameRate) % frames.length];
}

export function stepDecorations(world: World, dt: number) {
  const { rng, time } = world;
  const floor = floorRow(world);
  // A rate of r per second is an r·dt chance this frame.
  const vent = (x: number, y: number, rate: number) => {
    if (rng.chance(rate * dt)) emitBubble(world, x, y);
  };

  for (const state of world.decorations) {
    const { burst, vents } = state.decoration;
    if (burst && time >= state.nextBurst) {
      state.burstUntil = time + burst.lasts;
      state.nextBurst = state.burstUntil + rng.range(...burst.every);
    }
    const active = burst && time < state.burstUntil ? burst.vents : vents;
    for (const { at, rate } of active) vent(state.x + at[0], floor - at[1], rate);
  }

  for (const x of world.layout.vents) vent(x, floor, SAND_VENT_RATE);
}
