// Drawing rules are in the README; options are documented on FishSpec.
// A fish can be at most a third of the tank's width and half its depth.
import { defineFish, type Species } from "../core/catalog.js";

const minnow = defineFish({
  name: "minnow",
  frames: [String.raw`><>`, String.raw`}<>`],
  schemes: [{ body: "mint" }, { body: "blue" }, { body: "yellow" }],
  speed: [4, 6],
  depth: [0, 1],
  weight: 3,
});

const dart = defineFish({
  name: "dart",
  frames: [String.raw`><(((o>`, String.raw`}<(((o>`],
  colors: { "(": "accent" },
  schemes: [
    { body: "pink", accent: "orange" },
    { body: "blue", accent: "mint" },
    { body: "orange", accent: "yellow" },
  ],
  speed: [2.5, 4],
  depth: [0.1, 0.9],
  weight: 2.5,
});

const puffer = defineFish({
  name: "puffer",
  frames: [
    String.raw`
        .\|/.
      >(  ( o)
        '/|\'
    `,
    String.raw`
        ./|\.
      }(  ( o)
        '\|/'
    `,
  ],
  colors: { "\\": "accent", "/": "accent", "|": "accent" },
  schemes: [
    { body: "yellow", accent: "orange" },
    { body: "mint", accent: "blue" },
  ],
  speed: [1.5, 2.5],
  depth: [0.2, 0.8],
  bob: 0.5,
  weight: 2,
});

const clownfish = defineFish({
  name: "clownfish",
  frames: [
    String.raw`
         ,--.__
      \_/ |  | 'o.
      / \_|__|__.'
    `,
    String.raw`
         ,--.__
      __/ |  | 'o.
      \_\_|__|__.'
    `,
  ],
  colors: { "|": "plain" },
  schemes: [{ body: "orange" }, { body: "coral" }],
  speed: [2, 3.5],
  depth: [0.3, 1],
  weight: 2,
});

const butterflyfish = defineFish({
  name: "butterflyfish",
  frames: [
    String.raw`
         .---._
      \/ | |  o'.
      /\ | |  _.'
         '---'
    `,
    String.raw`
         .---._
      -/ | |  o'.
      -\ | |  _.'
         '---'
    `,
  ],
  colors: { "|": "accent" },
  schemes: [
    { body: "yellow", accent: "plain" },
    { body: "lavender", accent: "pink" },
  ],
  speed: [1.5, 2.5],
  depth: [0.2, 0.9],
  weight: 1.5,
});

const angelfish = defineFish({
  name: "angelfish",
  frames: [
    String.raw`
           /|
      \   / |'.
       >-(  ((  o>
      /   \ |.'
           \|
    `,
    String.raw`
           /|
       \  / |'.
       >-(  ((  o>
       /  \ |.'
           \|
    `,
  ],
  colors: { "|": "accent" },
  schemes: [
    { body: "yellow", accent: "plain" },
    { body: "lavender", accent: "blue" },
    { body: "orange", accent: "plain" },
  ],
  speed: [1.2, 2],
  depth: [0.2, 0.8],
  weight: 1.2,
});

const jellyfish = defineFish({
  name: "jellyfish",
  frames: [
    String.raw`
       .-'-.
      (_.-._)
       ( ) (
        ) ( )
       ( ) (
    `,
    String.raw`
       .-'-.
      (_.-._)
       ) ( )
        ( ) (
       ) ( )
    `,
  ],
  colors: { "(": "accent", ")": "accent" },
  schemes: [
    { body: "lavender", accent: "pink" },
    { body: "pink", accent: "lavender" },
    { body: "mint", accent: "blue" },
  ],
  speed: [0.3, 0.7],
  depth: [0.05, 0.6],
  bob: 1.2,
  weight: 1,
  seeThrough: true,
});

const barracuda = defineFish({
  name: "barracuda",
  frames: [
    String.raw`
      \    __/|______
       >=-'  | | |  o '-._
      /  '-.|_|_|____.vvv'
    `,
    String.raw`
       \   __/|______
       >=-'  | | |  o '-._
       / '-.|_|_|____.vvv'
    `,
  ],
  colors: { "|": "accent", v: "plain" },
  schemes: [
    { body: "iron", accent: "blue" },
    { body: "mint", accent: "iron" },
  ],
  speed: [2, 3],
  depth: [0.3, 1],
  weight: 1,
});

const turtle = defineFish({
  name: "sea turtle",
  frames: [
    String.raw`
          ______   __
        .'/\__/\'./ o)
       '-\/__\/__.--'
          /_/  \_\
    `,
    String.raw`
          ______   __
        .'/\__/\'./ o)
       '-\/__\/__.--'
           \_\ /_/
    `,
  ],
  colors: { "/": "accent", "\\": "accent" },
  schemes: [{ body: "kelp", accent: "yellow" }],
  speed: [1, 1.6],
  depth: [0.1, 0.7],
  weight: 0.7,
});

const shark = defineFish({
  name: "shark",
  frames: [
    String.raw`
               /|
      \       / |
       \.----'  '----._
       /   )))     o  _>
      /'--.______.--'''
              \/
    `,
    String.raw`
               /|
       \      / |
       |.----'  '----._
       |   )))     o  _>
       /--.______.--'''
              \/
    `,
  ],
  colors: { ")": "accent", ">": "plain" },
  schemes: [{ body: "iron", accent: "plain" }],
  speed: [2.5, 3.5],
  depth: [0.2, 0.8],
  weight: 0.5,
});

const whale = defineFish({
  name: "whale",
  facing: "left",
  // The spout puffs between the two frames.
  frames: [
    String.raw`
           .
          ":"
        ___:____     |"\/"|
      ,'        \`.    \  /
      |  O        \___/  |
    `,
    String.raw`
          . .
          ":"
        ___:____     |"\/"|
      ,'        \`.    \  /
      |  O        \___/  |
    `,
  ],
  colors: { O: "eye", ":": "foam" },
  schemes: [{ body: "blue" }],
  speed: [1, 1.5],
  depth: [0, 0.15],
  bob: 0.2,
  weight: 0.3,
});

export const SPECIES: readonly Species[] = [
  minnow,
  dart,
  puffer,
  clownfish,
  butterflyfish,
  angelfish,
  jellyfish,
  barracuda,
  turtle,
  shark,
  whale,
];
