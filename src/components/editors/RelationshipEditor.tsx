import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { BandChip } from "@/components/BandChip";
import { useStore } from "@/state/store";
import { characterFullName } from "@/state/selectors";
import { deterministicPairId } from "@/domain/ids";

export function RelationshipEditor({
  open,
  relationshipId,
  aId,
  bId,
  onOpenChange,
}: {
  open: boolean;
  relationshipId?: string;
  aId?: string;
  bId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const characters = useStore((s) => s.state.characters);
  const relationships = useStore((s) => s.state.relationships);
  const createRelationship = useStore((s) => s.createRelationship);
  const updateValue = useStore((s) => s.updateRelationshipValue);
  const updateNotes = useStore((s) => s.updateRelationshipNotes);
  const deleteRelationship = useStore((s) => s.deleteRelationship);
  const pushToast = useStore((s) => s.pushToast);

  const computedId = useMemo(() => {
    if (relationshipId) return relationshipId;
    if (aId && bId && aId !== bId) return deterministicPairId(aId, bId);
    return undefined;
  }, [relationshipId, aId, bId]);

  const existing = computedId ? relationships[computedId] : undefined;

  const [selectA, setSelectA] = useState<string>(aId ?? "");
  const [selectB, setSelectB] = useState<string>(bId ?? "");
  const [value, setValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setSelectA(existing.a);
      setSelectB(existing.b);
      setValue(existing.value);
      setNotes(existing.notes);
    } else {
      setSelectA(aId ?? "");
      setSelectB(bId ?? "");
      setValue(0);
      setNotes("");
    }
  }, [open, existing, aId, bId]);

  const charA = characters[selectA];
  const charB = characters[selectB];

  const onSave = () => {
    if (!charA || !charB || charA.id === charB.id) {
      pushToast("Pick two different characters");
      return;
    }
    let id = computedId;
    if (!existing) {
      id = createRelationship(charA.id, charB.id, value, notes);
    } else {
      updateValue(existing.id, value, "manual-edit");
      updateNotes(existing.id, notes);
    }
    pushToast(existing ? "Relationship updated" : "Relationship created");
    onOpenChange(false);
    void id;
  };

  const onDelete = () => {
    if (!existing) return;
    if (!confirm("Delete this relationship?")) return;
    deleteRelationship(existing.id);
    pushToast("Relationship deleted");
    onOpenChange(false);
  };

  const characterOptions = Object.values(characters).sort((a, b) =>
    characterFullName(a).localeCompare(characterFullName(b)),
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={existing ? "Edit Relationship" : "New Relationship"}
      className="w-[560px]"
    >
      <div className="space-y-3">
        {!existing && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--muted)]">Character A</label>
              <select
                className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
                value={selectA}
                onChange={(e) => setSelectA(e.target.value)}
              >
                <option value="">— pick —</option>
                {characterOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {characterFullName(c)} ({c.kind.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted)]">Character B</label>
              <select
                className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
                value={selectB}
                onChange={(e) => setSelectB(e.target.value)}
              >
                <option value="">— pick —</option>
                {characterOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {characterFullName(c)} ({c.kind.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {existing && charA && charB && (
          <div className="text-sm text-[var(--muted)]">
            <strong className="text-[var(--fg)]">{characterFullName(charA)}</strong>
            {" ↔ "}
            <strong className="text-[var(--fg)]">{characterFullName(charB)}</strong>
          </div>
        )}

        <div>
          <label className="text-xs text-[var(--muted)]">Value</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-30}
              max={30}
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="flex-1"
            />
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              className="w-24"
            />
            <BandChip value={value} />
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--muted)]">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {existing && existing.history.length > 0 && (
          <div>
            <label className="text-xs text-[var(--muted)]">History</label>
            <div className="max-h-40 overflow-auto rounded border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--card)] text-[var(--muted)]">
                  <tr>
                    <th className="px-2 py-1 text-left">When</th>
                    <th className="px-2 py-1 text-right">Δ</th>
                    <th className="px-2 py-1 text-right">Before → After</th>
                    <th className="px-2 py-1 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {existing.history.map((h, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-2 py-1">{new Date(h.at).toLocaleString()}</td>
                      <td className="px-2 py-1 text-right">
                        {h.delta > 0 ? "+" : ""}
                        {h.delta}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {h.valueBefore} → {h.valueAfter}
                      </td>
                      <td className="px-2 py-1">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
          {existing ? (
            <Button variant="danger" onClick={onDelete}>Delete</Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="primary" onClick={onSave}>Save</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
