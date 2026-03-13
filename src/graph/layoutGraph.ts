import ELK from "elkjs/lib/elk.bundled.js";
import type { GraphState } from "./reducer";

/**
 * Single tuning knob for edge length / graph density.
 *
 * 1.0 = current spacing
 * 0.5 = roughly half-sized graph
 * 0.3 = very compact
 */
export const EDGE_SCALE = 0.5;

export const NODE_WIDTH = 180;
export const NODE_HEIGHT = 40;

const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.incremental": "true",
  "elk.layered.considerModelOrder": "NODES_AND_EDGES",
  "elk.randomSeed": "1",
  "elk.layered.crossingMinimization.strategy": "INTERACTIVE",

  // vertical spacing between layers
  "elk.layered.spacing.nodeNodeBetweenLayers": String(180 * EDGE_SCALE),

  // horizontal spacing between nodes
  "elk.spacing.nodeNode": String(120 * EDGE_SCALE),
};

const elk = new ELK();

export async function layoutGraph(state: GraphState): Promise<GraphState> {
  const nodes = Object.values(state.nodes);

  if (!nodes.length) return state;

  const graph = {
    id: "root",
    layoutOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      x: node.position.x,
      y: node.position.y,
    })),
    edges: state.edges.map((edge, index) => ({
      id: `${edge.source}-${edge.target}-${index}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  const positionedNodes = { ...state.nodes };

  const elkNodes = (layout.children ?? []).map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
  }));

  for (const child of elkNodes) {
    const existing = state.nodes[child.id];

    if (!existing) continue;

    positionedNodes[child.id] = {
      ...existing,
      position: {
        x: child.x ?? existing.position.x,
        y: child.y ?? existing.position.y,
      },
      positioned: true,
    };
  }

  return {
    ...state,
    nodes: positionedNodes,
  };
}
