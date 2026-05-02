import { AppStateSchema, type AppState } from "@/types/schema";
import { migrateState } from "@/migrations";

export async function parseAndValidate(text: string): Promise<AppState> {
  const raw = JSON.parse(text);
  const migrated = migrateState(raw);
  return AppStateSchema.parse(migrated);
}

export function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
