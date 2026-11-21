import {
  defineFrames,
  mirror,
  type Colors,
  type FramesOptions,
  type Sprite,
} from "./art.js";
import type { Tone } from "./palette.js";

/** Each creature picks a random value between min and max. */
export type Range = readonly [min: number, max: number];

export type Scheme = { readonly body: Tone; readonly accent?: Tone };

export type Vent = {
  /** Counted from the bottom-left of the drawing. */
  readonly at: readonly [column: number, rowsUp: number];
  /** Bubbles per second. */
  readonly rate: number;
};

export type FishSpec = {
  name: string;
  /** Extra frames animate the tail as the fish swims. */
  frames: string[];
  /** Which way `frames` face; the other way is mirrored. Default "right". */
  facing?: "right" | "left";
  /** Hand-drawn frames for the other direction, if mirroring looks wrong. */
  framesFlipped?: string[];
  /** Default: everything is "body" and "o" is the eye. */
  colors?: Colors;
  /** Each fish picks one. */
  schemes: Scheme[];
  /** Cells per second. */
  speed: Range;
  /** 0 is just under the surface, 1 is the floor. */
  depth: Range;
  /** Rows of up-and-down bob. Default 0.3. */
  bob?: number;
  /** How common it is relative to other species. Default 1. */
  weight?: number;
  seeThrough?: boolean;
};

export type Species = {
  readonly name: string;
  readonly right: readonly Sprite[];
  readonly left: readonly Sprite[];
  readonly width: number;
  readonly height: number;
  readonly schemes: readonly Scheme[];
  readonly speed: Range;
  readonly depth: Range;
  readonly bob: number;
  readonly weight: number;
  /** Row of the eye, where bubbles come out. */
  readonly mouthRow: number;
};

export function defineFish(spec: FishSpec): Species {
  const owner = `Fish "${spec.name}"`;
  checkRange(owner, "speed", spec.speed, 0);
  checkRange(owner, "depth", spec.depth, 0, 1);
  checkSchemes(owner, spec.schemes);

  const all = frames(owner, [...spec.frames, ...(spec.framesFlipped ?? [])], {
    colors: { default: "body", o: "eye", ...spec.colors },
    seeThrough: spec.seeThrough,
  });
  const drawn = all.slice(0, spec.frames.length);
  const flipped = spec.framesFlipped
    ? all.slice(spec.frames.length)
    : drawn.map(mirror);
  const [right, left] =
    spec.facing === "left" ? [flipped, drawn] : [drawn, flipped];
  const [first] = right;

  return {
    name: spec.name,
    right,
    left,
    width: first.width,
    height: first.height,
    schemes: spec.schemes,
    speed: spec.speed,
    depth: spec.depth,
    bob: spec.bob ?? 0.3,
    weight: spec.weight ?? 1,
    mouthRow: rowWithEye(first) ?? Math.floor(first.height / 2),
  };
}

export type DecorationSpec = {
  name: string;
  /** Several frames animate it. The bottom line rests on the sand. */
  frames: string[];
  /** Frames per second. Default 2. */
  frameRate?: number;
  colors?: Colors;
  seeThrough?: boolean;
  /** Higher priority gets a spot first when space is tight. */
  priority: number;
  /** May appear more than once on a wide, empty floor. */
  repeatable?: boolean;
  vents?: Vent[];
  /** Every so often, show the burst frames and use the burst vents for a moment. */
  burst?: {
    frames: string[];
    /** Seconds between bursts. */
    every: Range;
    /** Seconds a burst lasts. */
    lasts: number;
    vents?: Vent[];
  };
};

export type Decoration = {
  readonly name: string;
  readonly frames: readonly Sprite[];
  readonly frameRate: number;
  readonly priority: number;
  readonly repeatable: boolean;
  readonly width: number;
  readonly height: number;
  readonly vents: readonly Vent[];
  readonly burst?: {
    readonly frames: readonly Sprite[];
    readonly every: Range;
    readonly lasts: number;
    readonly vents: readonly Vent[];
  };
};

