import { useMemo, useState } from "react";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/Button";
import { BandChip } from "@/components/BandChip";
import { characterFullName } from "@/state/selectors";

type SortKey = "a" | "b" | "value" | "lastChange";

export function RelationshipsTable({
  onEdit,
  onOpenInGraph,
}: {
  onEdit: (id?: string) => void;
  onOpenInGraph: (id: string) => void;
}) {
  const characters = useStore((s) => s.state.characters);
  const relationships = useStore((s) => s.state.relationships);
  const remove = useStore((s) => s.deleteRelationship);

  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    const list = Object.values(relationships).map((r) => {
      const a = characters[r.a];
      const b = characters[r.b];
      const last = r.history[0];
      return {
        rel: r,
        aName: a ? characterFullName(a) : "?",
        bName: b ? characterFullName(b) : "?",
        last,
      };
    });
    list.sort((x, y) => {
      let cmp = 0;
      switch (sortKey) {
        case "a":
          cmp = x.aName.localeCompare(y.aName);
          break;
        case "b":
          cmp = x.bName.localeCompare(y.bName);
          break;
        case "value":
          cmp = x.rel.value - y.rel.value;
          break;
        case "lastChange":
          cmp = (x.last?.at ?? "").localeCompare(y.last?.at ?? "");
          break;
      }
      return cmp * sortDir;
    });
    return list;
  }, [relationships, characters, sortKey, sortDir]);

  const setSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(1);
    }
  };

  const arrow = (k: SortKey) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <Button size="sm" variant="primary" onClick={() => onEdit()}>+ Relationship</Button>
      </div>
      <div className="overflow-auto rounded border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="cursor-pointer px-2 py-2" onClick={() => setSort("a")}>
                Character A{arrow("a")}
              </th>
              <th className="cursor-pointer px-2 py-2" onClick={() => setSort("b")}>
                Character B{arrow("b")}
              </th>
              <th className="cursor-pointer px-2 py-2" onClick={() => setSort("value")}>
                Value{arrow("value")}
              </th>
              <th className="px-2 py-2">Band</th>
              <th className="cursor-pointer px-2 py-2" onClick={() => setSort("lastChange")}>
                Last Change{arrow("lastChange")}
              </th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rel, aName, bName, last }) => (
              <tr key={rel.id} className="border-t border-[var(--border)]">
                <td className="px-2 py-1">{aName}</td>
                <td className="px-2 py-1">{bName}</td>
                <td className="px-2 py-1 text-right tabular-nums">{rel.value}</td>
                <td className="px-2 py-1"><BandChip value={rel.value} /></td>
                <td className="px-2 py-1 text-xs text-[var(--muted)]">
                  {last
                    ? `${last.delta > 0 ? "+" : ""}${last.delta} · ${new Date(last.at).toLocaleDateString()}`
                    : "—"}
                </td>
                <td className="px-2 py-1 max-w-xs truncate text-[var(--muted)]" title={rel.notes}>
                  {rel.notes}
                </td>
                <td className="px-2 py-1">
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => onEdit(rel.id)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => onOpenInGraph(rel.a)}>
                      Graph
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm("Delete this relationship?")) remove(rel.id);
                      }}
                    >
                      Del
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-[var(--muted)]">
                  No relationships yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
