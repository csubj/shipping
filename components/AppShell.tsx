import { useEffect, useState } from "react";
import type { RouteName } from "@/hooks/useHashRoute";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/Button";
import { applyThemeToDocument, resolveSystemTheme, watchSystemTheme } from "@/lib/theme";
import { saveTheme } from "@/state/persistence";

const TABS: { id: RouteName; label: string; key: string }[] = [
  { id: "graph", label: "Graph", key: "g" },
  { id: "table", label: "Table", key: "t" },
  { id: "factions", label: "Factions", key: "f" },
  { id: "settings", label: "Settings", key: "s" },
];

export function AppShell({
  route,
  navigate,
  onAddPC,
  onAddNPC,
  onAddRelationship,
  onDegradeAll,
  onImport,
  onExport,
  children,
}: {
  route: RouteName;
  navigate: (r: RouteName) => void;
  onAddPC: () => void;
  onAddNPC: () => void;
  onAddRelationship: () => void;
  onDegradeAll: () => void;
  onImport: () => void;
  onExport: () => void;
  children: React.ReactNode;
}) {
  const campaignName = useStore((s) => s.state.meta.campaignName);
  const setCampaignName = useStore((s) => s.setCampaignName);
  const theme = useStore((s) => s.state.settings.theme);
  const setTheme = useStore((s) => s.setTheme);
  const autosave = useStore((s) => s.state.settings.localStorage.autosave);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(campaignName);

  // React to theme changes
  useEffect(() => {
    const resolved = theme === "system" ? resolveSystemTheme() : theme;
    applyThemeToDocument(resolved);
    saveTheme(theme);
    if (theme === "system") {
      return watchSystemTheme((t) => applyThemeToDocument(t));
    }
  }, [theme]);

  const cycleTheme = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const themeIcon = theme === "dark" ? "🌙" : theme === "light" ? "☀" : "🖥";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">Shipping</span>
          {editingName ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => {
                setCampaignName(draftName.trim() || "Untitled Campaign");
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraftName(campaignName);
                  setEditingName(false);
                }
              }}
              className="h-7 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
            />
          ) : (
            <button
              className="text-sm text-[var(--muted)] hover:text-[var(--fg)] underline-offset-4 hover:underline"
              onClick={() => {
                setDraftName(campaignName);
                setEditingName(true);
              }}
              title="Click to rename"
            >
              {campaignName}
            </button>
          )}
          {!autosave && (
            <span className="rounded bg-amber-200 px-2 py-0.5 text-xs text-amber-900">
              Autosave off — export to save
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onImport} title="Import (i)">⬆ Import</Button>
          <Button size="sm" onClick={onExport} title="Export (e)">⬇ Export</Button>
          <Button size="sm" variant="ghost" onClick={cycleTheme} title={`Theme: ${theme}`}>
            {themeIcon}
          </Button>
        </div>
      </header>

      <nav className="flex border-b border-[var(--border)] bg-[var(--bg)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.id)}
            className={
              "px-4 py-2 text-sm transition-colors " +
              (route === t.id
                ? "border-b-2 border-indigo-500 font-semibold text-[var(--fg)]"
                : "text-[var(--muted)] hover:text-[var(--fg)]")
            }
          >
            {t.label}
            <span className="ml-1 text-[10px] text-[var(--muted)]">({t.key})</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto">{children}</main>

      <footer className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <Button size="sm" variant="primary" onClick={onAddPC}>+ PC</Button>
        <Button size="sm" variant="primary" onClick={onAddNPC}>+ NPC</Button>
        <Button size="sm" onClick={onAddRelationship}>+ Relationship</Button>
        <div className="flex-1" />
        <Button size="sm" variant="danger" onClick={onDegradeAll} title="Degrade all (d)">
          ⏳ Degrade All
        </Button>
      </footer>
    </div>
  );
}
