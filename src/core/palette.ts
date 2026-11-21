/** `null` is the terminal's own text color, which reads on dark and light themes. */
export const PALETTE = {
  plain: null,
  eye: null,

  surface: "#6699ff",
  foam: "#c9dcff",
  bubble: "#6bdfff",

  sand: "#d9c97c",
  rock: "#6e6e6e",
  castle: "#7b7b7b",
  roof: "#d9826b",
  iron: "#8b8d98",
  flag: "#ff7ab2",
  coral: "#ff8170",
  weed: "#78c2b3",
  kelp: "#30a46c",
  wood: "#b07d56",
  gold: "#ffd166",

  orange: "#ffa14f",
  pink: "#ff7ab2",
  lavender: "#dabaff",
  mint: "#acf2e4",
  yellow: "#d9c97c",
  blue: "#6699ff",
} as const satisfies Record<string, `#${string}` | null>;

export type Tone = keyof typeof PALETTE;
