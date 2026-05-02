import { useState } from "react";
import { useStore } from "@/state/store";
import { deterministicPairId } from "@/domain/ids";
import { Button } from "@/components/ui/Button";

export function FactionAffinityTable() {
  const factions = useStore((s) => s.state.factions);
  const factionEdges = useStore((s) => s.state.factionEdges);
  const setAffinity = useStore((s) => s.setFactionAffinity);

  const list = Object.values(factions);
  const [view, setView] = useState<"matrix" | "list">(list.length <= 8 ? "matrix" : "list");

  const getAffinity = (a: string, b: string): number => {
    if (a === b) return 0;
    const id = deterministicPairId(a, b);
    return factionEdges[id]?.affinity ?? 0;
  };

  if (list.length === 0) {
    return <div className="text-sm text-[var(--muted)]">No factions defined yet.</div>;
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Button
          size="sm"
          variant={view === "matrix" ? "primary" : "ghost"}
          onClick={() => setView("matrix")}
        >
          Matrix
        </Button>
        <Button
          size="sm"
          variant={view === "list" ? "primary" : "ghost"}
          onClick={() => setView("list")}
        >
          Edge list
        </Button>
        <span className="text-xs text-[var(--muted)]">
          Affinity range: −3 to +3 (positive = allies, negative = rivals)
        </span>
      </div>

      {view === "matrix" ? (
        <div className="overflow-auto rounded border border-[var(--border)]">
          <table className="text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1"></th>
                {list.map((f) => (
                  <th key={f.id} className="px-2 py-1 text-xs" style={{ color: f.color }}>
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  <th
                    className="px-2 py-1 text-left text-xs"
                    style={{ color: row.color }}
                  >
                    {row.name}
                  </th>
                  {list.map((col) => {
                    if (row.id === col.id) {
                      return (
                        <td key={col.id} className="px-2 py-1 text-center text-[var(--muted)]">
                          —
                        </td>
                      );
                    }
                    const v = getAffinity(row.id, col.id);
                    return (
                      <td key={col.id} className="px-2 py-1 text-center">
                        <input
                          type="number"
                          min={-3}
                          max={3}
                          value={v}
                          onChange={(e) =>
                            setAffinity(row.id, col.id, Math.max(-3, Math.min(3, Number(e.target.value))))
                          }
                          className="w-12 rounded border border-[var(--border)] bg-[var(--bg)] text-center"
                          style={{
                            color: v > 0 ? "#10b981" : v < 0 ? "#ef4444" : undefined,
                            fontWeight: v !== 0 ? 600 : 400,
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto rounded border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--card)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-2 py-2 text-left">Faction A</th>
                <th className="px-2 py-2 text-left">Faction B</th>
                <th className="px-2 py-2 text-right">Affinity</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(factionEdges).map((fe) => {
                const a = factions[fe.a];
                const b = factions[fe.b];
                if (!a || !b) return null;
                return (
                  <tr key={fe.id} className="border-t border-[var(--border)]">
                    <td className="px-2 py-1" style={{ color: a.color }}>{a.name}</td>
                    <td className="px-2 py-1" style={{ color: b.color }}>{b.name}</td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min={-3}
                        max={3}
                        value={fe.affinity}
                        onChange={(e) =>
                          setAffinity(a.id, b.id, Math.max(-3, Math.min(3, Number(e.target.value))))
                        }
                        className="w-16 rounded border border-[var(--border)] bg-[var(--bg)] text-right px-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
