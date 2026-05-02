import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useStore } from "@/state/store";
import type { Character } from "@/types/schema";

export function CharacterEditor({
  open,
  characterId,
  initialKind,
  onOpenChange,
}: {
  open: boolean;
  characterId?: string;
  initialKind: "pc" | "npc";
  onOpenChange: (open: boolean) => void;
}) {
  const characters = useStore((s) => s.state.characters);
  const factions = useStore((s) => s.state.factions);
  const create = useStore((s) => s.createCharacter);
  const update = useStore((s) => s.updateCharacter);
  const remove = useStore((s) => s.deleteCharacter);
  const pushToast = useStore((s) => s.pushToast);

  const editing = characterId ? characters[characterId] : undefined;

  const [kind, setKind] = useState<"pc" | "npc">(initialKind);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [classOrLocation, setClassOrLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [factionIds, setFactionIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.kind);
      setFirstName(editing.firstName);
      setLastName(editing.lastName);
      setClassOrLocation(editing.kind === "pc" ? editing.class : editing.location);
      setNotes(editing.notes);
      setFactionIds(editing.factionIds);
    } else {
      setKind(initialKind);
      setFirstName("");
      setLastName("");
      setClassOrLocation("");
      setNotes("");
      setFactionIds([]);
    }
  }, [open, editing, initialKind]);

  const onSave = () => {
    if (editing) {
      const patch: Partial<Character> =
        kind === "pc"
          ? { kind: "pc", firstName, lastName, class: classOrLocation, notes, factionIds }
          : { kind: "npc", firstName, lastName, location: classOrLocation, notes, factionIds };
      update(editing.id, patch as Partial<Character>);
      pushToast("Character updated");
    } else {
      const base = { firstName, lastName, notes, factionIds };
      const created =
        kind === "pc"
          ? { ...base, kind: "pc" as const, class: classOrLocation }
          : { ...base, kind: "npc" as const, location: classOrLocation };
      create(created);
      pushToast(`Created ${kind.toUpperCase()}`);
    }
    onOpenChange(false);
  };

  const onDelete = () => {
    if (!editing) return;
    if (!confirm(`Delete ${firstName} ${lastName}? This will also remove their relationships.`))
      return;
    remove(editing.id);
    pushToast("Character deleted");
    onOpenChange(false);
  };

  const toggleFaction = (id: string) =>
    setFactionIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Character" : `New ${kind.toUpperCase()}`}
    >
      <div className="space-y-3">
        {!editing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={kind === "pc" ? "primary" : "secondary"}
              onClick={() => setKind("pc")}
            >
              PC
            </Button>
            <Button
              size="sm"
              variant={kind === "npc" ? "primary" : "secondary"}
              onClick={() => setKind("npc")}
            >
              NPC
            </Button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[var(--muted)]">First name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)]">Last name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">
            {kind === "pc" ? "Class" : "Location"}
          </label>
          <Input value={classOrLocation} onChange={(e) => setClassOrLocation(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {Object.values(factions).length > 0 && (
          <div>
            <label className="text-xs text-[var(--muted)]">Factions</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.values(factions).map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleFaction(f.id)}
                  className={
                    "rounded-full px-2 py-1 text-xs border " +
                    (factionIds.includes(f.id)
                      ? "border-transparent text-white"
                      : "border-[var(--border)] text-[var(--fg)]")
                  }
                  style={{
                    backgroundColor: factionIds.includes(f.id) ? f.color : "transparent",
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}
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
