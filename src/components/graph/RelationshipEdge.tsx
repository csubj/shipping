import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  useInternalNode,
} from "@xyflow/react";
import { useStore } from "@/state/store";
import { valueToBand } from "@/domain/bands";

type Data = {
  relationshipId: string;
  onEdit?: (id: string) => void;
};

/**
 * Compute the point where the line from (cx,cy) toward (tx,ty) exits a
 * rectangle centered at (cx,cy) with half-dimensions (hw, hh).
 * Returns the intersection point on the rectangle boundary.
 */
function rectBoundaryPoint(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  // Scale factor to reach each boundary
  const sx = hw / Math.abs(dx);
  const sy = hh / Math.abs(dy);
  const s = Math.min(sx, sy);

  return { x: cx + dx * s, y: cy + dy * s };
}

/**
 * Build a cubic bezier path string between two points with an organic curve.
 * The control points are offset perpendicular to the direct line, scaled by
 * distance so short edges stay taut and long edges get a gentle bow.
 */
function buildOrganicPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  curvature = 0.25,
): { path: string; labelX: number; labelY: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Perpendicular unit vector
  const nx = -dy / dist;
  const ny = dx / dist;
  const bow = dist * curvature;

  // Control points bowed outward from the direct line
  const cp1x = sx + dx * 0.25 + nx * bow;
  const cp1y = sy + dy * 0.25 + ny * bow;
  const cp2x = sx + dx * 0.75 + nx * bow;
  const cp2y = sy + dy * 0.75 + ny * bow;

  const path = `M${sx},${sy} C${cp1x},${cp1y} ${cp2x},${cp2y} ${tx},${ty}`;
  // Midpoint of bezier at t=0.5
  const labelX = (sx + 3 * cp1x + 3 * cp2x + tx) / 8;
  const labelY = (sy + 3 * cp1y + 3 * cp2y + ty) / 8;

  return { path, labelX, labelY };
}

export function RelationshipEdge(props: EdgeProps) {
  const { id, source, target } = props;
  const data = props.data as Data;
  const rel = useStore((s) => s.state.relationships[data.relationshipId]);
  const bands = useStore((s) => s.state.settings.bands);

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!rel || !sourceNode || !targetNode) return null;

  const band = valueToBand(rel.value, bands);
  const strokeWidth = Math.max(1, Math.min(8, Math.abs(rel.value) / 4 + 1));
  const dashed = rel.value === 0;

  // Measured node dimensions (fall back to sensible defaults)
  const sw = sourceNode.measured?.width ?? 110;
  const sh = sourceNode.measured?.height ?? 40;
  const tw = targetNode.measured?.width ?? 110;
  const th = targetNode.measured?.height ?? 40;

  // Node centers in flow coordinates
  const scx = sourceNode.internals.positionAbsolute.x + sw / 2;
  const scy = sourceNode.internals.positionAbsolute.y + sh / 2;
  const tcx = targetNode.internals.positionAbsolute.x + tw / 2;
  const tcy = targetNode.internals.positionAbsolute.y + th / 2;

  // Boundary exit points
  const srcPt = rectBoundaryPoint(scx, scy, sw / 2, sh / 2, tcx, tcy);
  const tgtPt = rectBoundaryPoint(tcx, tcy, tw / 2, th / 2, scx, scy);

  const { path, labelX, labelY } = buildOrganicPath(srcPt.x, srcPt.y, tgtPt.x, tgtPt.y, 0.18);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: band.color,
          strokeWidth,
          strokeDasharray: dashed ? "4 4" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit?.(rel.id);
          }}
          title="Click to edit relationship"
        >
          <span
            className="shipping-edge-label cursor-pointer"
            style={{ color: band.color, borderColor: `${band.color}66` }}
          >
            {rel.value > 0 ? "+" : ""}
            {rel.value}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
