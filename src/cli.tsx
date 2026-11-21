#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { render, renderToString } from "ink";
import { App } from "./app.js";
import { Tank } from "./components/Tank.js";
import { renderWorld } from "./core/render.js";
import { hashSeed, randomSeed } from "./core/rng.js";
import { createWorld } from "./core/sim.js";
import { MIN_HEIGHT } from "./core/world.js";

const HELP = `
an aquarium for your terminal.

Usage
  aquarium [options]

Options
  -f, --fish <n>      fish to start with (default: based on the tank size)
  -s, --seed <seed>   rebuild a specific tank; any number or word
      --fps <n>       frames per second, 1-30 (default 12)
      --height <n>    tank height in rows (default: fill the terminal)
      --no-color      plain text (NO_COLOR is respected too)
  -h, --help          show this help
  -v, --version       show the version

Keys
  + or space   add a fish         -   let one go
  r            new tank           p   pause
  ?            show keys          q   quit (or esc)

When the output isn't a terminal (aquarium > tank.txt), a single still
frame is printed instead.
`;

class UsageError extends Error {}

function integer(name: string, value: string | undefined, min: number, max: number) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new UsageError(`--${name} must be a whole number from ${min} to ${max}.`);
  }
  return n;
}

const parseSeed = (value: string) =>
  /^\d+$/.test(value) ? Number(value) >>> 0 : hashSeed(value);

function version(): string {
  // One level up from both src/ and dist/.
  const file = new URL("../package.json", import.meta.url);
  return JSON.parse(readFileSync(file, "utf8")).version;
}

function main() {
  const { values } = parseArgs({
    options: {
      fish: { type: "string", short: "f" },
      seed: { type: "string", short: "s" },
      fps: { type: "string" },
      height: { type: "string" },
      "no-color": { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });

  if (values.help) return console.log(HELP.trim());
  if (values.version) return console.log(version());

  const seed = values.seed === undefined ? randomSeed() : parseSeed(values.seed);
  const fish = integer("fish", values.fish, 0, 100);
  const fps = integer("fps", values.fps, 1, 30) ?? 12;
  const height = integer("height", values.height, MIN_HEIGHT, 500);
  const color = !values["no-color"] && !process.env.NO_COLOR;

  if (!process.stdout.isTTY) {
    const width = process.stdout.columns || Number(process.env.COLUMNS) || 80;
    const world = createWorld({ seed, width, height: height ?? 16, fish });
    return console.log(renderToString(<Tank grid={renderWorld(world)} color={color} />, { columns: width }));
  }

  render(<App seed={seed} fps={fps} fish={fish} height={height} color={color} />, {
    alternateScreen: true,
    incrementalRendering: true,
  });
}

try {
  main();
} catch (error) {
  const isUsage =
    error instanceof UsageError ||
    (error instanceof TypeError && "code" in error && String(error.code).startsWith("ERR_PARSE_ARGS"));
  if (!isUsage) throw error;
  console.error(`aquarium: ${error.message}\nRun "aquarium --help" to see the options.`);
  process.exitCode = 2;
}
