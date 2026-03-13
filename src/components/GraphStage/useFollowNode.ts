import { useCallback } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { NODE_HEIGHT, NODE_WIDTH } from "@/graph/layoutGraph";

export function useFollowNode(
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoom: number,
) {
  const rf = useReactFlow();

  return useCallback(
    (node: Node) => {
      if (!containerRef.current) return;

      const nodeCenterX = node.position.x + NODE_WIDTH / 2;
      const nodeCenterY = node.position.y + NODE_HEIGHT / 2;

      rf.setCenter(nodeCenterX, nodeCenterY, {
        zoom,
        duration: 500,
      });
    },
    [rf, zoom, containerRef],
  );
}
