import type { Tone } from "./palette.js";

/** A palette color, or a slot filled in per creature so one drawing can come in many colors. */
export type Paint = Tone | "body" | "accent";

export type Colors = Readonly<Record<string, Paint>>;

export type FramesOptions = {
  /**
   * Color per character, plus `default` for the rest (default "body").
   * @example { default: "castle", ">": "flag" }
   */
  colors?: Colors;
  /**
   * Spaces between a line's first and last character are solid by default,
   * so things behind the drawing stay hidden. Set true for airy art like coral.
   */
  seeThrough?: boolean;
  /** How frames of different heights line up. Default "top". */
  anchor?: "top" | "bottom";
};

type SpriteCell = { readonly ch: string; readonly paint: Paint };

export type Sprite = {
  readonly width: number;
  readonly height: number;
  /** `cells[row][column]`; `null` is transparent. */
  readonly cells: readonly (readonly (SpriteCell | null)[])[];
};

/**
 * Write art with String.raw`...` so backslashes don't need escaping, and \`
 * for a backtick. Shared indentation and blank edge lines are stripped.
 */
export function defineArt(art: string, options: FramesOptions = {}): Sprite {
  return defineFrames([art], options)[0];
}

/**
 * Turns animation frames into sprites of one shared size. Frames are dedented
 * together so one indented further than the rest keeps its offset.
 */
export function defineFrames(
  arts: readonly string[],
  options: FramesOptions = {},
): Sprite[] {
  const frames = arts.map((art, i) => {
    const label = arts.length > 1 ? `Drawing ${i + 1}` : "The drawing";
    if (art.includes("\t")) {
      throw new Error(`${label} contains a tab. Use spaces instead.`);
    }
    // String.raw keeps the backslash of \`, so drop it here.
    const text = art.replaceAll("\\`", "`").replace(/\r\n?/g, "\n");
    const lines = trimBlankEdges(text.split("\n"));
    if (lines.length === 0) throw new Error(`${label} is empty.`);
    return lines;
  });

  const indent = Math.min(
    ...frames
      .flat()
      .filter((line) => line.trim() !== "")
      .map((line) => line.length - line.trimStart().length),
  );
  const trimmed = frames.map((lines) =>
    lines.map((line) => line.slice(indent).trimEnd()),
  );

  const width = Math.max(...trimmed.flat().map((line) => [...line].length));
  const height = Math.max(...trimmed.map((lines) => lines.length));

  return trimmed.map((lines) => {
    const padding = Array<string>(height - lines.length).fill("");
    const padded =
      options.anchor === "bottom"
        ? [...padding, ...lines]
        : [...lines, ...padding];
    return buildSprite(padded, width, options);
  });
}

function buildSprite(
  lines: readonly string[],
  width: number,
  { colors = {}, seeThrough }: FramesOptions,
): Sprite {
  const fallback = colors.default ?? "body";

  const cells = lines.map((line) => {
    const chars = [...line];
    const first = chars.findIndex((ch) => ch !== " ");
    const last = chars.findLastIndex((ch) => ch !== " ");

    return Array.from({ length: width }, (_, x): SpriteCell | null => {
      const ch = chars[x] ?? " ";
      if (ch !== " ") return { ch, paint: colors[ch] ?? fallback };
      const inside = !seeThrough && x > first && x < last;
      return inside ? { ch, paint: fallback } : null;
    });
  });

  return { width, height: cells.length, cells };
}

function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;
  return lines.slice(start, end);
}

const MIRROR: Readonly<Record<string, string>> = {
  "<": ">",
  ">": "<",
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "/": "\\",
  "\\": "/",
};

export function mirror(sprite: Sprite): Sprite {
  return {
    ...sprite,
    cells: sprite.cells.map((row) =>
      row
        .toReversed()
        .map((cell) =>
          cell ? { ...cell, ch: MIRROR[cell.ch] ?? cell.ch } : null,
        ),
    ),
  };
}
