import {
  type Band,
  DEFAULT_NEGATIVE_BAND_COLORS,
  DEFAULT_NEGATIVE_BAND_NAMES,
  STRANGERS_BAND,
} from "@/types/schema";

export type ResolvedBand = {
  id: string;
  name: string;
  color: string;
  sign: -1 | 0 | 1;
};

/**
 * Resolve a numeric relationship value to a band, mirroring the user's
 * configured positive bands across zero.
 */
export function valueToBand(value: number, bands: Band[]): ResolvedBand {
  if (value === 0) {
    return { id: STRANGERS_BAND.id, name: STRANGERS_BAND.name, color: STRANGERS_BAND.color, sign: 0 };
  }
  // Sort positive bands ascending by threshold so larger thresholds win.
  const sorted = [...bands].sort((a, b) => a.threshold - b.threshold);
  const sign: 1 | -1 = value > 0 ? 1 : -1;
  const abs = Math.abs(value);
  let chosen: Band | null = null;
  for (const band of sorted) {
    if (abs >= band.threshold) chosen = band;
  }
  if (!chosen) {
    return { id: STRANGERS_BAND.id, name: STRANGERS_BAND.name, color: STRANGERS_BAND.color, sign };
  }
  if (sign > 0) {
    return { id: chosen.id, name: chosen.name, color: chosen.color, sign };
  }
  // Negative mirror
  const negName = DEFAULT_NEGATIVE_BAND_NAMES[chosen.id] ?? `Anti-${chosen.name}`;
  const negColor = DEFAULT_NEGATIVE_BAND_COLORS[chosen.id] ?? chosen.color;
  return { id: `neg-${chosen.id}`, name: negName, color: negColor, sign };
}

export function bandLowerBound(name: string, bands: Band[]): number | null {
  const found = bands.find((b) => b.name === name);
  return found ? found.threshold : null;
}
