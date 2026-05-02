import { FactionsTable } from "./table/FactionsTable";
import { FactionAffinityTable } from "./table/FactionAffinityTable";

export function FactionsView() {
  return (
    <div className="space-y-6 p-3">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">Factions</h2>
        <FactionsTable />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--muted)]">
          Faction Affinity
        </h2>
        <FactionAffinityTable />
      </section>
    </div>
  );
}
