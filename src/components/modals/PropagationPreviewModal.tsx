import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BandChip } from "@/components/BandChip";
import { useStore } from "@/state/store";
import { characterFullName } from "@/state/selectors";

export function PropagationPreviewModal({ open }: { open: boolean }) {
  const pending = useStore((s) => s.pendingPropagation);
  const characters = useStore((s) => s.state.characters);
  const apply = useStore((s) => s.applyPropagation);
  const setPending = useStore((s) => s.setPendingPropagation);
  const pushToast = useStore((s) => s.pushToast);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (pending) {
      setSelected(new Set(pending.proposals.map((p) => p.relationshipId)));
    }
  }, [pending]);

  if (!pending) return null;

  const onCancel = () => setPending(null);
  const onApply = () => {
    const count = selected.size;
    apply(selected);
    pushToast(`Applied ${count} faction ripple adjustments`);
  };

  const toggle = (id: string) =>
    setSelected((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
      title="Faction Ripple Preview"
      description="A relationship change has triggered ripples through allied/rival factions."
      className="w-[640px]"
    >
      <div className="max-h-[50vh] overflow-auto rounded border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--card)] text-[var(--muted)]">
            <tr>
              <th className="w-8 px-2 py-1"></th>
              <th className="px-2 py-1 text-left">Pair</th>
              <th className="px-2 py-1 text-right">Δ</th>
              <th className="px-2 py-1 text-left">Result</th>
              <th className="px-2 py-1 text-left">Via</th>
            </tr>
          </thead>
          <tbody>
            {pending.proposals.map((p) => {
              const from = characters[p.fromCharacterId];
              const to = characters[p.toCharacterId];
              if (!from || !to) return null;
              return (
                <tr key={`${p.relationshipId}::${p.reasonFactionId}`} className="border-t border-[var(--border)]">
                  <td className="px-2 py-1">
                    <input
                      type="checkbox"
                      checked={selected.has(p.relationshipId)}
                      onChange={() => toggle(p.relationshipId)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    {characterFullName(from)} ↔ {characterFullName(to)}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {p.delta > 0 ? "+" : ""}
                    {p.delta}
                  </td>
                  <td className="px-2 py-1">
                    {p.currentValue} → {p.proposedValue} <BandChip value={p.proposedValue} />
                  </td>
                  <td className="px-2 py-1">{p.reasonFactionName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2 pt-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onApply}>Apply Selected ({selected.size})</Button>
      </div>
    </Modal>
  );
}
