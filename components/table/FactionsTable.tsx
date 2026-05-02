import { useState } from "react";
import { useStore } from "@/state/store";
import { Button } from "@/components/ui/Button";
import { FactionEditor } from "@/components/editors/FactionEditor";
import { factionMembers } from "@/state/selectors";

export function FactionsTable() {
  const factions = useStore((s) => s.state.factions);
  const state = useStore((s) => s.state);
  const update = useStore((s) => s.updateFaction);

  const [editor, setEditor] = useState<{ open: boolean; id?: string }>({ open: false });

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <Button size="sm" variant="primary" onClick={() => setEditor({ open: true })}>
          + Faction
        </Button>
      </div>
      <div className="overflow-auto rounded border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card)] text-left text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Color</th>
              <th className="px-2 py-2">Members (PC / NPC)</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(factions).map((f) => {
              const members = factionMembers(state, f.id);
              const pcs = members.filter((c) => c.kind === "pc").length;
              const npcs = members.filter((c) => c.kind === "npc").length;
              return (
                <tr key={f.id} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1">
                    <input
                      className="w-full bg-transparent focus:outline-none font-medium"
                      value={f.name}
                      onChange={(e) => update(f.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="color"
                      value={f.color}
                      onChange={(e) => update(f.id, { color: e.target.value })}
                      className="h-7 w-10 rounded border border-[var(--border)] bg-transparent"
                    />
                  </td>
                  <td className="px-2 py-1">
                    {pcs} PC / {npcs} NPC
                  </td>
                  <td className="px-2 py-1 max-w-md text-[var(--muted)]">{f.description}</td>
                  <td className="px-2 py-1">
                    <Button size="sm" onClick={() => setEditor({ open: true, id: f.id })}>
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
            {Object.keys(factions).length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-[var(--muted)]">
                  No factions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <FactionEditor
        open={editor.open}
        factionId={editor.id}
        onOpenChange={(o) => setEditor({ open: o, id: o ? editor.id : undefined })}
      />
    </div>
  );
}
