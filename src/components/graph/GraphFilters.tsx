import { useMemo, useState } from "react";
import { useStore } from "@/state/store";
import type { Faction } from "@/types/schema";

export type DatePreset = "7d" | "30d" | "custom" | null;

export type GraphFilterState = {
  /** faction IDs that are toggled ON; empty set = all factions visible */
  selectedFactionIds: Set<string>;
  /** show characters with no faction membership */
  showUnaffiliated: boolean;
  datePreset: DatePreset;
  customFrom: string;
  customTo: string;
};

export function defaultFilterState(): GraphFilterState {
  return {
    selectedFactionIds: new Set(),
    showUnaffiliated: true,
    datePreset: null,
    customFrom: "",
    customTo: "",
  };
}

type Props = {
  filters: GraphFilterState;
  onChange: (next: GraphFilterState) => void;
};

function FactionChip({
  faction,
  active,
  onToggle,
}: {
  faction: Faction;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-opacity " +
        (active ? "opacity-100" : "opacity-40")
      }
      style={{
        borderColor: faction.color,
        color: active ? faction.color : "var(--muted)",
        background: active ? `${faction.color}18` : "transparent",
      }}
      title={active ? `Hide ${faction.name}` : `Show only ${faction.name}`}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{ background: faction.color }}
      />
      {faction.name}
    </button>
  );
}

export function GraphFilters({ filters, onChange }: Props) {
  const factionsMap = useStore((s) => s.state.factions);
  const factions = useMemo(() => Object.values(factionsMap), [factionsMap]);
  const [open, setOpen] = useState(false);

  const hasFactionFilter = filters.selectedFactionIds.size > 0 || !filters.showUnaffiliated;
  const hasDateFilter = filters.datePreset !== null;
  const isActive = hasFactionFilter || hasDateFilter;

  function toggleFaction(fid: string) {
    const next = new Set(filters.selectedFactionIds);
    if (next.has(fid)) {
      next.delete(fid);
    } else {
      next.add(fid);
    }
    onChange({ ...filters, selectedFactionIds: next });
  }

  function setDatePreset(preset: DatePreset) {
    onChange({ ...filters, datePreset: preset, customFrom: "", customTo: "" });
  }

  function clearAll() {
    onChange(defaultFilterState());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors " +
          (isActive
            ? "border-indigo-400 bg-indigo-500/10 text-indigo-400"
            : "border-[var(--border)] bg-[var(--card)] text-[var(--fg)] hover:bg-[var(--border)]")
        }
        title="Graph filters"
      >
        <FilterIcon />
        Filters
        {isActive && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
            {(filters.selectedFactionIds.size > 0 ? 1 : 0) + (hasDateFilter ? 1 : 0)}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-20 w-72 rounded border border-[var(--border)] bg-[var(--bg)] p-3 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Faction section */}
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Factions
              </span>
              {filters.selectedFactionIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...filters, selectedFactionIds: new Set() })}
                  className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  Clear
                </button>
              )}
            </div>
            {factions.length === 0 ? (
              <p className="text-[10px] text-[var(--muted)] italic">No factions defined yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {factions.map((f) => (
                  <FactionChip
                    key={f.id}
                    faction={f}
                    active={
                      filters.selectedFactionIds.size === 0 ||
                      filters.selectedFactionIds.has(f.id)
                    }
                    onToggle={() => toggleFaction(f.id)}
                  />
                ))}
              </div>
            )}
            {factions.length > 0 && (
              <label className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={filters.showUnaffiliated}
                  onChange={(e) => onChange({ ...filters, showUnaffiliated: e.target.checked })}
                  className="h-3 w-3"
                />
                Show unaffiliated characters
              </label>
            )}
          </div>

          <div className="mb-3 border-t border-[var(--border)]" />

          {/* Date range section */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Recent Activity
              </span>
              {hasDateFilter && (
                <button
                  type="button"
                  onClick={() => setDatePreset(null)}
                  className="text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { preset: "7d" as DatePreset, label: "Last 7 days" },
                  { preset: "30d" as DatePreset, label: "Last 30 days" },
                  { preset: "custom" as DatePreset, label: "Custom…" },
                ] as const
              ).map(({ preset, label }) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setDatePreset(filters.datePreset === preset ? null : preset)
                  }
                  className={
                    "rounded border px-2 py-0.5 text-[10px] transition-colors " +
                    (filters.datePreset === preset
                      ? "border-indigo-400 bg-indigo-500/10 text-indigo-400"
                      : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--fg)]")
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            {filters.datePreset === "custom" && (
              <div className="mt-2 flex flex-col gap-1">
                <label className="text-[10px] text-[var(--muted)]">
                  From
                  <input
                    type="date"
                    value={filters.customFrom}
                    onChange={(e) => onChange({ ...filters, customFrom: e.target.value })}
                    className="ml-2 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-[10px] text-[var(--fg)]"
                  />
                </label>
                <label className="text-[10px] text-[var(--muted)]">
                  To&nbsp;&nbsp;&nbsp;
                  <input
                    type="date"
                    value={filters.customTo}
                    onChange={(e) => onChange({ ...filters, customTo: e.target.value })}
                    className="ml-2 rounded border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 text-[10px] text-[var(--fg)]"
                  />
                </label>
              </div>
            )}
          </div>

          {isActive && (
            <>
              <div className="mt-3 border-t border-[var(--border)]" />
              <button
                type="button"
                onClick={clearAll}
                className="mt-2 w-full rounded border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--muted)] hover:text-[var(--fg)]"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 3h12M4 7h8M6.5 11h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
