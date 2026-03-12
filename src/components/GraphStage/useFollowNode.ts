import { useCallback } from "react";
import { useReactFlow, type Node } from "@xyflow/react";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 40;

export function useFollowNode(
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoom: number,
) {
  const rf = useReactFlow();

  return useCallback(
    (node: Node) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const width = rect.width;
      const height = rect.height;

      const nodeCenter = {
        x: node.position.x + NODE_WIDTH / 2,
        y: node.position.y + NODE_HEIGHT / 2,
      };

      const screen = rf.flowToScreenPosition(nodeCenter);

      const marginX = width * 0.25;
      const marginY = height * 0.25;

      let dx = 0;
      let dy = 0;

      if (screen.x < marginX) {
        dx = screen.x - marginX;
      } else if (screen.x > width - marginX) {
        dx = screen.x - (width - marginX);
      }

      if (screen.y < marginY) {
        dy = screen.y - marginY;
      } else if (screen.y > height - marginY) {
        dy = screen.y - (height - marginY);
      }

      if (dx === 0 && dy === 0) return;

      const viewport = rf.getViewport();

      rf.setViewport(
        {
          x: viewport.x - dx,
          y: viewport.y - dy,
          zoom,
        },
        { duration: 450 },
      );
    },
    [rf, zoom, containerRef],
  );
}
