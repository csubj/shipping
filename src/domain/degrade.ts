import type { Relationship } from "@/types/schema";

export type DegradeDelta = {
  relationshipId: string;
  delta: number;
  valueBefore: number;
  valueAfter: number;
};

/**
 * Compute degrade deltas: every non-zero relationship moves toward zero by
 * `amount`, but never crosses zero.
 */
export function computeDegradeDeltas(
  relationships: Record<string, Relationship>,
  amount: number,
): DegradeDelta[] {
  const out: DegradeDelta[] = [];
  for (const rel of Object.values(relationships)) {
    if (rel.value === 0) continue;
    const sign = rel.value > 0 ? 1 : -1;
    const magnitude = Math.min(Math.abs(rel.value), amount);
    const delta = -sign * magnitude;
    out.push({
      relationshipId: rel.id,
      delta,
      valueBefore: rel.value,
      valueAfter: rel.value + delta,
    });
  }
  return out;
}
