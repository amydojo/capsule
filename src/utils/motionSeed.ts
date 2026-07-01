export type PressureTraceParams = {
  contourDensity: number;
  ringRadius: number;
  drift: number;
  opacity: number;
  lineSpacing: number;
  shadowOffset: number;
  glowIntensity: number;
  hoverAmount: number;
  shadowDuration: number;
  traceDuration: number;
  hoverDuration: number;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => `${key}:${stableStringify(entry)}`)
    .join(",")}}`;
};

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createMotionSeed = (input: unknown): string => {
  const normalized = stableStringify(input || "capsule-artifact");
  return `motion-${hashString(normalized).toString(16).padStart(8, "0")}`;
};

export const seededNumber = (seed: string, key: string): number => hashString(`${seed}:${key}`) / 0xffffffff;

const range = (seed: string, key: string, min: number, max: number) => min + seededNumber(seed, key) * (max - min);

export const getPressureTraceParams = (seed: string): PressureTraceParams => ({
  contourDensity: Math.round(range(seed, "contour-density", 5, 9)),
  ringRadius: range(seed, "ring-radius", 0.82, 1.12),
  drift: range(seed, "drift", -14, 14),
  opacity: range(seed, "opacity", 0.2, 0.42),
  lineSpacing: range(seed, "line-spacing", 18, 32),
  shadowOffset: range(seed, "shadow-offset", 10, 22),
  glowIntensity: range(seed, "glow-intensity", 0.22, 0.48),
  hoverAmount: range(seed, "hover-amount", 1, 3),
  shadowDuration: range(seed, "shadow-duration", 10, 16),
  traceDuration: range(seed, "trace-duration", 24, 45),
  hoverDuration: range(seed, "hover-duration", 12, 20),
});
