import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useStore } from "@/state/store";

export function FactionEditor({
  open,
  factionId,
  onOpenChange,
}: {
  open: boolean;
  factionId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const factions = useStore((s) => s.state.factions);
  const create = useStore((s) => s.createFaction);
  const update = useStore((s) => s.updateFaction);
  const remove = useStore((s) => s.deleteFaction);
  const pushToast = useStore((s) => s.pushToast);

  const editing = factionId ? factions[factionId] : undefined;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setColor(editing.color);
    } else {
      setName("");
      setDescription("");
      setColor("#6366f1");
    }
  }, [open, editing]);

  const onSave = () => {
    if (editing) update(editing.id, { name, description, color });
    else create({ name, description, color });
    pushToast(editing ? "Faction updated" : "Faction created");
    onOpenChange(false);
  };

  const onDelete = () => {
    if (!editing) return;
    if (!confirm(`Delete faction ${name}? Members will lose this faction.`)) return;
    remove(editing.id);
    pushToast("Faction deleted");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={editing ? "Edit Faction" : "New Faction"}>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded border border-[var(--border)] bg-transparent"
            />
            <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-32" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-between pt-2">
          {editing ? (
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
