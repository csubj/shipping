import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useStore } from "@/state/store";
import { valueToBand } from "@/domain/bands";

type Data = {
  relationshipId: string;
  onEdit?: (id: string) => void;
};

export function RelationshipEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const data = props.data as Data;
  const rel = useStore((s) => s.state.relationships[data.relationshipId]);
  const bands = useStore((s) => s.state.settings.bands);

  if (!rel) return null;
  const band = valueToBand(rel.value, bands);
  const width = Math.max(1, Math.min(8, Math.abs(rel.value) / 4 + 1));
  const dashed = rel.value === 0;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: band.color,
          strokeWidth: width,
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
