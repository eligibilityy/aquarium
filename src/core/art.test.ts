import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defineArt, defineFrames, mirror, type Sprite } from "./art.js";

/** "·" marks transparent cells. */
const text = (sprite: Sprite) =>
  sprite.cells.map((row) => row.map((cell) => cell?.ch ?? "·").join(""));

describe("defineArt", () => {
  it("strips shared indentation and blank first/last lines", () => {
    const sprite = defineArt(`
          ><>
         ><(((o>
      `);
    assert.deepEqual(text(sprite), ["·><>···", "><(((o>"]);
  });

  it("fills gaps inside a line, unless the art is see-through", () => {
    assert.deepEqual(text(defineArt("a  b")), ["a  b"]);
    assert.deepEqual(text(defineArt("a  b", { seeThrough: true })), ["a··b"]);
  });

  it("colors characters by name, with a default", () => {
    const sprite = defineArt("|>", { colors: { default: "castle", ">": "flag" } });
    assert.deepEqual(
      sprite.cells[0].map((cell) => cell?.paint),
      ["castle", "flag"],
    );
  });

  it("turns \\` into a backtick", () => {
    assert.deepEqual(text(defineArt(String.raw`,'  \`.`)), [",'  `."]);
  });

  it("rejects tabs", () => {
    assert.throws(() => defineArt("\t><>"), /tab/);
  });
});

describe("defineFrames", () => {
  it("keeps frames lined up when one is indented further", () => {
    const [first, second] = defineFrames([
      String.raw`
        \/
        /\
      `,
      String.raw`
         |
         |
      `,
    ]);
    assert.deepEqual(text(first), ["\\/", "/\\"]);
    assert.deepEqual(text(second), ["·|", "·|"]);
  });

  it("pads frames to one size, anchored at the bottom when asked", () => {
    const [short, tall] = defineFrames(["a", "b\nc"], { anchor: "bottom" });
    assert.deepEqual(text(short), ["·", "a"]);
    assert.deepEqual(text(tall), ["b", "c"]);
  });
});

describe("mirror", () => {
  const fish = defineArt("}<(o", { colors: { "(": "coral" } });

  it("flips characters and keeps their colors", () => {
    const flipped = mirror(fish);
    assert.deepEqual(text(flipped), ["o)>{"]);
    assert.equal(flipped.cells[0][1]?.paint, "coral");
  });

  it("round-trips", () => {
    assert.deepEqual(mirror(mirror(fish)), fish);
  });
});
