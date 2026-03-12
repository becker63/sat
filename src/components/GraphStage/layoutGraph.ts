import ELK from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";

const elk = new ELK();

/**
 * Single tuning knob for edge length / graph density.
 *
 * 1.0 = current spacing
 * 0.5 = roughly half-sized graph
 * 0.3 = very compact
 */
const EDGE_SCALE = 0.5;

const layoutOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.incremental": "true",

  // vertical spacing between layers
  "elk.layered.spacing.nodeNodeBetweenLayers": String(180 * EDGE_SCALE),

  // horizontal spacing between nodes
  "elk.spacing.nodeNode": String(120 * EDGE_SCALE),
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 40;

export async function layoutGraph(nodes: Node[], edges: Edge[]) {
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
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  return nodes.map((node) => {
    const elkNode = layout.children?.find((n) => n.id === node.id);

    return {
      ...node,
      position: {
        x: elkNode?.x ?? 0,
        y: elkNode?.y ?? 0,
      },
    };
  });
}
