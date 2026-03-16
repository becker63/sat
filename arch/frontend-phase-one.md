# Frontend-First Phase (Fixtures + UI-Only, Next.js server functions)

- **Goal:** Ship a single-pane graph narrative with fixtures before wiring the TS compiler backend. Use Next.js server functions (no separate API stubs) and RxJS internally; return arrays first, stream later.
- **Layout:** Query input + full-bleed React Flow graph; no sidebars. Optional small timeline/diff drawer later.

## Node States (visual narrative)
- anchor (blue): initial symbols.
- discovered (yellow): graph expansion.
- pending (spinner/“?”): missing evidence placeholder.
- resolved (green): included in context.
- Token badge optional: show per-node token cost to hint at budget optimization.

## Interaction / Script
1) User enters prompt (fixtures drive response).
2) Step-through or autoplay updates: anchors appear → edges animate → pending node appears → resolves to symbol → final context highlighted.
3) Optional “Step” button to advance solver iterations; autoplay for talk-mode.

## Data Shape for Fixtures
```ts
type VizNode = {
  id: string;
  label: string;
  state: "anchor" | "discovered" | "pending" | "resolved";
  tokens?: number;
};

type VizEdge = { source: string; target: string; type?: string };

type Frame = {
  nodes: VizNode[];
  edges: VizEdge[];
  note?: string; // e.g., "Missing scrollOwnerSetter"
};

export type Fixture = {
  name: string;
  events: GraphEvent[];
  autoplayDelay?: number;
};

export const scrollOwnershipFixture: Fixture = {
  name: "Scroll Ownership Bug",
  autoplayDelay: 800,
  events: [...]
};
```

- Store frames as JSON fixtures; UI replays them. Later, backend emits frames/deltas.

## Animation Hints
- Use React Flow + dagre (top→bottom causal chains).
- Framer Motion for node fade-in, pending pulse, resolved color transition, edge draw.
- Pending node displays spinner/“?”; swap to label on resolve.
- Layout strategy: use dagre top-to-bottom; rerun layout only on node adds; preserve positions on label/state updates to avoid jitter. Highlight one main path (anchor → cause → missing symbol → definition → context); others fade.

## Event Stream with RxJS (+ Jotai projection)
- Define a single `GraphEvent`/`Frame` type used everywhere (solver, fixtures, transport, UI, tests).
- RxJS inside solver/fixtures: `Observable<GraphEvent>`; fixtures via `from(array).pipe(concatMap(delay(...)))`.
- Project once into UI state with Jotai: connect the observable, `setGraph(prev => applyGraphEvent(prev, event))` into a `graphAtom`; components read atoms (no RxJS in components).
- Phase 1 transport: server action collects events (`GraphEvent[]`) via `lastValueFrom(...)`; UI replays list (no streaming yet).
- Later transport: SSE/WebSocket route can stream the same observable; UI code stays the same.

## Phase Boundaries
- **Phase 1 (now):** fixtures only; RxJS emits; server action returns `GraphEvent[]`; no TS compiler/LLM.
- **Phase 2:** wire TS compiler solver to emit the same event shape (definition closure + optional frontier); swap stream source.
- **Phase 3:** add LLM “MISSING_SYMBOL” loop; event notes show requests; same stream shape.

## UI State Separation
- GraphState: nodes, edges, context, iteration (from events).
- UIState: autoplay flag, playbackIndex, selectedNode, solverRunning, selectedFixture (separate atoms).
- GraphEvent logging: in dev, log all events to replay/save fixtures; UI is a pure projection of the GraphEvent stream (fixtures, solver runs, recorded traces all reuse the same protocol).
