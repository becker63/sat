type BaseNode = {
  id: string;
  label?: string;
  kind: "symbol" | "function" | "file" | "type";
};

type PendingNode = BaseNode & {
  state: "pending";
};

type PrunedNode = BaseNode & {
  state: "pruned";
};

type AnchorNode = BaseNode & {
  state: "anchor";
  tokens?: number;
  evidence?: {
    snippet: string;
    file?: string;
    startLine?: number;
  };
};

type ResolvedNode = BaseNode & {
  state: "resolved";
  tokens: number;
  evidence: {
    snippet: string;
    file?: string;
    startLine?: number;
  };
};

export type GraphNode = PendingNode | PrunedNode | AnchorNode | ResolvedNode;

export type GraphEdge = {
  id?: string;
  source: string;
  target: string;
  kind: "calls" | "imports" | "references";
  primary?: boolean;
};

export type GraphEvent =
  | { type: "addNodes"; nodes: GraphNode[]; reason?: string }
  | { type: "addEdges"; edges: GraphEdge[]; reason?: string }
  | { type: "updateNode"; id: string; patch: Partial<GraphNode> }
  | { type: "setContext"; nodes: string[]; tokens?: number }
  | { type: "iteration"; step: number; description?: string };
