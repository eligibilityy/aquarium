import chalk from "chalk";
import { Text } from "ink";
import { toRuns, type Grid } from "../core/grid.js";
import { PALETTE } from "../core/palette.js";

// One pre-colored string is far cheaper for Ink to lay out than a <Text> per colored run.
export function Tank({ grid, color = true }: { grid: Grid; color?: boolean }) {
  const lines = grid.rows.map((row) =>
    toRuns(row)
      .map(({ text, tone, dim }) => {
        const hex = color && tone ? PALETTE[tone] : null;
        const tinted = hex ? chalk.hex(hex)(text) : text;
        return dim ? chalk.dim(tinted) : tinted;
      })
      .join(""),
  );
  return <Text>{lines.join("\n")}</Text>;
}
