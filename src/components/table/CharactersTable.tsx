import { useMemo, useState } from "react";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { characterFullName } from "@/state/selectors";

export function CharactersTable({
  onEdit,
  onOpenInGraph,
}: {
  onEdit: (id?: string, kind?: "pc" | "npc") => void;
  onOpenInGraph: (id: string) => void;
}) {
  const characters = useStore((s) => s.state.characters);
  const factions = useStore((s) => s.state.factions);
  const update = useStore((s) => s.updateCharacter);
  const remove = useStore((s) => s.deleteCharacter);

  const [filter, setFilter] = useState<"all" | "pc" | "npc">("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    return Object.values(characters)
      .filter((c) => filter === "all" || c.kind === filter)
      .filter((c) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return characterFullName(c).toLowerCase().includes(s);
      })
      .sort((a, b) => characterFullName(a).localeCompare(characterFullName(b)));
  }, [characters, filter, search]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="flex gap-1">
          {(["all", "pc", "npc"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={filter === k ? "primary" : "ghost"}
              onClick={() => setFilter(k)}
            >
              {k.toUpperCase()}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex-1" />
        <Button size="sm" variant="primary" onClick={() => onEdit(undefined, "pc")}>+ PC</Button>
        <Button size="sm" variant="primary" onClick={() => onEdit(undefined, "npc")}>+ NPC</Button>
      </div>
      <div className="overflow-auto rounded border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-2 py-2">Kind</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Class / Location</th>
              <th className="px-2 py-2">Factions</th>
              <th className="px-2 py-2">Notes</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const subtitle = c.kind === "pc" ? c.class : c.location;
              return (
                <tr key={c.id} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1">
                    <span className="rounded bg-[var(--card)] px-1.5 py-0.5 text-xs">
                      {c.kind.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="w-full bg-transparent focus:outline-none"
                      value={`${c.firstName} ${c.lastName}`.trim()}
                      onChange={(e) => {
                        const [first, ...rest] = e.target.value.split(" ");
                        update(c.id, {
                          firstName: first ?? "",
                          lastName: rest.join(" "),
                        } as any);
                      }}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="w-full bg-transparent focus:outline-none"
                      value={subtitle}
                      onChange={(e) =>
                        update(
                          c.id,
                          (c.kind === "pc"
                            ? { class: e.target.value }
                            : { location: e.target.value }) as any,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex flex-wrap gap-1">
                      {c.factionIds
                        .map((id) => factions[id])
                        .filter(Boolean)
                        .map((f) => (
                          <span
                            key={f.id}
                            className="rounded-full px-1.5 py-0.5 text-[10px] text-white"
                            style={{ backgroundColor: f.color }}
                          >
                            {f.name}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-2 py-1 max-w-xs truncate text-[var(--muted)]" title={c.notes}>
                    {c.notes}
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => onEdit(c.id)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => onOpenInGraph(c.id)}>
                        Graph
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete ${characterFullName(c)}?`)) remove(c.id);
                        }}
                      >
                        Del
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-center text-[var(--muted)]">
                  No characters yet. Add a PC or NPC.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
