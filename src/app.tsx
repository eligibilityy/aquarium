import { Box, Text, useApp, useInput, useStdin, useWindowSize } from "ink";
import { useEffect, useRef, useState } from "react";
import { Tank } from "./components/Tank.js";
import { renderWorld } from "./core/render.js";
import { randomSeed } from "./core/rng.js";
import { addFish, createWorld, removeFish, resizeWorld, step } from "./core/sim.js";
import { MIN_HEIGHT, MIN_WIDTH, type World } from "./core/world.js";

const STATUS_ROWS = 1;
const MESSAGE_MS = 2500;

type AppProps = {
  seed: number;
  fps: number;
  fish?: number;
  height?: number;
  color: boolean;
};

export function App({ seed, fps, fish, height: fixedHeight, color }: AppProps) {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();
  const { columns: width, rows } = useWindowSize();
  const height = Math.min(fixedHeight ?? Infinity, rows - STATUS_ROWS);

  // The world mutates in place every frame, so it lives in a ref and a
  // counter triggers the re-render.
  const worldRef = useRef<World | null>(null);
  worldRef.current ??= createWorld({ seed, width, height, fish });
  const world = worldRef.current;
  resizeWorld(world, width, height);

  const [paused, setPaused] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [, setFrame] = useState(0);
  const redraw = () => setFrame((frame) => frame + 1);

  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      step(world, (now - last) / 1000);
      last = now;
      redraw();
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [world, fps, paused]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), MESSAGE_MS);
    return () => clearTimeout(id);
  }, [message]);

  useInput(
    (input, key) => {
      if (input === "q" || key.escape) return exit();
      if (input === "p") setPaused((p) => !p);
      if (input === "?") setShowHints((show) => !show);
      if (input === "+" || input === "=" || input === " ") {
        if (!addFish(world)) setMessage("Tank's full. Let some go with -");
      }
      if (input === "-" || input === "_") {
        if (!removeFish(world)) setMessage("The tank is already empty.");
      }
      if (input === "r") {
        worldRef.current = createWorld({
          seed: randomSeed(),
          width,
          height,
          fish: world.targetFish,
        });
      }
      redraw();
    },
    { isActive: isRawModeSupported },
  );

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    return (
      <Text>
        The tank needs a terminal of at least {MIN_WIDTH}×{MIN_HEIGHT + STATUS_ROWS}.
        Make it bigger, or press q to quit.
      </Text>
    );
  }

  const status = [
    `${world.targetFish} fish`,
    paused && "paused",
    width >= 90 && `seed ${world.seed}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const hints =
    width >= 70 ? "+/- fish · r new tank · p pause · q quit" : "+/- · r · p · q";

  return (
    <Box flexDirection="column">
      <Tank grid={renderWorld(world)} color={color} />
      <Box width={width} justifyContent="space-between">
        <Text dimColor>{message ?? status}</Text>
        {showHints && <Text dimColor>{hints}</Text>}
      </Box>
    </Box>
  );
}
