import { WATER_TOP, type Bubble, type World } from "./world.js";

const POP_SECONDS = 0.2;
const RISE_SPEED = [2, 3.5] as const;

const maxBubbles = (world: World) => 20 + Math.floor(world.width / 3);

export function emitBubble(world: World, x: number, y: number, dim = false) {
  if (y <= WATER_TOP || x < 0 || x >= world.width) return;
  if (world.bubbles.length >= maxBubbles(world)) return;
  world.bubbles.push({
    x,
    y,
    startY: y,
    speed: world.rng.range(...RISE_SPEED),
    phase: world.rng.range(0, Math.PI * 2),
    dim,
    poppedAt: null,
  });
}

export function stepBubbles(world: World, dt: number) {
  world.bubbles = world.bubbles.filter((bubble) => {
    if (bubble.poppedAt !== null) return world.time - bubble.poppedAt < POP_SECONDS;
    bubble.y -= bubble.speed * dt;
    if (bubble.y <= WATER_TOP) {
      bubble.y = WATER_TOP;
      bubble.poppedAt = world.time;
    }
    return true;
  });
}

/** Grows as it rises, zigzags, and pops at the surface. */
export function bubbleGlyph(bubble: Bubble) {
  const risen = bubble.startY - bubble.y;
  const ch = bubble.poppedAt !== null ? "*" : risen < 2 ? "." : risen < 6 ? "o" : "O";
  const wobble = Math.sin(bubble.phase + bubble.y * 0.9) * 0.6;
  return { x: Math.round(bubble.x + wobble), y: Math.round(bubble.y), ch };
}
