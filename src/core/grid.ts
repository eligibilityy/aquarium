import type { Paint, Sprite } from "./art.js";
import type { Tone } from "./palette.js";

export type Cell = { ch: string; tone: Tone | null; dim: boolean };

export type Grid = {
  readonly width: number;
  readonly height: number;
  readonly rows: Cell[][];
};

export function createGrid(width: number, height: number): Grid {
  const rows = Array.from({ length: height }, () =>
    Array.from({ length: width }, (): Cell => ({ ch: " ", tone: null, dim: false })),
  );
  return { width, height, rows };
}

export function put(
  grid: Grid,
  x: number,
  y: number,
  ch: string,
  tone: Tone | null,
  dim = false,
) {
  if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) return;
  const cell = grid.rows[y][x];
  cell.ch = ch;
  cell.tone = tone;
  cell.dim = dim;
}

type StampOptions = { body?: Tone; accent?: Tone; dim?: boolean };

export function stamp(
  grid: Grid,
  sprite: Sprite,
  x: number,
  y: number,
  options: StampOptions = {},
) {
  const left = Math.round(x);
  const top = Math.round(y);
  sprite.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) return;
      put(grid, left + c, top + r, cell.ch, resolve(cell.paint, options), options.dim);
    }),
  );
}

function resolve(paint: Paint, { body, accent }: StampOptions): Tone | null {
  if (paint === "body") return body ?? null;
  if (paint === "accent") return accent ?? body ?? null;
  return paint;
}

type Run = { text: string; tone: Tone | null; dim: boolean };

/** Merges a row into same-style runs. Spaces join any run since their color is invisible. */
export function toRuns(row: readonly Cell[]): Run[] {
  const runs: Run[] = [];
  for (const cell of row) {
    const last = runs.at(-1);
    if (last && (cell.ch === " " || (cell.tone === last.tone && cell.dim === last.dim))) {
      last.text += cell.ch;
    } else {
      runs.push({ text: cell.ch, tone: cell.tone, dim: cell.dim });
    }
  }
  return runs;
}
