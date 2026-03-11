import type { GraphEvent, GraphNode, GraphEdge } from "./events";

export type GraphState = {
  nodes: Record<string, GraphNode>;
  edges: GraphEdge[];
  context: Set<string>;
  iteration: number;
};

export const initialGraphState: GraphState = {
  nodes: {},
  edges: [],
  context: new Set(),
  iteration: 0,
};

export function applyGraphEvent(
  state: GraphState,
  event: GraphEvent,
): GraphState {
  switch (event.type) {
    case "addNodes": {
      const nodes = { ...state.nodes };
      for (const n of event.nodes) nodes[n.id] = n;
      return { ...state, nodes };
    }

    case "addEdges":
      return { ...state, edges: [...state.edges, ...event.edges] };

    case "updateNode":
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [event.id]: {
            ...state.nodes[event.id],
            ...event.patch,
          },
        },
      };

    case "setContext":
      return { ...state, context: new Set(event.nodes) };

    case "iteration":
      return { ...state, iteration: event.step };

    default:
      return state;
  }
}
