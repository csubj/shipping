import type { AppState, Relationship } from "@/types/schema";
import { deterministicPairId } from "./ids";
import { valueToBand } from "./bands";

export type PropagationProposal = {
  relationshipId: string;
  fromCharacterId: string; // the changed-edge participant
  toCharacterId: string;   // the linked-faction member
  delta: number;
  currentValue: number;
  proposedValue: number;
  reasonFactionId: string;
  reasonFactionName: string;
};

/**
 * Determine whether a relationship value has crossed the propagation
 * trigger threshold (Friends band lower bound, mirrored for Enemies).
 * Returns the trigger sign or 0 if no trigger.
 */
export function propagationTriggerSign(
  oldValue: number,
  newValue: number,
  state: AppState,
): -1 | 0 | 1 {
  const triggerBandName = state.settings.propagation.triggerOnBand;
  const band = state.settings.bands.find((b) => b.name === triggerBandName);
  if (!band) return 0;
  const threshold = band.threshold;
  if (oldValue < threshold && newValue >= threshold) return 1;
  if (oldValue > -threshold && newValue <= -threshold) return -1;
  return 0;
}

export function computePropagationProposals(
  changedEdge: Relationship,
  newValue: number,
  state: AppState,
  triggerSign: 1 | -1,
): PropagationProposal[] {
  const nudge = state.settings.propagation.nudgePerAffinityPoint;
  const charA = state.characters[changedEdge.a];
  const charB = state.characters[changedEdge.b];
  if (!charA || !charB) return [];

  const proposalsByPair = new Map<string, PropagationProposal>();

  const considerPair = (
    fromCharId: string,
    toCharId: string,
    delta: number,
    factionId: string,
  ) => {
    if (fromCharId === toCharId) return;
    if (toCharId === changedEdge.a || toCharId === changedEdge.b) return;
    const relId = deterministicPairId(fromCharId, toCharId);
    const existing = state.relationships[relId];
    const currentValue = existing?.value ?? 0;
    const factionName = state.factions[factionId]?.name ?? factionId;
    const key = `${relId}::${factionId}`;
    const prior = proposalsByPair.get(key);
    if (prior) {
      prior.delta += delta;
      prior.proposedValue = prior.currentValue + prior.delta;
    } else {
      proposalsByPair.set(key, {
        relationshipId: relId,
        fromCharacterId: fromCharId,
        toCharacterId: toCharId,
        delta,
        currentValue,
        proposedValue: currentValue + delta,
        reasonFactionId: factionId,
        reasonFactionName: factionName,
      });
    }
  };

  for (const me of [charA, charB]) {
    const other = me.id === charA.id ? charB : charA;
    for (const factionId of me.factionIds) {
      // Find faction edges involving this faction
      for (const fe of Object.values(state.factionEdges)) {
        if (fe.a !== factionId && fe.b !== factionId) continue;
        const linkedFactionId = fe.a === factionId ? fe.b : fe.a;
        const f = fe.affinity;
        if (f === 0) continue;
        // For each character in linked faction (excluding edge participants)
        for (const linked of Object.values(state.characters)) {
          if (linked.id === changedEdge.a || linked.id === changedEdge.b) continue;
          if (!linked.factionIds.includes(linkedFactionId)) continue;
          const delta = triggerSign * f * nudge;
          if (delta === 0) continue;
          considerPair(other.id, linked.id, delta, linkedFactionId);
        }
      }
    }
  }

  return Array.from(proposalsByPair.values());
}

/** Helper for the UI: given a value, get the band name. */
export function bandNameForValue(value: number, state: AppState): string {
  return valueToBand(value, state.settings.bands).name;
}
