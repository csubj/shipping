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
  /** abs-value range filter on Math.abs(rel.value); null = no bound */
  absMin: number | null;
  absMax: number | null;
  absMinInclusive: boolean;
  absMaxInclusive: boolean;
};

export function defaultFilterState(): GraphFilterState {
  return {
    selectedFactionIds: new Set(),
    showUnaffiliated: true,
    datePreset: null,
    customFrom: "",
    customTo: "",
    absMin: null,
    absMax: null,
    absMinInclusive: true,
    absMaxInclusive: true,
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
  const hasAbsFilter = filters.absMin !== null || filters.absMax !== null;
  const isActive = hasFactionFilter || hasDateFilter || hasAbsFilter;

  const absLo = filters.absMin ?? 0;
  const absHi = filters.absMax ?? 30;
  const loPercent = (absLo / 30) * 100;
  const hiPercent = (absHi / 30) * 100;

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
            {(filters.selectedFactionIds.size > 0 ? 1 : 0) + (hasDateFilter ? 1 : 0) + (hasAbsFilter ? 1 : 0)}
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

          <div className="mt-3 border-t border-[var(--border)]" />

          {/* Relationship strength section */}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Relationship Strength
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={hasAbsFilter}
                onClick={() => {
                  if (hasAbsFilter) {
                    onChange({ ...filters, absMin: null, absMax: null, absMinInclusive: true, absMaxInclusive: true });
                  } else {
                    onChange({ ...filters, absMin: 0, absMax: 30 });
                  }
                }}
                className={
                  "relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors " +
                  (hasAbsFilter ? "bg-indigo-500" : "bg-[var(--border)]")
                }
                title={hasAbsFilter ? "Disable strength filter" : "Enable strength filter"}
              >
                <span
                  className={
                    "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform " +
                    (hasAbsFilter ? "translate-x-3.5" : "translate-x-0.5")
                  }
                />
              </button>
            </div>

            <div className={hasAbsFilter ? "" : "pointer-events-none select-none opacity-40"}>
              {/* Dual-range slider */}
              <div className="relative mx-1 mt-1 h-5">
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
                  style={{
                    background: `linear-gradient(to right, var(--border) ${loPercent}%, rgb(99 102 241) ${loPercent}%, rgb(99 102 241) ${hiPercent}%, var(--border) ${hiPercent}%)`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={absLo}
                  onChange={(e) => {
                    const v = Math.min(Number(e.target.value), absHi);
                    onChange({ ...filters, absMin: v });
                  }}
                  className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-indigo-400 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow"
                />
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={absHi}
                  onChange={(e) => {
                    const v = Math.max(Number(e.target.value), absLo);
                    onChange({ ...filters, absMax: v });
                  }}
                  className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-indigo-400 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:shadow"
                />
              </div>

              {/* Value labels + inclusive/exclusive toggles */}
              <div className="mt-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, absMinInclusive: !filters.absMinInclusive })}
                    className={
                      "rounded border px-1 py-0.5 text-[9px] transition-colors " +
                      (filters.absMinInclusive
                        ? "border-indigo-400 bg-indigo-500/10 text-indigo-400"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--fg)]")
                    }
                    title={filters.absMinInclusive ? "Inclusive (≥) — click for exclusive (>)" : "Exclusive (>) — click for inclusive (≥)"}
                  >
                    {filters.absMinInclusive ? "≥" : ">"}
                  </button>
                  <span className="min-w-[1.25rem] text-center text-[10px] tabular-nums text-[var(--fg)]">
                    {absLo}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="min-w-[1.25rem] text-center text-[10px] tabular-nums text-[var(--fg)]">
                    {absHi}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, absMaxInclusive: !filters.absMaxInclusive })}
                    className={
                      "rounded border px-1 py-0.5 text-[9px] transition-colors " +
                      (filters.absMaxInclusive
                        ? "border-indigo-400 bg-indigo-500/10 text-indigo-400"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--fg)]")
                    }
                    title={filters.absMaxInclusive ? "Inclusive (≤) — click for exclusive (<)" : "Exclusive (<) — click for inclusive (≤)"}
                  >
                    {filters.absMaxInclusive ? "≤" : "<"}
                  </button>
                </div>
              </div>
            </div>
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
