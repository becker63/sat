import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import { timer, of } from "rxjs";
import { finalize, map, take } from "rxjs/operators";
import type { GraphState } from "./reducer";
import { EDGE_SCALE, NODE_HEIGHT, NODE_WIDTH } from "./layoutGraph";

/**
 * Emits a handful of gentle force-sim frames to add subtle motion without
 * drifting away from the ELK skeleton.
 */
export function relaxGraph(state: GraphState, frames = 24, intervalMs = 24) {
  const nodes = Object.values(state.nodes);
  if (nodes.length <= 1) return of(state);

  const linkDistance = 150 * EDGE_SCALE;
  const collisionRadius = Math.max(NODE_WIDTH, NODE_HEIGHT) * 0.55;
  const maxDelta = 10;

  const simulation = forceSimulation(
    nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      vx: 0,
      vy: 0,
    })),
  )
    .force(
      "link",
      forceLink(
        state.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      )
        .id((d: any) => d.id)
        .distance(linkDistance),
    )
    .force("charge", forceManyBody().strength(-6))
    .force("collision", forceCollide(collisionRadius))
    .force("x", forceX((d: any) => d.x).strength(0.2))
    .force("y", forceY((d: any) => d.y).strength(0.2))
    .alpha(0.22)
    .alphaDecay(0.06);

  return timer(0, intervalMs).pipe(
    take(frames),
    map(() => {
      simulation.tick();

      const positionedNodes = { ...state.nodes };

      simulation.nodes().forEach((node) => {
        const existing = positionedNodes[node.id];
        if (!existing) return;

        positionedNodes[node.id] = {
          ...existing,
          position: {
            x: clampDelta(existing.position.x, node.x ?? existing.position.x, maxDelta),
            y: clampDelta(existing.position.y, node.y ?? existing.position.y, maxDelta),
          },
          positioned: true,
        };
      });

      return {
        ...state,
        nodes: positionedNodes,
      };
    }),
    finalize(() => simulation.stop()),
  );
}

function clampDelta(origin: number, candidate: number, max: number) {
  return Math.min(origin + max, Math.max(origin - max, candidate));
}
