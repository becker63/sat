# GraphEvent Protocol (minimal, solver-agnostic)

- Keep it small, idempotent, and consistent across solver, fixtures, transport, Jotai reducer, and React Flow.

```ts
export type GraphEvent =
  | { type: "addNodes"; nodes: GraphNode[]; reason?: string }
  | { type: "addEdges"; edges: GraphEdge[]; reason?: string }
  | { type: "updateNode"; id: string; patch: Partial<GraphNode>; reason?: string }
  | { type: "setContext"; nodes: string[]; reason?: string }
  | { type: "removeNodes"; ids: string[]; reason?: string }   // reserved for pruning
  | { type: "removeEdges"; ids: string[]; reason?: string }   // reserved for pruning
  | { type: "iteration"; step: number; description?: string }
  | { type: "constraintLearned"; constraint: string; symbol?: string; reason?: string }; // optional polish for solver storytelling

export type GraphNode = {
  id: string;
  label?: string;
  kind: "symbol" | "function" | "file" | "type";
  state: "anchor" | "pending" | "resolved";
  tokens?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "calls" | "imports" | "references";
};
```

- Node ID convention (to avoid collisions and keep traces legible):
  - `function:<name>` e.g., `function:useAutoScroll`
  - `symbol:<name>` e.g., `symbol:scrollOwner`
  - `file:<path>` e.g., `file:src/useAutoScroll.ts`

- Optional reason shape for better UI:
```ts
type Reason =
  | { type: "definition"; detail?: string }
  | { type: "call_edge"; detail?: string }
  | { type: "missing_symbol"; detail?: string }
  | { type: "context_pack"; detail?: string };
```
Include as `reason` payload to drive causal overlays.

- GraphState shape:
```ts
type GraphState = {
  nodes: Record<string, GraphNode>
  edges: GraphEdge[]
  context: Set<string>
  iteration: number
}
```

- Reducer `applyGraphEvent(prev, event)` builds `GraphState`. Removal events are reserved for future pruning/context adjustments even if not used in the first demo.
- RxJS produces `Observable<GraphEvent>` (fixture or solver). Server action collects to `GraphEvent[]` initially; UI replays through the reducer and stores in a `graphAtom` via Jotai.
- Later: stream the same events via SSE/WebSocket; UI code unchanged.

## Principle
Define a single canonical reducer `applyGraphEvent(state, event)` as the only state transition. All sources (fixtures, solver, recorded traces, tests) emit GraphEvents into this reducer; the UI is a pure projection of the event stream.
