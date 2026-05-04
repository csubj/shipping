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
  ConnectionMode,
} from "@xyflow/react";
import { useStore } from "@/state/store";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { GraphFilters, defaultFilterState, type GraphFilterState } from "./GraphFilters";
import { Button } from "@/components/ui/Button";
import { computeForceLayout } from "@/hooks/useGraphLayout";
import { charactersActiveInRange } from "@/state/selectors";

const nodeTypes = { character: CharacterNode };
const edgeTypes = { relationship: RelationshipEdge };

type Props = {
  onEditRelationship: (relationshipId?: string, aId?: string, bId?: string) => void;
  onEditCharacter: (characterId: string) => void;
};

function edgePassesAbsFilter(absVal: number, filters: GraphFilterState): boolean {
  const { absMin, absMax, absMinInclusive, absMaxInclusive } = filters;
  if (absMin !== null) {
    if (absMinInclusive ? absVal < absMin : absVal <= absMin) return false;
  }
  if (absMax !== null) {
    if (absMaxInclusive ? absVal > absMax : absVal >= absMax) return false;
  }
  return true;
}

function resolveFilterDates(filters: GraphFilterState): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (filters.datePreset === "7d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from, to: now };
  }
  if (filters.datePreset === "30d") {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from, to: now };
  }
  if (filters.datePreset === "custom") {
    const from = filters.customFrom ? new Date(filters.customFrom) : null;
    const to = filters.customTo ? new Date(`${filters.customTo}T23:59:59`) : null;
    return { from, to };
  }
  return { from: null, to: null };
}

function GraphInner({ onEditRelationship, onEditCharacter }: Props) {
  const characters = useStore((s) => s.state.characters);
  const relationships = useStore((s) => s.state.relationships);
  const appState = useStore((s) => s.state);
  const setCharacterPosition = useStore((s) => s.setCharacterPosition);
  const setSelectedNodes = useStore((s) => s.setSelectedNodes);
  const selected = useStore((s) => s.selectedNodeIds);
  const createRelationship = useStore((s) => s.createRelationship);
  const pushToast = useStore((s) => s.pushToast);

  const [showMinimap, setShowMinimap] = useState(true);
  const [addLinkMode, setAddLinkMode] = useState(false);
  const [linkFirst, setLinkFirst] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFilterState>(defaultFilterState);
  const flow = useReactFlow();

  // Compute the set of visible character IDs given the current filters
  const visibleCharacterIds = useMemo<Set<string> | null>(() => {
    const { from, to } = resolveFilterDates(filters);
    const byDate = charactersActiveInRange(appState, from, to);

    const hasFactionFilter =
      filters.selectedFactionIds.size > 0 || !filters.showUnaffiliated;

    if (!byDate && !hasFactionFilter) return null; // show all

    let ids: Set<string>;

    // Start with date-filtered set or all characters
    if (byDate) {
      ids = new Set(byDate);
    } else {
      ids = new Set(Object.keys(characters));
    }

    // Apply faction filter (intersect)
    if (hasFactionFilter) {
      for (const cid of Array.from(ids)) {
        const char = characters[cid];
        if (!char) { ids.delete(cid); continue; }

        const hasNoFaction = char.factionIds.length === 0;
        if (hasNoFaction) {
          if (!filters.showUnaffiliated) ids.delete(cid);
          continue;
        }

        if (filters.selectedFactionIds.size > 0) {
          const inSelected = char.factionIds.some((fid) =>
            filters.selectedFactionIds.has(fid)
          );
          if (!inSelected) ids.delete(cid);
        }
      }
    }

    return ids;
  }, [filters, appState, characters]);

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

  // Apply visibility filter to nodes and edges
  const visibleNodes = useMemo<Node[]>(() => {
    if (!visibleCharacterIds) return nodes;
    return nodes.map((n) => ({
      ...n,
      hidden: !visibleCharacterIds.has(n.id),
    }));
  }, [nodes, visibleCharacterIds]);

  const edges = useMemo<Edge[]>(
    () =>
      Object.values(relationships).map((r) => {
        const absVal = Math.abs(r.value);
        const hiddenByEndpoint = visibleCharacterIds
          ? !visibleCharacterIds.has(r.a) || !visibleCharacterIds.has(r.b)
          : false;
        return {
          id: r.id,
          source: r.a,
          target: r.b,
          type: "relationship",
          data: { relationshipId: r.id, onEdit: (id: string) => onEditRelationship(id) },
          hidden: hiddenByEndpoint || !edgePassesAbsFilter(absVal, filters),
        };
      }),
    [relationships, onEditRelationship, visibleCharacterIds, filters],
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
      // #region agent log
      fetch('http://127.0.0.1:7626/ingest/7c500993-eebb-43b3-8692-571e9bca6b0c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f12cc'},body:JSON.stringify({sessionId:'3f12cc',location:'GraphView.tsx:onNodeClick',message:'onNodeClick fired',data:{nodeId:n.id,addLinkMode,linkFirst},hypothesisId:'H-D',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
    (_e: React.MouseEvent, n: Node) => {
      // #region agent log
      fetch('http://127.0.0.1:7626/ingest/7c500993-eebb-43b3-8692-571e9bca6b0c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3f12cc'},body:JSON.stringify({sessionId:'3f12cc',location:'GraphView.tsx:onNodeDoubleClick',message:'onNodeDoubleClick fired',data:{nodeId:n.id},hypothesisId:'H-C',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      onEditCharacter(n.id);
    },
    [onEditCharacter],
  );

  const onAutoLayout = useCallback(() => {
    const positions = computeForceLayout({
      ...({ characters, relationships } as any),
    } as any);
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
      <div className="absolute left-2 top-2 z-10 flex flex-wrap items-center gap-2 rounded border border-[var(--border)] bg-[var(--card)] p-1 shadow">
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
        <div className="h-6 w-px bg-[var(--border)]" />
        <GraphFilters filters={filters} onChange={setFilters} />
      </div>
      <ReactFlow
        nodes={visibleNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        connectionMode={ConnectionMode.Loose}
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
