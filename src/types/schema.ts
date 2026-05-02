import { z } from "zod";

export const CURRENT_SCHEMA_VERSION = 1;

export const GraphPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const PCSchema = z.object({
  id: z.string(),
  kind: z.literal("pc"),
  firstName: z.string(),
  lastName: z.string(),
  class: z.string().default(""),
  notes: z.string().default(""),
  factionIds: z.array(z.string()).default([]),
  graphPosition: GraphPositionSchema.optional(),
});

const NPCSchema = z.object({
  id: z.string(),
  kind: z.literal("npc"),
  firstName: z.string(),
  lastName: z.string(),
  location: z.string().default(""),
  notes: z.string().default(""),
  factionIds: z.array(z.string()).default([]),
  graphPosition: GraphPositionSchema.optional(),
});

export const CharacterSchema = z.discriminatedUnion("kind", [PCSchema, NPCSchema]);

export const AdjustmentReasonSchema = z.union([
  z.literal("manual-edit"),
  z.literal("degrade-all"),
  z.string().regex(/^faction:/),
]);

export const AdjustmentSchema = z.object({
  at: z.string(),
  delta: z.number(),
  valueBefore: z.number(),
  valueAfter: z.number(),
  reason: AdjustmentReasonSchema,
});

export const RelationshipSchema = z.object({
  id: z.string(),
  a: z.string(),
  b: z.string(),
  value: z.number(),
  notes: z.string().default(""),
  history: z.array(AdjustmentSchema).default([]),
});

export const FactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  color: z.string(),
});

export const FactionEdgeSchema = z.object({
  id: z.string(),
  a: z.string(),
  b: z.string(),
  affinity: z.number().int(),
});

export const BandSchema = z.object({
  id: z.string(),
  name: z.string(),
  threshold: z.number().int(), // positive lower bound; mirrored for negatives
  color: z.string(), // hex color
});

export const SettingsSchema = z.object({
  bands: z.array(BandSchema),
  degrade: z.object({
    amount: z.number().int().default(1),
  }),
  propagation: z.object({
    enabled: z.boolean().default(true),
    nudgePerAffinityPoint: z.number().int().default(2),
    triggerOnBand: z.string().default("Friends"),
    confirmBeforeApply: z.boolean().default(true),
  }),
  localStorage: z.object({
    autosave: z.boolean().default(true),
  }),
  theme: z.enum(["system", "light", "dark"]).default("system"),
});

export const AppStateSchema = z.object({
  schemaVersion: z.number().int(),
  meta: z.object({
    campaignName: z.string(),
    lastSavedAt: z.string(),
  }),
  characters: z.record(z.string(), CharacterSchema),
  relationships: z.record(z.string(), RelationshipSchema),
  factions: z.record(z.string(), FactionSchema),
  factionEdges: z.record(z.string(), FactionEdgeSchema),
  settings: SettingsSchema,
});

export type GraphPosition = z.infer<typeof GraphPositionSchema>;
export type PC = z.infer<typeof PCSchema>;
export type NPC = z.infer<typeof NPCSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Adjustment = z.infer<typeof AdjustmentSchema>;
export type AdjustmentReason = z.infer<typeof AdjustmentReasonSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Faction = z.infer<typeof FactionSchema>;
export type FactionEdge = z.infer<typeof FactionEdgeSchema>;
export type Band = z.infer<typeof BandSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type AppState = z.infer<typeof AppStateSchema>;

export const DEFAULT_BANDS: Band[] = [
  { id: "close-allies", name: "Close Allies", threshold: 20, color: "#10b981" },
  { id: "friends", name: "Friends", threshold: 10, color: "#4ade80" },
  { id: "acquaintances", name: "Acquaintances", threshold: 1, color: "#bef264" },
];

export const STRANGERS_BAND: Band = {
  id: "strangers",
  name: "Strangers",
  threshold: 0,
  color: "#94a3b8",
};

export const DEFAULT_NEGATIVE_BAND_NAMES: Record<string, string> = {
  "close-allies": "Nemeses",
  friends: "Enemies",
  acquaintances: "Unfriendly",
};

export const DEFAULT_NEGATIVE_BAND_COLORS: Record<string, string> = {
  "close-allies": "#dc2626",
  friends: "#f97316",
  acquaintances: "#fbbf24",
};

export function defaultSettings(): Settings {
  return {
    bands: DEFAULT_BANDS,
    degrade: { amount: 1 },
    propagation: {
      enabled: true,
      nudgePerAffinityPoint: 2,
      triggerOnBand: "Friends",
      confirmBeforeApply: true,
    },
    localStorage: { autosave: true },
    theme: "system",
  };
}

export function emptyState(): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      campaignName: "Untitled Campaign",
      lastSavedAt: new Date().toISOString(),
    },
    characters: {},
    relationships: {},
    factions: {},
    factionEdges: {},
    settings: defaultSettings(),
  };
}
