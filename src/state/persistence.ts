import { AppStateSchema, type AppState } from "@/types/schema";
import { useStore } from "./store";
import { migrateState } from "@/migrations";

const STORAGE_KEY = "shipping:state";
const THEME_KEY = "shipping:theme";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function setupPersistence(): void {
  // Subscribe to store changes; debounce-write to localStorage when autosave is on.
  useStore.subscribe((store) => {
    const { autosave } = store.state.settings.localStorage;
    if (!autosave) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const toSave = { ...store.state, meta: { ...store.state.meta, lastSavedAt: new Date().toISOString() } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch {
        // ignore quota errors
      }
    }, 500);
  });
}

export function loadFromLocalStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = migrateState(parsed);
    return AppStateSchema.parse(migrated);
  } catch (err) {
    console.error("Failed to load saved state", err);
    return null;
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadTheme(): "system" | "light" | "dark" | null {
  const t = localStorage.getItem(THEME_KEY);
  if (t === "system" || t === "light" || t === "dark") return t;
  return null;
}

export function saveTheme(theme: "system" | "light" | "dark"): void {
  localStorage.setItem(THEME_KEY, theme);
}
