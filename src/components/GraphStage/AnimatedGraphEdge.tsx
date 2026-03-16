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
  const isPrimary =
    (data as any)?.primary ?? ((data as any)?.kind ? (data as any)?.kind === "calls" : true);
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
    <g data-testid="graph-edge" data-primary={isPrimary ? "true" : "false"}>
      {shouldAnimate ? (
        <motion.circle
          cx={sourceX}
          cy={sourceY}
          r={12}
          fill="none"
          stroke="var(--colors-vercel-brand-9)"
          strokeWidth="2"
          pointerEvents="none"
          initial={{ opacity: 0.7, r: 6 }}
          animate={{ opacity: 0, r: 18 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ) : null}

      {shouldAnimate ? (
        <motion.path
          id={id}
          d={edgePath}
          className={graphEdgeClass({ emphasis: isPrimary ? "primary" : "secondary" })}
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
          className={graphEdgeClass({ emphasis: isPrimary ? "primary" : "secondary" })}
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
