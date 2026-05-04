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
  it("reaches exactly zero (caller should delete) when amount >= |value|", () => {
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
    const out = computeDegradeDeltas({ p: r("p", 8), n: r("n", -8) }, 3);
    const map = Object.fromEntries(out.map((d) => [d.relationshipId, d]));
    expect(map.p.delta).toBe(-3);
    expect(map.p.valueAfter).toBe(5);
    expect(map.n.delta).toBe(3);
    expect(map.n.valueAfter).toBe(-5);
  });
  it("ignores relationships with |value| >= 10 (entrenched)", () => {
    const out = computeDegradeDeltas(
      { a: r("a", 10), b: r("b", -10), c: r("c", 15), d: r("d", -20) },
      5,
    );
    expect(out).toHaveLength(0);
  });
  it("degrades values just inside the boundary (|value| < 10)", () => {
    const out = computeDegradeDeltas({ p: r("p", 9), n: r("n", -9) }, 2);
    const map = Object.fromEntries(out.map((d) => [d.relationshipId, d]));
    expect(map.p.valueAfter).toBe(7);
    expect(map.n.valueAfter).toBe(-7);
  });
});
