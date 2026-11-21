import { DECORATIONS } from "../art/scenery.js";
import type { Decoration } from "./catalog.js";
import type { Tone } from "./palette.js";
import { deriveRng } from "./rng.js";

type PlacedDecoration = { readonly decoration: Decoration; readonly x: number };

export type Plant = {
  readonly x: number;
  readonly kind: "kelp" | "grass";
  /** Fraction of the water depth, so plants grow with the tank. */
  readonly size: number;
  readonly tone: Tone;
  /** Radians per second. */
  readonly rate: number;
  readonly phase: number;
};

export type Layout = {
  readonly decorations: readonly PlacedDecoration[];
  readonly plants: readonly Plant[];
  /** Columns where bubbles trickle up from the sand. */
  readonly vents: readonly number[];
  readonly sand: string;
};

export const EMPTY_LAYOUT: Layout = { decorations: [], plants: [], vents: [], sand: "" };

const MARGIN = 1;
const GAP = 4;
const MAX_COVER = 0.35;
/** Only floors emptier than this get repeated decorations. */
const MIN_COVER = 0.15;
const COLUMNS_PER_PLANT = 20;
const PLANT_SPACING = 4;
const KELP_SIZE = [0.2, 0.45] as const;
const GRASS_SIZE = [0.15, 0.35] as const;
const COLUMNS_PER_VENT = 80;

const SAND: readonly (readonly [char: string, weight: number])[] = [
  ["_", 8],
  [".", 2],
  [",", 1.5],
  ["-", 1],
  ["'", 0.5],
  ["o", 0.12],
  ["*", 0.05],
];

/** Depends only on seed and width, so resizing back restores the same floor. */
export function layoutScenery(
  seed: number,
  width: number,
  catalog: readonly Decoration[] = DECORATIONS,
): Layout {
  const rng = deriveRng(seed, `layout:${width}`);
  const usable = width - 2 * MARGIN;

  const chosen: Decoration[] = [];
  const covered = (list: readonly Decoration[]) =>
    list.reduce((sum, d) => sum + d.width, 0);
  const span = (list: readonly Decoration[]) =>
    covered(list) + GAP * Math.max(0, list.length - 1);
  const tryAdd = (decoration: Decoration) => {
    const next = [...chosen, decoration];
    if (span(next) > usable || covered(next) > usable * MAX_COVER) return false;
    chosen.push(decoration);
    return true;
  };

  for (const decoration of catalog.toSorted((a, b) => b.priority - a.priority)) {
    tryAdd(decoration);
  }
  const repeats = catalog.filter((d) => d.repeatable);
  while (repeats.length > 0 && covered(chosen) < usable * MIN_COVER) {
    if (!tryAdd(rng.pick(repeats))) break;
  }

  // Shuffle, then share the leftover columns out between the gaps at random.
  rng.shuffle(chosen);
  const leftover = Math.max(0, usable - span(chosen));
  const weights = chosen.map(() => rng.range(0.4, 1.6)).concat(rng.range(0.4, 1.6));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const extra = weights.map((w) => Math.floor((leftover * w) / totalWeight));

  let x = MARGIN + extra[0];
  const decorations = chosen.map((decoration, i) => {
    const placed = { decoration, x };
    x += decoration.width + GAP + extra[i + 1];
    return placed;
  });

  const blocked = new Set<number>();
  for (const { decoration, x } of decorations) {
    for (let c = x - 1; c <= x + decoration.width; c++) blocked.add(c);
  }
  // Grass is three columns wide, so the root's neighbors must be free too.
  const free = Array.from({ length: width }, (_, c) => c).filter(
    (c) => c > 0 && c < width - 1 && ![c - 1, c, c + 1].some((n) => blocked.has(n)),
  );

  const plants: Plant[] = [];
  const wanted = Math.round(width / COLUMNS_PER_PLANT);
  const crowded = (c: number) =>
    plants.some((plant) => Math.abs(plant.x - c) < PLANT_SPACING);

  for (let attempt = 0; free.length > 0 && plants.length < wanted && attempt < wanted * 10; attempt++) {
    const x = rng.pick(free);
    if (crowded(x)) continue;
    const kind = rng.chance(0.55) ? "kelp" : "grass";
    const [smallest, tallest] = kind === "kelp" ? KELP_SIZE : GRASS_SIZE;
    plants.push({
      x,
      kind,
      size: rng.range(smallest, tallest),
      tone: rng.chance(0.5) ? "weed" : "kelp",
      rate: rng.range(0.9, 1.7),
      phase: rng.range(0, Math.PI * 2),
    });
  }

  const ventColumns = free.filter((c) => !crowded(c));
  const vents: number[] = [];
  const ventCount = Math.max(1, Math.round(width / COLUMNS_PER_VENT));
  for (let i = 0; i < ventCount && ventColumns.length > 0; i++) {
    vents.push(rng.pick(ventColumns));
  }

  const sand = Array.from(
    { length: Math.max(0, width) },
    () => rng.weighted(SAND, ([, weight]) => weight)[0],
  ).join("");

  return { decorations, plants, vents, sand };
}
