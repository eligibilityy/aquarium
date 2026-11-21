export type Rng = {
  /** [0, 1) */
  next(): number;
  /** [min, max) */
  range(min: number, max: number): number;
  /** [min, max], both ends included */
  int(min: number, max: number): number;
  chance(p: number): boolean;
  pick<T>(items: readonly T[]): T;
  weighted<T>(items: readonly T[], weightOf: (item: T) => number): T;
  /** Shuffles in place. */
  shuffle<T>(items: T[]): T[];
};

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** FNV-1a, so word seeds like "nemo" become numbers. */
export function hashSeed(input: string | number): number {
  const text = String(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const assertNotEmpty = (items: readonly unknown[]) => {
    if (items.length === 0) throw new Error("Can't pick from an empty list.");
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    chance: (p) => next() < p,
    pick(items) {
      assertNotEmpty(items);
      return items[Math.floor(next() * items.length)];
    },
    weighted(items, weightOf) {
      assertNotEmpty(items);
      const total = items.reduce((sum, item) => sum + weightOf(item), 0);
      let roll = next() * total;
      for (const item of items) {
        roll -= weightOf(item);
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    },
    shuffle(items) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items;
    },
  };
}

/**
 * An independent stream per label, so unrelated randomness can't affect each
 * other: adding a fish must not reshuffle the scenery.
 */
export function deriveRng(seed: number, label: string): Rng {
  return createRng(hashSeed(`${seed}:${label}`));
}
