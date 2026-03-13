import type { GraphEvent, GraphNode, GraphEdge } from "./events";

export type PositionedGraphNode = GraphNode & {
  positioned: boolean;
  position: { x: number; y: number };
};

export type GraphState = {
  nodes: Record<string, PositionedGraphNode>;
  edges: GraphEdge[];
  context: Set<string>;
  iteration: number;
  panTargetId: string | null;
  panTick: number;
};

export const initialGraphState: GraphState = {
  nodes: {},
  edges: [],
  context: new Set(),
  iteration: 0,
  panTargetId: null,
  panTick: 0,
};

export function applyGraphEvent(
  state: GraphState,
  event: GraphEvent,
): GraphState {
  switch (event.type) {
    case "addNodes": {
      const nodes = { ...state.nodes };
      for (const n of event.nodes) {
        const previous = nodes[n.id];
        nodes[n.id] = {
          ...previous,
          ...n,
          position: previous?.position ?? { x: 0, y: 0 },
          positioned: previous?.positioned ?? false,
        };
      }
      return { ...state, nodes };
    }

    case "addEdges":
      return { ...state, edges: [...state.edges, ...event.edges] };

    case "updateNode": {
      const target = state.nodes[event.id];

      if (!target) return state;

      return {
        ...state,
        nodes: {
          ...state.nodes,
          [event.id]: { ...target, ...event.patch },
        },
      };
    }

    case "setContext":
      return { ...state, context: new Set(event.nodes) };

    case "iteration":
      return { ...state, iteration: event.step };

    default:
      return state;
  }
}
