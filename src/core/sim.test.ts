import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fishTop, swimRows } from "./fish.js";
import { renderWorld } from "./render.js";
import {
  addFish,
  createWorld,
  fishCapacity,
  removeFish,
  resizeWorld,
  stayingFish,
  step,
} from "./sim.js";
import type { World } from "./world.js";

const FRAME = 1 / 12;

function run(world: World, seconds: number, check?: () => void) {
  for (let t = 0; t < seconds; t += FRAME) {
    step(world, FRAME);
    check?.();
  }
}

function assertFishInBounds(world: World) {
  for (const fish of world.fish) {
    const [top, bottom] = swimRows(world, fish.species);
    const row = fishTop(world, fish);
    assert.ok(row >= top && row <= bottom, `${fish.species.name} row ${row}`);
    if (fish.mode === "swimming") {
      assert.ok(fish.x >= 0 && fish.x <= world.width - fish.species.width);
    }
  }
}

describe("simulation", () => {
  it("plays out the same way for the same seed", () => {
    const snapshot = (world: World) =>
      world.fish.map((f) => [f.species.name, f.x.toFixed(3), f.y.toFixed(3)]);
    const a = createWorld({ seed: 42, width: 100, height: 30 });
    const b = createWorld({ seed: 42, width: 100, height: 30 });
    run(a, 30);
    run(b, 30);
    assert.deepEqual(snapshot(a), snapshot(b));
  });

  it("keeps fish inside the water", () => {
    const world = createWorld({ seed: 3, width: 100, height: 30 });
    run(world, 120, () => assertFishInBounds(world));
  });

  it("replaces fish that leave, so the tank stays near its target", () => {
    const world = createWorld({ seed: 5, width: 120, height: 30, fish: 6 });
    const firstIds = new Set(world.fish.map((f) => f.id));
    run(world, 300);
    assert.ok(world.fish.some((f) => !firstIds.has(f.id)), "new fish arrived");
    assert.ok(stayingFish(world).length >= world.targetFish - 2);
  });

  it("lets a fish go when asked", () => {
    const world = createWorld({ seed: 8, width: 100, height: 30, fish: 5 });
    removeFish(world);
    assert.equal(world.targetFish, 4);
    assert.equal(stayingFish(world).length, 4);
  });

  it("stops adding fish at the tank's capacity", () => {
    const world = createWorld({ seed: 1, width: 80, height: 20 });
    while (addFish(world));
    assert.equal(world.targetFish, fishCapacity(world));
  });

  it("keeps everything in bounds after a resize", () => {
    const world = createWorld({ seed: 9, width: 150, height: 40 });
    run(world, 10);
    resizeWorld(world, 40, 12);
    assertFishInBounds(world);
    assert.ok(world.targetFish <= fishCapacity(world));
    run(world, 30, () => assertFishInBounds(world));
  });

  it("renders a grid the size of the tank", () => {
    for (const [width, height] of [[30, 10], [80, 24], [250, 70]]) {
      const world = createWorld({ seed: 2, width, height });
      run(world, 5);
      const grid = renderWorld(world);
      assert.equal(grid.rows.length, height);
      assert.ok(grid.rows.every((row) => row.length === width));
    }
  });
});
