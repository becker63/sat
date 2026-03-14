import { useCallback, useEffect, useRef } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import { NODE_HEIGHT, NODE_WIDTH } from "@/graph/layoutGraph";

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function useFollowNodes(
  containerRef: React.RefObject<HTMLDivElement | null>,
  maxZoom: number,
) {
  const rf = useReactFlow();
  const rafRef = useRef<number | null>(null);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  return useCallback(
    (nodes: Node[]) => {
      cancelAnimation();

      if (!containerRef.current || nodes.length === 0) return;

      const padding = 120;
      const upwardOffset = 80;

      const bounds = nodes.reduce<Bounds>(
        (acc, node) => {
          const x = node.position.x;
          const y = node.position.y;

          acc.minX = Math.min(acc.minX, x);
          acc.minY = Math.min(acc.minY, y);
          acc.maxX = Math.max(acc.maxX, x + NODE_WIDTH);
          acc.maxY = Math.max(acc.maxY, y + NODE_HEIGHT);

          return acc;
        },
        {
          minX: Infinity,
          minY: Infinity,
          maxX: -Infinity,
          maxY: -Infinity,
        },
      );

      // Favor showing upcoming nodes by nudging frame upward.
      bounds.minY -= upwardOffset;

      const containerRect = containerRef.current.getBoundingClientRect();
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;

      const zoom = Math.min(
        maxZoom,
        Math.min(
          containerRect.width / (width + padding * 2),
          containerRect.height / (height + padding * 2),
        ),
      );

      const centerX = bounds.minX + width / 2;
      const centerY = bounds.minY + height / 2;

      const target = {
        x: containerRect.width / 2 - centerX * zoom,
        y: containerRect.height / 2 - centerY * zoom,
        zoom,
      };

      const step = () => {
        const current = rf.getViewport();

        const damp = 0.15;
        const next = {
          x: current.x + (target.x - current.x) * damp,
          y: current.y + (target.y - current.y) * damp,
          zoom: current.zoom + (target.zoom - current.zoom) * damp,
        };

        const closeEnough =
          Math.abs(target.x - next.x) < 0.5 &&
          Math.abs(target.y - next.y) < 0.5 &&
          Math.abs(target.zoom - next.zoom) < 0.0005;

        rf.setViewport(next);

        if (!closeEnough) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          cancelAnimation();
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [rf, containerRef, maxZoom, cancelAnimation],
  );
}
