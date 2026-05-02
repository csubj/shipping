import { CURRENT_SCHEMA_VERSION } from "@/types/schema";

type MigrationFn = (state: any) => any;

const migrations: Record<number, MigrationFn> = {
  // Example: 2: (s) => ({ ...s, schemaVersion: 2, newField: defaultValue })
};

export function migrateState(input: unknown): any {
  let state: any = input;
  if (!state || typeof state !== "object") {
    throw new Error("Invalid state for migration");
  }
  let version = typeof state.schemaVersion === "number" ? state.schemaVersion : 1;
  while (version < CURRENT_SCHEMA_VERSION) {
    const next = version + 1;
    const fn = migrations[next];
    if (!fn) {
      throw new Error(`No migration registered for v${next}`);
    }
    state = fn(state);
    version = next;
  }
  return state;
}
