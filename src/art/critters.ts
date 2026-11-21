// Drawing rules are in the README; options are documented on CritterSpec.
// Each critter appears once, if the tank is wide enough for it.
import { defineCritter, type CritterKind } from "../core/catalog.js";

const CRAB = String.raw`
  (\_   _/)
    \(oo)/
    //''\\
`;
const CRAB_STEP = CRAB.replace(String.raw`//''\\`, String.raw`\\''//`);
const CRAB_SNAP = CRAB.replace(String.raw`(\_   _/)`, String.raw`(|_   _|)`);

const crab = defineCritter({
  name: "crab",
  walk: [CRAB, CRAB_STEP],
  // Repeat drawings to set the rhythm: pause, snap, pause, snap, long pause.
  rest: [CRAB, CRAB, CRAB_SNAP, CRAB, CRAB_SNAP, CRAB, CRAB, CRAB],
  colors: { "(": "accent", ")": "accent", _: "accent", "|": "accent" },
  schemes: [
    { body: "orange", accent: "coral" },
    { body: "coral", accent: "orange" },
  ],
  speed: [2, 3],
  walkFor: [1.5, 4],
  restFor: [1.5, 4],
  restFrameRate: 4,
  minWidth: 50,
  turns: false, // crabs walk sideways
});

const snail = defineCritter({
  name: "snail",
  walk: [
    String.raw`
        .-.   o o
       ( @ )  |/
        '-'___/_
    `,
    String.raw`
        .-.    o o
       ( @ )   |/
        '-'____/_
    `,
  ],
  rest: [
    String.raw`
        .-.
       ( @ )
        '-'
    `,
  ],
  colors: { "@": "accent", "|": "plain", "/": "plain" },
  schemes: [
    { body: "yellow", accent: "orange" },
    { body: "lavender", accent: "pink" },
  ],
  speed: [0.25, 0.45],
  walkFor: [6, 15],
  restFor: [3, 8],
  stride: 0.5,
  minWidth: 40,
});

export const CRITTERS: readonly CritterKind[] = [crab, snail];
