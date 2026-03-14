export type GraphNode = {
  id: string;
  label?: string;
  kind: "symbol" | "function" | "file" | "type";
  state: "anchor" | "pending" | "resolved";
  tokens?: number;
  evidence?: {
    snippet: string;
    file?: string;
    startLine?: number;
  };
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "calls" | "imports" | "references";
};

export type GraphEvent =
  | { type: "addNodes"; nodes: GraphNode[]; reason?: string }
  | { type: "addEdges"; edges: GraphEdge[]; reason?: string }
  | { type: "updateNode"; id: string; patch: Partial<GraphNode> }
  | { type: "setContext"; nodes: string[] }
  | { type: "iteration"; step: number };
