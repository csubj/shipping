import { useStore } from "@/state/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clearLocalStorage } from "@/state/persistence";
import type { Band, Settings as SettingsType } from "@/types/schema";

export function Settings() {
  const settings = useStore((s) => s.state.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const replaceState = useStore((s) => s.replaceState);
  const resetState = useStore((s) => s.resetState);
  const pushToast = useStore((s) => s.pushToast);

  const updateBand = (id: string, patch: Partial<Band>) => {
    const next = settings.bands.map((b) => (b.id === id ? { ...b, ...patch } : b));
    updateSettings({ bands: next });
  };

  const addBand = () => {
    const id = `band-${Date.now()}`;
    updateSettings({
      bands: [...settings.bands, { id, name: "New Band", threshold: 30, color: "#888" }],
    });
  };

  const removeBand = (id: string) => {
    updateSettings({ bands: settings.bands.filter((b) => b.id !== id) });
  };

  const setNested = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) =>
    updateSettings({ [key]: value } as Partial<SettingsType>);

  const loadSample = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample-data.json`);
      if (!res.ok) throw new Error("Sample data not available");
      const json = await res.json();
      if (!confirm("Replace current campaign with sample data?")) return;
      replaceState(json);
      pushToast("Loaded sample data");
    } catch (err) {
      pushToast(`Failed: ${(err as Error).message}`);
    }
  };

  const clearAll = () => {
    if (!confirm("Clear all data? This cannot be undone.")) return;
    resetState();
    clearLocalStorage();
    pushToast("Cleared all data");
  };

  return (
    <div className="space-y-6 p-4 max-w-3xl">
      {/* Bands */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">
          Relationship Bands
        </h3>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Positive thresholds; negative side is mirrored automatically.
        </p>
        <table className="w-full text-sm">
          <thead className="text-xs text-[var(--muted)]">
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Threshold (≥)</th>
              <th className="text-left">Color</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {settings.bands.map((b) => (
              <tr key={b.id}>
                <td className="py-1 pr-2">
                  <Input value={b.name} onChange={(e) => updateBand(b.id, { name: e.target.value })} />
                </td>
                <td className="py-1 pr-2">
                  <Input
                    type="number"
                    value={b.threshold}
                    onChange={(e) => updateBand(b.id, { threshold: Number(e.target.value) })}
                    className="w-24"
                  />
                </td>
                <td className="py-1 pr-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={b.color}
                      onChange={(e) => updateBand(b.id, { color: e.target.value })}
                      className="h-7 w-10 rounded border border-[var(--border)]"
                    />
                    <span className="text-xs">{b.color}</span>
                  </div>
                </td>
                <td className="py-1">
                  <Button size="sm" variant="danger" onClick={() => removeBand(b.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button size="sm" className="mt-2" onClick={addBand}>+ Add band</Button>
      </section>

      {/* Degrade */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Degrade</h3>
        <label className="text-sm flex items-center gap-2">
          Default degrade amount per invocation:
          <Input
            type="number"
            value={settings.degrade.amount}
            onChange={(e) => setNested("degrade", { amount: Math.max(0, Number(e.target.value)) })}
            className="w-24"
          />
        </label>
      </section>

      {/* Propagation */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Propagation</h3>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.propagation.enabled}
              onChange={(e) =>
                setNested("propagation", { ...settings.propagation, enabled: e.target.checked })
              }
            />
            Enable faction-affinity ripple propagation
          </label>
          <label className="flex items-center gap-2">
            Nudge per affinity point:
            <Input
              type="number"
              value={settings.propagation.nudgePerAffinityPoint}
              onChange={(e) =>
                setNested("propagation", {
                  ...settings.propagation,
                  nudgePerAffinityPoint: Number(e.target.value),
                })
              }
              className="w-20"
            />
          </label>
          <label className="flex items-center gap-2">
            Trigger on band:
            <select
              value={settings.propagation.triggerOnBand}
              onChange={(e) =>
                setNested("propagation", {
                  ...settings.propagation,
                  triggerOnBand: e.target.value,
                })
              }
              className="h-9 rounded border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
            >
              {settings.bands.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.propagation.confirmBeforeApply}
              onChange={(e) =>
                setNested("propagation", {
                  ...settings.propagation,
                  confirmBeforeApply: e.target.checked,
                })
              }
            />
            Confirm before applying ripple proposals
          </label>
        </div>
      </section>

      {/* Storage */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Storage</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.localStorage.autosave}
            onChange={(e) => setNested("localStorage", { autosave: e.target.checked })}
          />
          Autosave to browser localStorage (debounced)
        </label>
      </section>

      {/* Theme */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Theme</h3>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={settings.theme === t ? "primary" : "secondary"}
              onClick={() => setNested("theme", t)}
            >
              {t}
            </Button>
          ))}
        </div>
      </section>

      {/* Data ops */}
      <section className="rounded border border-[var(--border)] p-3">
        <h3 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Data</h3>
        <div className="flex gap-2">
          <Button onClick={loadSample}>Load sample data</Button>
          <Button variant="danger" onClick={clearAll}>Clear all</Button>
        </div>
      </section>
    </div>
  );
}
