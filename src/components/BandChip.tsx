import { useStore } from "@/state/store";
import { valueToBand } from "@/domain/bands";

export function BandChip({ value, showValue = false }: { value: number; showValue?: boolean }) {
  const bands = useStore((s) => s.state.settings.bands);
  const band = valueToBand(value, bands);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${band.color}22`,
        color: band.color,
        border: `1px solid ${band.color}66`,
      }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: band.color }}
      />
      {band.name}
      {showValue && <span className="text-[var(--muted)]">({value})</span>}
    </span>
  );
}
