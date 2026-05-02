import React from "react";
import ReactDOM from "react-dom/client";
import "@xyflow/react/dist/style.css";
import "./styles.css";
import { App } from "./App";
import { setupPersistence, loadFromLocalStorage, loadTheme } from "@/state/persistence";
import { useStore } from "@/state/store";
import { applyThemeToDocument, resolveSystemTheme } from "@/lib/theme";

async function bootstrap() {
  // Theme: prefer saved theme, else state default.
  const savedTheme = loadTheme() ?? "system";
  applyThemeToDocument(savedTheme === "system" ? resolveSystemTheme() : savedTheme);

  // Try local storage first
  const saved = loadFromLocalStorage();
  if (saved) {
    useStore.getState().replaceState(saved);
  } else {
    // Try sample-data
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample-data.json`);
      if (res.ok) {
        const json = await res.json();
        useStore.getState().replaceState(json);
      }
    } catch {
      // ignore — start with empty
    }
  }

  setupPersistence();

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
