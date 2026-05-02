import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { CharactersTable } from "./CharactersTable";
import { RelationshipsTable } from "./RelationshipsTable";
import { FactionsTable } from "./FactionsTable";
import { FactionAffinityTable } from "./FactionAffinityTable";

type Sub = "characters" | "relationships" | "factions" | "affinity";

export function TableView({
  onEditCharacter,
  onEditRelationship,
  onOpenInGraph,
}: {
  onEditCharacter: (id?: string, kind?: "pc" | "npc") => void;
  onEditRelationship: (id?: string) => void;
  onOpenInGraph: (id: string) => void;
}) {
  const [sub, setSub] = useState<Sub>("characters");
  return (
    <div className="p-3">
      <Tabs.Root value={sub} onValueChange={(v) => setSub(v as Sub)}>
        <Tabs.List className="mb-3 flex gap-1 border-b border-[var(--border)]">
          {[
            { v: "characters", label: "Characters" },
            { v: "relationships", label: "Relationships" },
            { v: "factions", label: "Factions" },
            { v: "affinity", label: "Faction Affinity" },
          ].map((t) => (
            <Tabs.Trigger
              key={t.v}
              value={t.v}
              className="rounded-t-md px-3 py-1.5 text-sm data-[state=active]:bg-[var(--card)] data-[state=active]:font-semibold"
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="characters">
          <CharactersTable onEdit={onEditCharacter} onOpenInGraph={onOpenInGraph} />
        </Tabs.Content>
        <Tabs.Content value="relationships">
          <RelationshipsTable onEdit={onEditRelationship} onOpenInGraph={onOpenInGraph} />
        </Tabs.Content>
        <Tabs.Content value="factions">
          <FactionsTable />
        </Tabs.Content>
        <Tabs.Content value="affinity">
          <FactionAffinityTable />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
