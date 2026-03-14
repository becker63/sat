import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type XYPosition,
} from "@xyflow/react";
import { reactFlowTheme } from "@/theme/react-flow";
import { useRef } from "react";
import { motion } from "framer-motion";
import { graphEdgeClass, graphEdgeLabelClass } from "@/components/GraphEdgeStyles";

export function AnimatedGraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const animateOnMount = Boolean((data as any)?.animateOnMount);
  const label = (data as any)?.kind ?? (data as any)?.label;
  const hasAnimated = useRef(false);
  const shouldAnimate = animateOnMount && !hasAnimated.current;
  if (shouldAnimate) {
    hasAnimated.current = true;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <g data-testid="graph-edge">
      {shouldAnimate ? (
        <motion.path
          id={id}
          d={edgePath}
          className={graphEdgeClass}
          markerEnd={markerEnd}
          data-animate="true"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      ) : (
        <BaseEdge
          id={id}
          path={edgePath}
          className={graphEdgeClass}
          markerEnd={markerEnd}
          data-animate="false"
        />
      )}

      {label ? (
        <EdgeLabelRenderer>
          <div
            className={graphEdgeLabelClass}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );
}