export function defineDecoration(spec: DecorationSpec): Decoration {
  const owner = `Decoration "${spec.name}"`;
  const { burst } = spec;
  if (burst) {
    checkRange(owner, "burst.every", burst.every, 0);
    if (burst.frames.length === 0) {
      throw new Error(`${owner}: burst needs at least one drawing.`);
    }
  }

  const all = frames(owner, [...spec.frames, ...(burst?.frames ?? [])], {
    colors: spec.colors,
    seeThrough: spec.seeThrough,
    anchor: "bottom",
  });
  const idle = all.slice(0, spec.frames.length);

  return {
    name: spec.name,
    frames: idle,
    frameRate: spec.frameRate ?? 2,
    priority: spec.priority,
    repeatable: spec.repeatable ?? false,
    width: idle[0].width,
    height: idle[0].height,
    vents: spec.vents ?? [],
    burst: burst && {
      frames: all.slice(spec.frames.length),
      every: burst.every,
      lasts: burst.lasts,
      vents: burst.vents ?? [],
    },
  };
}

export type CritterSpec = {
  name: string;
  /** Facing right; cycles as it moves. */
  walk: string[];
  /** Loops while resting; repeat a drawing to hold it. Default: the first walk frame. */
  rest?: string[];
  /** Default: everything is "body" and "o" is the eye. */
  colors?: Colors;
  schemes: Scheme[];
  /** Cells per second. */
  speed: Range;
  /** Seconds of walking between rests. */
  walkFor: Range;
  /** Seconds per rest. */
  restFor: Range;
  /** Cells walked per walk frame. Default 1. */
  stride?: number;
  /** Rest frames per second. Default 2. */
  restFrameRate?: number;
  /** Only appears in tanks at least this wide. Default 40. */
  minWidth?: number;
  /** Mirror when walking left. Default true. */
  turns?: boolean;
};

type Facing = { readonly right: readonly Sprite[]; readonly left: readonly Sprite[] };

export type CritterKind = {
  readonly name: string;
  readonly walk: Facing;
  readonly rest: Facing;
  readonly width: number;
  readonly height: number;
  readonly schemes: readonly Scheme[];
  readonly speed: Range;
  readonly walkFor: Range;
  readonly restFor: Range;
  readonly stride: number;
  readonly restFrameRate: number;
  readonly minWidth: number;
};

export function defineCritter(spec: CritterSpec): CritterKind {
  const owner = `Critter "${spec.name}"`;
  checkRange(owner, "speed", spec.speed, 0);
  checkRange(owner, "walkFor", spec.walkFor, 0);
  checkRange(owner, "restFor", spec.restFor, 0);
  checkSchemes(owner, spec.schemes);

  const restArts = spec.rest ?? spec.walk.slice(0, 1);
  const all = frames(owner, [...spec.walk, ...restArts], {
    colors: { default: "body", o: "eye", ...spec.colors },
    anchor: "bottom",
  });
  const walk = all.slice(0, spec.walk.length);
  const rest = all.slice(spec.walk.length);
  const facing = (right: Sprite[]): Facing => ({
    right,
    left: spec.turns === false ? right : right.map(mirror),
  });

  return {
    name: spec.name,
    walk: facing(walk),
    rest: facing(rest),
    width: walk[0].width,
    height: walk[0].height,
    schemes: spec.schemes,
    speed: spec.speed,
    walkFor: spec.walkFor,
    restFor: spec.restFor,
    stride: spec.stride ?? 1,
    restFrameRate: spec.restFrameRate ?? 2,
    minWidth: spec.minWidth ?? 40,
  };
}

function frames(owner: string, arts: readonly string[], options: FramesOptions) {
  if (arts.length === 0) throw new Error(`${owner}: needs at least one drawing.`);
  try {
    return defineFrames(arts, options);
  } catch (error) {
    throw new Error(`${owner}: ${error instanceof Error ? error.message : error}`);
  }
}

function checkRange(
  owner: string,
  field: string,
  [min, max]: Range,
  lowest = -Infinity,
  highest = Infinity,
) {
  if (min <= max && min >= lowest && max <= highest) return;
  const bounds =
    highest === Infinity ? `at least ${lowest}` : `between ${lowest} and ${highest}`;
  throw new Error(
    `${owner}: ${field} should be [min, max] with min ≤ max, ${bounds}. Got [${min}, ${max}].`,
  );
}

function checkSchemes(owner: string, schemes: readonly Scheme[]) {
  if (schemes.length === 0) throw new Error(`${owner}: needs at least one color scheme.`);
}

function rowWithEye(sprite: Sprite) {
  const row = sprite.cells.findIndex((cells) => cells.some((cell) => cell?.paint === "eye"));
  return row === -1 ? undefined : row;
}
