import type { AppState, Character, Relationship } from "@/types/schema";

export function charactersByKind(state: AppState, kind: "pc" | "npc" | "all"): Character[] {
  const all = Object.values(state.characters);
  if (kind === "all") return all;
  return all.filter((c) => c.kind === kind);
}

export function characterFullName(c: Character): string {
  const name = `${c.firstName} ${c.lastName}`.trim();
  return name || (c.kind === "pc" ? "Unnamed PC" : "Unnamed NPC");
}

export function relationshipsForCharacter(
  state: AppState,
  characterId: string,
): Relationship[] {
  return Object.values(state.relationships).filter(
    (r) => r.a === characterId || r.b === characterId,
  );
}

export function otherInRelationship(rel: Relationship, characterId: string): string {
  return rel.a === characterId ? rel.b : rel.a;
}

export function factionMembers(state: AppState, factionId: string): Character[] {
  return Object.values(state.characters).filter((c) => c.factionIds.includes(factionId));
}

/**
 * Returns the set of character IDs that appear in any relationship whose
 * history contains at least one entry with `at` inside [from, to] (inclusive).
 * If both from and to are null, returns null (no filter active).
 */
export function charactersActiveInRange(
  state: AppState,
  from: Date | null,
  to: Date | null,
): Set<string> | null {
  if (!from && !to) return null;
  const activeIds = new Set<string>();
  const fromMs = from ? from.getTime() : -Infinity;
  const toMs = to ? to.getTime() : Infinity;
  for (const rel of Object.values(state.relationships)) {
    const inRange = rel.history.some((adj) => {
      const t = new Date(adj.at).getTime();
      return t >= fromMs && t <= toMs;
    });
    if (inRange) {
      activeIds.add(rel.a);
      activeIds.add(rel.b);
    }
  }
  return activeIds;
}

export function recentAdjustments(state: AppState, characterId: string, limit = 5) {
  const rels = relationshipsForCharacter(state, characterId);
  const adjustments: Array<{
    relId: string;
    other: string;
    at: string;
    delta: number;
    reason: string;
  }> = [];
  for (const rel of rels) {
    const other = otherInRelationship(rel, characterId);
    for (const adj of rel.history) {
      adjustments.push({
        relId: rel.id,
        other,
        at: adj.at,
        delta: adj.delta,
        reason: adj.reason,
      });
    }
  }
  adjustments.sort((a, b) => (a.at < b.at ? 1 : -1));
  return adjustments.slice(0, limit);
}
