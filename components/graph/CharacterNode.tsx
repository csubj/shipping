import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useStore } from "@/state/store";
import * as Tooltip from "@radix-ui/react-tooltip";
import { NodeHoverCard } from "./NodeHoverCard";

type Data = {
  characterId: string;
};

export function CharacterNode(props: NodeProps) {
  const { id } = props;
  const data = props.data as Data;
  const character = useStore((s) => s.state.characters[data.characterId]);
  const factions = useStore((s) => s.state.factions);
  const selected = useStore((s) => s.selectedNodeIds.includes(id));

  if (!character) return null;
  const isPC = character.kind === "pc";
  const subtitle = isPC ? character.class : character.location;
  const charFactions = character.factionIds.map((fid) => factions[fid]).filter(Boolean);

  // Build conic-gradient ring of faction colors
  const ringStyle =
    charFactions.length === 0
      ? { background: "#94a3b8" }
      : charFactions.length === 1
        ? { background: charFactions[0].color }
        : {
            background: `conic-gradient(${charFactions
              .map((f, i) => {
                const start = (i / charFactions.length) * 360;
                const end = ((i + 1) / charFactions.length) * 360;
                return `${f.color} ${start}deg ${end}deg`;
              })
              .join(",")})`,
          };

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="relative" style={{ minWidth: 100 }}>
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            {/* Faction ring */}
            <div
              className="absolute -inset-1 rounded-[14px]"
              style={{ ...ringStyle, padding: 3 }}
            >
              <div
                className={
                  "h-full w-full bg-[var(--bg)] " +
                  (isPC ? "rounded-[10px]" : "rounded-full")
                }
              />
            </div>
            <div
              className={
                "relative z-10 flex flex-col items-center justify-center px-3 py-2 text-center " +
                (isPC ? "rounded-[10px]" : "rounded-full") +
                " bg-[var(--card)] text-[var(--fg)] border " +
                (selected
                  ? "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.35)]"
                  : "border-[var(--border)]")
              }
              style={{ minWidth: 100, minHeight: isPC ? undefined : 80 }}
            >
              <div className="text-xs font-semibold leading-tight">
                {character.firstName} {character.lastName}
              </div>
              <div className="text-[10px] text-[var(--muted)] leading-tight">
                {isPC ? `(${subtitle || "PC"})` : `(${subtitle || "NPC"})`}
              </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-[60] max-w-[360px] rounded border border-[var(--border)] bg-[var(--bg)] p-3 text-xs shadow-xl"
          >
            <NodeHoverCard characterId={data.characterId} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
