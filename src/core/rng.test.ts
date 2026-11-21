import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRng, deriveRng, hashSeed } from "./rng.js";

const take = (seed: number, count = 5) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => rng.next());
};

describe("rng", () => {
  it("repeats the same sequence for the same seed", () => {
    assert.deepEqual(take(42), take(42));
    assert.notDeepEqual(take(42), take(43));
  });

  it("keeps int() within its bounds, both ends included", () => {
    const rng = createRng(1);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(rng.int(1, 3));
    assert.deepEqual([...seen].sort(), [1, 2, 3]);
  });

  it("gives independent streams for different labels", () => {
    assert.notEqual(deriveRng(7, "layout").next(), deriveRng(7, "sim").next());
  });

  it("hashes words into stable seeds", () => {
    assert.equal(hashSeed("nemo"), hashSeed("nemo"));
    assert.notEqual(hashSeed("nemo"), hashSeed("dory"));
  });
});
