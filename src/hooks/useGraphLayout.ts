import { forceCenter, forceLink, forceManyBody, forceSimulation, forceCollide } from "d3-force";
import type { AppState } from "@/types/schema";

export type LayoutNode = { id: string; x: number; y: number };

export function computeForceLayout(state: AppState): Record<string, { x: number; y: number }> {
  const characters = Object.values(state.characters);
  if (characters.length === 0) return {};
  const nodes = characters.map((c) => ({
    id: c.id,
    x: c.graphPosition?.x ?? Math.random() * 400,
    y: c.graphPosition?.y ?? Math.random() * 400,
  }));
  const links = Object.values(state.relationships).map((r) => ({
    source: r.a,
    target: r.b,
    value: Math.abs(r.value) + 1,
  }));

  const sim = forceSimulation(nodes as any)
    .force("link", forceLink(links as any).id((d: any) => d.id).distance(140))
    .force("charge", forceManyBody().strength(-300))
    .force("collide", forceCollide(60))
    .force("center", forceCenter(0, 0))
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const result: Record<string, { x: number; y: number }> = {};
  for (const n of nodes as any[]) {
    result[n.id] = { x: n.x, y: n.y };
  }
  return result;
}
