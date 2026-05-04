import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuidv4 } from "uuid";
import {
  AppStateSchema,
  type AppState,
  type Character,
  type Faction,
  type Relationship,
  type Settings,
  emptyState,
  CURRENT_SCHEMA_VERSION,
} from "@/types/schema";
import { deterministicPairId } from "@/domain/ids";
import { computeDegradeDeltas } from "@/domain/degrade";
import {
  computePropagationProposals,
  propagationTriggerSign,
  type PropagationProposal,
} from "@/domain/propagation";

export type StoreState = {
  state: AppState;
  // selection (graph)
  selectedNodeIds: string[];
  // pending propagation proposals
  pendingPropagation: {
    proposals: PropagationProposal[];
    triggerEdgeId: string;
  } | null;
  // toasts
  toasts: { id: string; message: string }[];
};

export type StoreActions = {
  replaceState: (next: AppState) => void;
  resetState: () => void;
  setCampaignName: (name: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setTheme: (theme: Settings["theme"]) => void;

  // Characters
  createCharacter: (input: Omit<Character, "id"> & { id?: string }) => string;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setCharacterPosition: (id: string, x: number, y: number) => void;

  // Relationships
  createRelationship: (a: string, b: string, value?: number, notes?: string) => string;
  updateRelationshipValue: (id: string, newValue: number, reason?: string) => PropagationProposal[] | null;
  updateRelationshipNotes: (id: string, notes: string) => void;
  deleteRelationship: (id: string) => void;

  // Factions
  createFaction: (input: Omit<Faction, "id"> & { id?: string }) => string;
  updateFaction: (id: string, patch: Partial<Faction>) => void;
  deleteFaction: (id: string) => void;
  setFactionAffinity: (a: string, b: string, affinity: number) => void;

  // Bulk operations
  applyDegradeAll: (amount: number) => { degraded: number; deleted: number };

  // Propagation
  setPendingPropagation: (p: StoreState["pendingPropagation"]) => void;
  applyPropagation: (selectedRelIds: Set<string>) => void;

  // Selection
  setSelectedNodes: (ids: string[]) => void;

  // Toasts
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
};

export const useStore = create<StoreState & StoreActions>()(
  immer((set, get) => ({
    state: emptyState(),
    selectedNodeIds: [],
    pendingPropagation: null,
    toasts: [],

    replaceState: (next) => {
      const parsed = AppStateSchema.parse(next);
      set((s) => {
        s.state = parsed;
      });
    },

    resetState: () => {
      set((s) => {
        s.state = emptyState();
        s.selectedNodeIds = [];
        s.pendingPropagation = null;
      });
    },

    setCampaignName: (name) =>
      set((s) => {
        s.state.meta.campaignName = name;
      }),

    updateSettings: (patch) =>
      set((s) => {
        s.state.settings = { ...s.state.settings, ...patch } as Settings;
      }),

    setTheme: (theme) =>
      set((s) => {
        s.state.settings.theme = theme;
      }),

    createCharacter: (input) => {
      const id = input.id ?? uuidv4();
      set((s) => {
        s.state.characters[id] = { ...input, id } as Character;
      });
      return id;
    },

    updateCharacter: (id, patch) =>
      set((s) => {
        const existing = s.state.characters[id];
        if (!existing) return;
        s.state.characters[id] = { ...existing, ...patch } as Character;
      }),

    deleteCharacter: (id) =>
      set((s) => {
        delete s.state.characters[id];
        for (const relId of Object.keys(s.state.relationships)) {
          const r = s.state.relationships[relId];
          if (r.a === id || r.b === id) delete s.state.relationships[relId];
        }
        s.selectedNodeIds = s.selectedNodeIds.filter((nid) => nid !== id);
      }),

    setCharacterPosition: (id, x, y) =>
      set((s) => {
        const c = s.state.characters[id];
        if (!c) return;
        c.graphPosition = { x, y };
      }),

    createRelationship: (a, b, value = 0, notes = "") => {
      if (a === b) throw new Error("Cannot create self-relationship");
      const id = deterministicPairId(a, b);
      set((s) => {
        if (s.state.relationships[id]) return;
        s.state.relationships[id] = {
          id,
          a: a < b ? a : b,
          b: a < b ? b : a,
          value,
          notes,
          history: [],
        };
      });
      return id;
    },

    updateRelationshipValue: (id, newValue, reason = "manual-edit") => {
      const before = get().state.relationships[id];
      if (!before) return null;
      const valueBefore = before.value;
      if (valueBefore === newValue) return null;
      const delta = newValue - valueBefore;
      set((s) => {
        const rel = s.state.relationships[id];
        rel.value = newValue;
        rel.history.unshift({
          at: new Date().toISOString(),
          delta,
          valueBefore,
          valueAfter: newValue,
          reason: reason as Relationship["history"][number]["reason"],
        });
      });

      // Check for propagation
      const cur = get().state;
      if (!cur.settings.propagation.enabled) return null;
      const trigger = propagationTriggerSign(valueBefore, newValue, cur);
      if (trigger === 0) return null;
      const proposals = computePropagationProposals(
        cur.relationships[id],
        newValue,
        cur,
        trigger,
      );
      if (proposals.length === 0) return null;
      if (cur.settings.propagation.confirmBeforeApply) {
        set((s) => {
          s.pendingPropagation = { proposals, triggerEdgeId: id };
        });
        return proposals;
      } else {
        // Auto-apply
        get().applyPropagation(new Set(proposals.map((p) => p.relationshipId)));
        return null;
      }
    },

    updateRelationshipNotes: (id, notes) =>
      set((s) => {
        const r = s.state.relationships[id];
        if (r) r.notes = notes;
      }),

    deleteRelationship: (id) =>
      set((s) => {
        delete s.state.relationships[id];
      }),

    createFaction: (input) => {
      const id = input.id ?? uuidv4();
      set((s) => {
        s.state.factions[id] = { ...input, id };
      });
      return id;
    },

    updateFaction: (id, patch) =>
      set((s) => {
        const f = s.state.factions[id];
        if (!f) return;
        s.state.factions[id] = { ...f, ...patch };
      }),

    deleteFaction: (id) =>
      set((s) => {
        delete s.state.factions[id];
        for (const c of Object.values(s.state.characters)) {
          c.factionIds = c.factionIds.filter((fid) => fid !== id);
        }
        for (const feId of Object.keys(s.state.factionEdges)) {
          const fe = s.state.factionEdges[feId];
          if (fe.a === id || fe.b === id) delete s.state.factionEdges[feId];
        }
      }),

    setFactionAffinity: (a, b, affinity) => {
      if (a === b) return;
      const id = deterministicPairId(a, b);
      set((s) => {
        if (affinity === 0) {
          delete s.state.factionEdges[id];
        } else {
          s.state.factionEdges[id] = {
            id,
            a: a < b ? a : b,
            b: a < b ? b : a,
            affinity,
          };
        }
      });
    },

    applyDegradeAll: (amount) => {
      const deltas = computeDegradeDeltas(get().state.relationships, amount);
      const at = new Date().toISOString();
      let deleted = 0;
      set((s) => {
        for (const d of deltas) {
          const rel = s.state.relationships[d.relationshipId];
          if (!rel) continue;
          if (d.valueAfter === 0) {
            delete s.state.relationships[d.relationshipId];
            deleted++;
          } else {
            rel.value = d.valueAfter;
            rel.history.unshift({
              at,
              delta: d.delta,
              valueBefore: d.valueBefore,
              valueAfter: d.valueAfter,
              reason: "degrade-all",
            });
          }
        }
      });
      return { degraded: deltas.length - deleted, deleted };
    },

    setPendingPropagation: (p) =>
      set((s) => {
        s.pendingPropagation = p;
      }),

    applyPropagation: (selectedRelIds) => {
      const pending = get().pendingPropagation;
      if (!pending) return;
      const at = new Date().toISOString();
      set((s) => {
        for (const p of pending.proposals) {
          if (!selectedRelIds.has(p.relationshipId)) continue;
          let rel = s.state.relationships[p.relationshipId];
          const reason = `faction:${p.reasonFactionName}` as const;
          if (!rel) {
            // Create new relationship
            const a = p.fromCharacterId < p.toCharacterId ? p.fromCharacterId : p.toCharacterId;
            const b = p.fromCharacterId < p.toCharacterId ? p.toCharacterId : p.fromCharacterId;
            rel = {
              id: p.relationshipId,
              a,
              b,
              value: 0,
              notes: "",
              history: [],
            };
            s.state.relationships[p.relationshipId] = rel;
          }
          const valueBefore = rel.value;
          const valueAfter = valueBefore + p.delta;
          rel.value = valueAfter;
          rel.history.unshift({
            at,
            delta: p.delta,
            valueBefore,
            valueAfter,
            reason,
          });
        }
        s.pendingPropagation = null;
      });
    },

    setSelectedNodes: (ids) =>
      set((s) => {
        s.selectedNodeIds = ids.slice(-2); // keep at most 2 most recent
      }),

    pushToast: (message) =>
      set((s) => {
        s.toasts.push({ id: uuidv4(), message });
      }),

    dismissToast: (id) =>
      set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== id);
      }),
  })),
);

export { CURRENT_SCHEMA_VERSION };
