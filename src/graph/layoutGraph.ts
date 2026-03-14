import type { GraphState } from "./reducer";

export const NODE_WIDTH = 300;
export const NODE_HEIGHT = 140;

const VERTICAL_SPACING = 220;
const HORIZONTAL_SPACING = 340;

export async function layoutGraph(state: GraphState): Promise<GraphState> {
  const nodes = Object.values(state.nodes);
  const newNodes = nodes.filter((n) => !n.positioned);

  if (!newNodes.length) return state;

  const placed: Record<string, GraphState["nodes"][string]> = { ...state.nodes };
  const placedChildrenCount = new Map<string, number>();
  let rootIndex = 0;

  for (const node of newNodes) {
    const parentEdge = state.edges.find((e) => e.target === node.id);
    const parent = parentEdge ? placed[parentEdge.source] : null;

    let x = 0;
    let y = 0;

    if (!parent || !parent.positioned) {
      // Root placement: stack vertically to avoid overlap
      x = 0;
      y = rootIndex * VERTICAL_SPACING;
      rootIndex += 1;
    } else {
      const childCount = placedChildrenCount.get(parent.id) ?? 0;
      placedChildrenCount.set(parent.id, childCount + 1);

      if (childCount === 0) {
        // Main causal chain: place directly below parent
        x = parent.position.x;
        y = parent.position.y + VERTICAL_SPACING;
      } else {
        // Branches: alternate left/right beside the parent
        const offsetIndex = Math.ceil(childCount / 2);
        const direction = childCount % 2 === 0 ? -1 : 1;
        x = parent.position.x + direction * offsetIndex * HORIZONTAL_SPACING;
        y = parent.position.y;
      }
    }

    placed[node.id] = {
      ...node,
      positioned: true,
      position: { x, y },
    };
  }

  return {
    ...state,
    nodes: placed,
  };
}
