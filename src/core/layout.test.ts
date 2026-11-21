import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { layoutScenery } from "./layout.js";

const WIDTHS = Array.from({ length: 40 }, (_, i) => 30 + i * 7);
const SEEDS = [1, 2, 3, 42, 1234];

describe("layoutScenery", () => {
  it("never overlaps decorations or pushes them out of the tank", () => {
    for (const width of WIDTHS) {
      for (const seed of SEEDS) {
        const spans = layoutScenery(seed, width).decorations.map(
          ({ decoration, x }) => [x, x + decoration.width] as const,
        );
        spans.forEach(([start, end], i) => {
          assert.ok(start >= 0 && end <= width, `inside at width ${width}`);
          const next = spans[i + 1];
          if (next) assert.ok(end < next[0], `gap at width ${width}, seed ${seed}`);
        });
      }
    }
  });

  it("roots plants clear of decorations", () => {
    for (const width of WIDTHS) {
      const { decorations, plants } = layoutScenery(1, width);
      for (const plant of plants) {
        assert.ok(plant.x > 0 && plant.x < width - 1);
        for (const { decoration, x } of decorations) {
          // Grass is three columns wide, so the columns beside the root count too.
          assert.ok(plant.x + 1 < x || plant.x - 1 >= x + decoration.width);
        }
      }
    }
  });

  it("is the same every time for the same seed and width", () => {
    assert.deepEqual(layoutScenery(7, 120), layoutScenery(7, 120));
  });

  it("gives the castle a spot once there's room", () => {
    const names = layoutScenery(1, 80).decorations.map((d) => d.decoration.name);
    assert.ok(names.includes("castle"));
  });

  it("makes one sand character per column", () => {
    assert.equal(layoutScenery(1, 97).sand.length, 97);
  });
});
