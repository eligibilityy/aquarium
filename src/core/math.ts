/** Modulo that stays positive: mod(-1, 6) === 5. */
export const mod = (n: number, m: number) => ((n % m) + m) % m;

export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
