import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  applyNodeChanges,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useStore } from "@/state/store";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { Button } from "@/components/ui/Button";
import { computeForceLayout } from "@/hooks/useGraphLayout";

const nodeTypes = { character: CharacterNode };
const edgeTypes = { relationship: RelationshipEdge };

type Props = {
  onEditRelationship: (relationshipId?: string, aId?: string, bId?: string) => void;
  onEditCharacter: (characterId: string) => void;
};

function GraphInner({ onEditRelationship, onEditCharacter }: Props) {
  const characters = useStore((s) => s.state.characters);
  const relationships = useStore((s) => s.state.relationships);
  const setCharacterPosition = useStore((s) => s.setCharacterPosition);
  const setSelectedNodes = useStore((s) => s.setSelectedNodes);
  const selected = useStore((s) => s.selectedNodeIds);
  const createRelationship = useStore((s) => s.createRelationship);
  const pushToast = useStore((s) => s.pushToast);

  const [showMinimap, setShowMinimap] = useState(true);
  const [addLinkMode, setAddLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState<string | null>(null);
  const flow = useReactFlow();

  // Build nodes/edges from store
  const initialNodes = useMemo<Node[]>(
    () =>
      Object.values(characters).map((c, i) => ({
        id: c.id,
        type: "character",
        position: c.graphPosition ?? { x: (i % 6) * 180, y: Math.floor(i / 6) * 140 },
        data: { characterId: c.id },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Object.keys(characters).join(",")],
  );

  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  // When characters change shape (added/removed), rebuild nodes preserving positions
  const charactersKey = Object.keys(characters).sort().join(",");
  const lastKey = useRef(charactersKey);
  if (lastKey.current !== charactersKey) {
    lastKey.current = charactersKey;
    setNodes(initialNodes);
  }

  const edges = useMemo<Edge[]>(
    () =>
      Object.values(relationships).map((r) => ({
        id: r.id,
        source: r.a,
        target: r.b,
        type: "relationship",
        data: { relationshipId: r.id, onEdit: (id: string) => onEditRelationship(id) },
      })),
    [relationships, onEditRelationship],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      for (const ch of changes) {
        if (ch.type === "position" && !ch.dragging && ch.position) {
          setCharacterPosition(ch.id, ch.position.x, ch.position.y);
        }
      }
    },
    [setCharacterPosition],
  );

  const onNodeClick = useCallback(
    (_e: React.MouseEvent, n: Node) => {
      if (addLinkMode) {
        if (!linkFirst) {
          setLinkFirst(n.id);
          pushToast("Pick second character...");
        } else if (linkFirst !== n.id) {
          const id = createRelationship(linkFirst, n.id, 0, "");
          setLinkFirst(null);
          setAddLinkMode(false);
          onEditRelationship(id);
        }
        return;
      }
      const next = [...selected.filter((id) => id !== n.id), n.id];
      setSelectedNodes(next);
    },
    [addLinkMode, linkFirst, selected, setSelectedNodes, createRelationship, onEditRelationship, pushToast],
  );

  const onNodeDoubleClick = useCallback(
    (_e: React.MouseEvent, n: Node) => onEditCharacter(n.id),
    [onEditCharacter],
  );

  const onAutoLayout = useCallback(() => {
    const positions = computeForceLayout({
      ...({ characters, relationships } as any),
    } as any);
    // commit to store and update local nodes
    setNodes((nds) =>
      nds.map((n) => {
        const p = positions[n.id];
        if (!p) return n;
        return { ...n, position: { x: p.x, y: p.y } };
      }),
    );
    for (const [id, p] of Object.entries(positions)) {
      setCharacterPosition(id, p.x, p.y);
    }
    setTimeout(() => flow.fitView({ duration: 400, padding: 0.2 }), 0);
  }, [characters, relationships, setCharacterPosition, flow]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute left-2 top-2 z-10 flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] p-1 shadow">
        <Button
          size="sm"
          variant={addLinkMode ? "primary" : "ghost"}
          onClick={() => {
            setAddLinkMode((v) => !v);
            setLinkFirst(null);
          }}
        >
          {addLinkMode ? "Cancel link" : "Add Link"}
        </Button>
        <div className="h-6 w-px bg-[var(--border)]" />
        <Button size="sm" variant="ghost" onClick={onAutoLayout}>Auto-layout</Button>
        <Button size="sm" variant="ghost" onClick={() => flow.fitView({ duration: 300 })}>
          Fit View
        </Button>
        <div className="h-6 w-px bg-[var(--border)]" />
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={showMinimap}
            onChange={(e) => setShowMinimap(e.target.checked)}
          />
          Minimap
        </label>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
        {showMinimap && <MiniMap pannable zoomable />}
      </ReactFlow>
    </div>
  );
}

export function GraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}
