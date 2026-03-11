import { useEffect, useMemo } from "react";
import { forceLink, type Simulation } from "d3-force";
import { useNodesInitialized, useReactFlow } from "@xyflow/react";

import { SIM_CONFIG } from "./config";
import { createRng } from "./random";
import type { DragEvents, SimNode } from "./types";

export function useForceLayout(
  sim: Simulation<SimNode, any>,
  draggingNodeRef: React.MutableRefObject<SimNode | null>,
): DragEvents {
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
  const initialized = useNodesInitialized();

  const dragEvents: DragEvents = useMemo(
    () => ({
      start: (_event, node) => (draggingNodeRef.current = node as SimNode),
      drag: (_event, node) => (draggingNodeRef.current = node as SimNode),
      stop: () => (draggingNodeRef.current = null),
    }),
    [draggingNodeRef],
  );

  useEffect(() => {
    if (!initialized) return;
    const rand = createRng(SIM_CONFIG.randomSeed);
    const nodes: SimNode[] = getNodes().map((node) => ({
      ...node,
      x: node.position.x + (rand() - 0.5) * 30 * SIM_CONFIG.layoutScale,
      y: node.position.y + (rand() - 0.5) * 30 * SIM_CONFIG.layoutScale,
      vx: (rand() - 0.5) * 2 * SIM_CONFIG.layoutScale,
      vy: (rand() - 0.5) * 2 * SIM_CONFIG.layoutScale,
    }));
    const edges = getEdges();
    if (!nodes.length) return;

    sim.nodes(nodes).force(
      "link",
      forceLink(edges)
        .id((d: any) => d.id)
        .strength(0.07 * SIM_CONFIG.layoutScale)
        .distance(135 * SIM_CONFIG.layoutScale),
    );

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    sim.alpha(Math.max(0.1, SIM_CONFIG.settleSpeed * 16));
    let running = true;
    let rafId: number | null = null;
    let timeoutId: number | null = null;

    const tick = (startTime: number) => {
      const currentPositions = new Map(
        getNodes().map((node) => [node.id, node.position]),
      );

      nodes.forEach((node, i) => {
        const dragging = draggingNodeRef.current?.id === node.id;
        if (dragging) {
          nodes[i].fx = draggingNodeRef.current?.position.x;
          nodes[i].fy = draggingNodeRef.current?.position.y;
        } else {
          delete nodes[i].fx;
          delete nodes[i].fy;
        }
      });

      sim.tick();
      setNodes(
        nodes.map((node) => ({
          ...node,
          position: {
            x: lerp(
              currentPositions.get(node.id)?.x ?? node.x,
              node.fx ?? node.x,
              SIM_CONFIG.settleSpeed,
            ),
            y: lerp(
              currentPositions.get(node.id)?.y ?? node.y,
              node.fy ?? node.y,
              SIM_CONFIG.settleSpeed,
            ),
          },
        })),
      );

      rafId = window.requestAnimationFrame(() => {
        fitView();
        if (running && performance.now() - startTime < SIM_CONFIG.durationMs) {
          tick(startTime);
        } else {
          running = false;
        }
      });
    };

    timeoutId = window.setTimeout(() => {
      rafId = window.requestAnimationFrame(() => tick(performance.now()));
    }, SIM_CONFIG.delayMs);

    return () => {
      running = false;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      sim.stop();
    };
  }, [
    initialized,
    draggingNodeRef,
    getNodes,
    getEdges,
    setNodes,
    fitView,
    sim,
  ]);

  return dragEvents;
}
