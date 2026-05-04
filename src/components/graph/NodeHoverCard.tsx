import { useStore } from "@/state/store";
import {
  characterFullName,
  recentAdjustments,
  relationshipsForCharacter,
  otherInRelationship,
} from "@/state/selectors";
import { valueToBand } from "@/domain/bands";

export function NodeHoverCard({ characterId }: { characterId: string }) {
  const state = useStore((s) => s.state);
  const character = state.characters[characterId];
  if (!character) return null;
  const factions = character.factionIds.map((id) => state.factions[id]).filter(Boolean);

  const allRels = relationshipsForCharacter(state, characterId);
  const sortedRels = [...allRels].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const topRels = sortedRels.slice(0, 3);
  const hiddenCount = sortedRels.length - topRels.length;

  const grouped = new Map<string, { name: string; color: string; names: string[] }>();
  for (const r of topRels) {
    const band = valueToBand(r.value, state.settings.bands);
    const otherId = otherInRelationship(r, characterId);
    const other = state.characters[otherId];
    if (!other) continue;
    const key = band.id;
    const existing = grouped.get(key) ?? { name: band.name, color: band.color, names: [] };
    existing.names.push(characterFullName(other));
    grouped.set(key, existing);
  }

  const recent = recentAdjustments(state, characterId, 5);

  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-semibold">
          {characterFullName(character)} · {character.kind === "pc" ? character.class : character.location}{" "}
          ({character.kind.toUpperCase()})
        </div>
        {factions.length > 0 && (
          <div className="text-[var(--muted)]">
            Factions: {factions.map((f) => f.name).join(", ")}
          </div>
        )}
        {character.notes && (
          <div className="mt-1 text-[var(--muted)]">"{character.notes}"</div>
        )}
      </div>
      {grouped.size > 0 && (
        <div className="border-t border-[var(--border)] pt-2">
          {Array.from(grouped.values()).map((g) => (
            <div key={g.name}>
              <span style={{ color: g.color, fontWeight: 600 }}>
                {g.name} ({g.names.length}):
              </span>{" "}
              <span>{g.names.join(", ")}</span>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="mt-1 text-[var(--muted)]">+{hiddenCount} more</div>
          )}
        </div>
      )}
      {recent.length > 0 && (
        <div className="border-t border-[var(--border)] pt-2">
          <div className="text-[var(--muted)]">Recent changes:</div>
          {recent.map((a, i) => {
            const other = state.characters[a.other];
            return (
              <div key={i}>
                {a.delta > 0 ? "+" : ""}
                {a.delta} · {a.reason} · {other ? characterFullName(other) : "?"} ·{" "}
                {new Date(a.at).toLocaleDateString()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
