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

      const rect = containerRef.current.getBoundingClientRect();
      const nodeCenterX = node.position.x + NODE_WIDTH / 2;
      const nodeCenterY = node.position.y + NODE_HEIGHT / 2;

      const targetZoom = Math.min(
        1,
        Math.max(0.8, rf.getViewport().zoom ?? zoom ?? 1),
      );

      rf.setCenter(nodeCenterX, nodeCenterY, {
        zoom: targetZoom,
        duration: 450,
      });

      setTimeout(() => {
        const screen = rf.flowToScreenPosition({ x: nodeCenterX, y: nodeCenterY });
        const padding = 48;
        let dx = 0;
        let dy = 0;

        if (screen.x < padding) dx = screen.x - padding;
        else if (screen.x > rect.width - padding) dx = screen.x - (rect.width - padding);

        if (screen.y < padding) dy = screen.y - padding;
        else if (screen.y > rect.height - padding) dy = screen.y - (rect.height - padding);

        if (dx !== 0 || dy !== 0) {
          const viewport = rf.getViewport();
          rf.setViewport(
            { x: viewport.x - dx, y: viewport.y - dy, zoom: viewport.zoom },
            { duration: 200 },
          );
        }
      }, 480);
    },
    [rf, containerRef, zoom],
  );
}
