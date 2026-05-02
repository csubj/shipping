import { describe, expect, it } from "vitest";
import { computeDegradeDeltas } from "@/domain/degrade";
import type { Relationship } from "@/types/schema";

const r = (id: string, value: number): Relationship => ({
  id,
  a: "x",
  b: "y",
  value,
  notes: "",
  history: [],
});

describe("computeDegradeDeltas", () => {
  it("never crosses zero", () => {
    const out = computeDegradeDeltas({ p: r("p", 3), n: r("n", -3) }, 5);
    const map = Object.fromEntries(out.map((d) => [d.relationshipId, d]));
    expect(map.p.valueAfter).toBe(0);
    expect(map.n.valueAfter).toBe(0);
  });
  it("ignores zero-valued relationships", () => {
    const out = computeDegradeDeltas({ z: r("z", 0) }, 1);
    expect(out).toHaveLength(0);
  });
  it("decrements by amount when |value| > amount", () => {
    const out = computeDegradeDeltas({ p: r("p", 10), n: r("n", -10) }, 3);
    const map = Object.fromEntries(out.map((d) => [d.relationshipId, d]));
    expect(map.p.delta).toBe(-3);
    expect(map.p.valueAfter).toBe(7);
    expect(map.n.delta).toBe(3);
    expect(map.n.valueAfter).toBe(-7);
  });
});
