import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useStore } from "@/state/store";
import * as Tooltip from "@radix-ui/react-tooltip";
import { NodeHoverCard } from "./NodeHoverCard";

type Data = {
  characterId: string;
};

function PCIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shield with sword */}
      <path
        d="M8 1L2 3.5V8.5C2 11.8 4.7 14.5 8 15.5C11.3 14.5 14 11.8 14 8.5V3.5L8 1Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M8 4V12M6 6L10 10M10 6L6 10"
        stroke="var(--bg)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NPCIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Speech scroll */}
      <path
        d="M2 2.5C2 2 2.5 1.5 3 1.5H13C13.5 1.5 14 2 14 2.5V10.5C14 11 13.5 11.5 13 11.5H9L7 14L5 11.5H3C2.5 11.5 2 11 2 10.5V2.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M5 5H11M5 7.5H9"
        stroke="var(--bg)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

  const selectionStyles = selected
    ? "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.35)]"
    : "border-[var(--border)]";

  if (isPC) {
    return (
      <Tooltip.Provider delayDuration={300}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="relative" style={{ minWidth: 110 }}>
              <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
              <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
              {/* Faction ring */}
              <div
                className="absolute -inset-1 rounded-[14px]"
                style={{ ...ringStyle, padding: 3 }}
              >
                <div className="h-full w-full rounded-[10px] bg-[var(--bg)]" />
              </div>
              {/* Card */}
              <div
                className={
                  "relative z-10 flex flex-col items-center justify-center px-3 py-2 text-center " +
                  "rounded-[10px] bg-[var(--card)] text-[var(--fg)] border-2 " +
                  selectionStyles
                }
                style={{ minWidth: 110 }}
              >
                {/* PC badge */}
                <div
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow"
                  title="Player Character"
                >
                  <PCIcon />
                </div>
                <div className="text-xs font-semibold leading-tight">
                  {character.firstName} {character.lastName}
                </div>
                <div className="text-[10px] text-[var(--muted)] leading-tight">
                  {subtitle || "PC"}
                </div>
              </div>
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

  // NPC: hexagonal shape via clip-path
  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="relative" style={{ width: 110, height: 88 }}>
            <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
            {/* Faction ring layer (slightly larger hexagon) */}
            <div
              className="absolute inset-0"
              style={{
                ...ringStyle,
                clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                inset: "-3px",
                position: "absolute",
              }}
            />
            {/* BG gap layer */}
            <div
              className="absolute bg-[var(--bg)]"
              style={{
                clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                inset: 0,
              }}
            />
            {/* Inner content hexagon */}
            <div
              className={
                "absolute inset-0 flex flex-col items-center justify-center text-center " +
                "bg-[var(--card)] text-[var(--fg)] " +
                (selected ? "ring-2 ring-indigo-500 ring-offset-1" : "")
              }
              style={{
                clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
                border: selected ? undefined : "1px dashed var(--border)",
                inset: "1px",
              }}
            >
              {/* NPC badge */}
              <div
                className="absolute top-2 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow"
                title="Non-Player Character"
              >
                <NPCIcon />
              </div>
              <div className="text-xs font-semibold leading-tight px-1">
                {character.firstName} {character.lastName}
              </div>
              <div className="text-[10px] text-[var(--muted)] leading-tight">
                {subtitle || "NPC"}
              </div>
            </div>
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
