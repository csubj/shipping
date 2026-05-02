import { describe, expect, it } from "vitest";
import {
  computePropagationProposals,
  propagationTriggerSign,
} from "@/domain/propagation";
import { defaultSettings, type AppState, type Relationship } from "@/types/schema";

function makeState(): AppState {
  const settings = defaultSettings();
  return {
    schemaVersion: 1,
    meta: { campaignName: "test", lastSavedAt: new Date().toISOString() },
    settings,
    factions: {
      "fac-a": { id: "fac-a", name: "Allies", description: "", color: "#fff" },
      "fac-b": { id: "fac-b", name: "Rivals", description: "", color: "#000" },
    },
    factionEdges: {
      "fac-a::fac-b": { id: "fac-a::fac-b", a: "fac-a", b: "fac-b", affinity: -2 },
    },
    characters: {
      a1: { id: "a1", kind: "pc", firstName: "A", lastName: "One", class: "F", notes: "", factionIds: ["fac-a"] },
      a2: { id: "a2", kind: "npc", firstName: "A", lastName: "Two", location: "", notes: "", factionIds: ["fac-a"] },
      b1: { id: "b1", kind: "npc", firstName: "B", lastName: "One", location: "", notes: "", factionIds: ["fac-b"] },
      lone: { id: "lone", kind: "npc", firstName: "Lone", lastName: "Wolf", location: "", notes: "", factionIds: [] },
    },
    relationships: {},
  };
}

describe("propagationTriggerSign", () => {
  it("triggers on positive crossing of Friends threshold (10)", () => {
    const s = makeState();
    expect(propagationTriggerSign(9, 10, s)).toBe(1);
    expect(propagationTriggerSign(10, 11, s)).toBe(0);
    expect(propagationTriggerSign(0, 5, s)).toBe(0);
  });
  it("triggers on negative crossing", () => {
    const s = makeState();
    expect(propagationTriggerSign(-9, -10, s)).toBe(-1);
  });
});

describe("computePropagationProposals", () => {
  it("produces negative deltas for rival-faction characters when befriended", () => {
    const s = makeState();
    const rel: Relationship = { id: "a1::a2", a: "a1", b: "a2", value: 10, notes: "", history: [] };
    const proposals = computePropagationProposals(rel, 10, s, 1);
    // a1 in fac-a + a2 in fac-a; the linked faction is fac-b (affinity -2).
    // For each (a1, a2), the "other" gets nudged toward b1 with delta = 1 * -2 * 2 = -4.
    expect(proposals.length).toBeGreaterThan(0);
    for (const p of proposals) {
      expect(p.toCharacterId).toBe("b1");
      expect(p.delta).toBe(-4);
    }
  });
  it("never produces proposals for lone (no-faction) characters", () => {
    const s = makeState();
    const rel: Relationship = { id: "a1::lone", a: "a1", b: "lone", value: 10, notes: "", history: [] };
    const proposals = computePropagationProposals(rel, 10, s, 1);
    // a1 is in fac-a, lone has none. The "other" for a1's faction iteration is `lone`,
    // which is fine, but there are no characters in fac-b to propagate to via lone.
    // a1's other = lone — propose against b1 with delta -4.
    // lone has no factions so no proposals from its side.
    expect(proposals.every((p) => p.toCharacterId !== "lone")).toBe(true);
  });
});
