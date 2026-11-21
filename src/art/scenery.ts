// Drawing rules are in the README; options are documented on DecorationSpec.
// Keep decorations 15 columns or less so the floor doesn't get crowded.
import { defineDecoration, type Decoration } from "../core/catalog.js";

const CASTLE = String.raw`
         |>
   |>   /^\    |>
  /^\  /   \  /^\
  |o|__|[ ]|__|o|
  | |  | _ |  | |
  |_|__|| ||__|_|
`;

const castle = defineDecoration({
  name: "castle",
  frames: [CASTLE, CASTLE.replaceAll("|>", "|~")],
  colors: {
    default: "castle",
    ">": "flag",
    "~": "flag",
    "/": "roof",
    "\\": "roof",
    "^": "roof",
    "[": "gold",
    "]": "gold",
    o: "gold",
  },
  priority: 10,
  vents: [{ at: [7, 2], rate: 0.25 }], // the keep's window
});

const CHEST_OPEN = String.raw`
   ______
  |______|
  .$*o$*.
 |==()==|
 |__||__|
`;

const chest = defineDecoration({
  name: "treasure chest",
  frames: [
    String.raw`
       ______
      |==()==|
      |__||__|
    `,
  ],
  colors: {
    default: "wood",
    "=": "iron",
    "(": "gold",
    ")": "gold",
    $: "gold",
    "*": "gold",
    o: "gold",
  },
  frameRate: 3,
  priority: 8,
  burst: {
    frames: [CHEST_OPEN, CHEST_OPEN.replace("$*o$*", "*$o*$")],
    every: [12, 30],
    lasts: 3,
    vents: [
      { at: [2, 2], rate: 3 },
      { at: [5, 2], rate: 3 },
    ],
  },
});

const shipwreck = defineDecoration({
  name: "shipwreck",
  frames: [
    String.raw`
        \
         \ |\
      ____\|_\__
      \ o  o  o/
       \__/\__/
    `,
  ],
  colors: { default: "wood", o: "gold" },
  priority: 7,
  vents: [{ at: [5, 1], rate: 0.15 }],
});

const brainCoral = defineDecoration({
  name: "brain coral",
  frames: [
    String.raw`
       .-~~~-.
      (~ ~~~ ~)
       '-...-'
    `,
  ],
  colors: { default: "coral", "~": "pink" },
  priority: 6,
  repeatable: true,
});

const branchCoral = defineDecoration({
  name: "branch coral",
  frames: [
    String.raw`
      o   o
      \\ //o
       \Y//
        \|
    `,
  ],
  colors: { default: "coral", o: "pink" },
  seeThrough: true,
  priority: 6,
  repeatable: true,
});

const clam = defineDecoration({
  name: "clam",
  frames: [
    String.raw`
       .-'''-.
      (_.-'-._)
    `,
  ],
  colors: { default: "lavender", O: "plain" },
  priority: 5,
  burst: {
    frames: [
      String.raw`
         .-'''-.
        (_.-'-._)
         \     /
        (__(O)__)
      `,
    ],
    every: [15, 40],
    lasts: 3,
    vents: [{ at: [4, 1], rate: 2 }],
  },
});

const rocks = defineDecoration({
  name: "rocks",
  frames: [
    String.raw`
         .--.
       _(  . )_
      (__.___._)
    `,
  ],
  colors: { default: "rock", ".": "iron" },
  priority: 5,
  repeatable: true,
});

const anchor = defineDecoration({
  name: "anchor",
  frames: [
    String.raw`
        O
       _|_
        |
      \_|_/
    `,
  ],
  colors: { default: "iron" },
  seeThrough: true,
  priority: 4,
});

export const DECORATIONS: readonly Decoration[] = [
  castle,
  chest,
  shipwreck,
  brainCoral,
  branchCoral,
  clam,
  rocks,
  anchor,
];
