# UI Visualization Notes (Graph Flow)

- Goal: make the graph feel like a causal proof trace; animate *why* something appears, not just that it appears.
- Core rule: stable, append-only layout; the graph grows like a proof tree—never reshuffle on every frame.

## Causal Animation Patterns
- Causal pulse: briefly highlight `parent → edge → child` when adding a node (use `reason`/`iteration` event to trigger). Sequence: highlight parent, draw edge, spawn node.
- Node spawn: Framer Motion pop-in (`scale 0.7 → 1`, `opacity 0 → 1`, ~200ms).
- Edge draw: animate path length/dash (~300ms).
- Pending node: pulse `?`/spinner (slow scale loop).
- Resolve: spinner → label; color shift yellow→green (~300ms).
- Iteration banner: transient overlay per `iteration` event (e.g., “Iteration 2 — call graph expansion”).
- Context highlight: glow/border for `setContext` nodes; optional token badge.
- Floating reason: brief label near new node (“missing symbol detected”, “definition closure”).

## Layout Strategy (critical)
- Never recompute layout for existing nodes; append-only. Keep prior positions; layout only new nodes.
- Layered DAG: top→bottom; group by iteration/phase; optional faint vertical guides per layer.
- Semantic X positions: anchors (x=0), discovered/pending (x=400–700), resolved/context (x=400). Dagre controls Y spacing only.
- Edge types: curved (smoothstep/bezier), downward-only to reduce crossing.
- Fixed node size to avoid jitter when labels change; consider ghost placeholders for expected nodes.
- Camera: initial `fitView({ padding: 0.2 })`, then disable auto-fit.

## Fixture Playback / State
- Fixture type: `{ name, events: GraphEvent[], autoplayDelay?: number }`. Runner supports autoplay and step mode.
- GraphState (from events): nodes, edges, context, iteration.
- UIState (separate atoms): autoplay flag, playbackIndex, selectedNode, solverRunning, selectedFixture.
- Dev logging: log all GraphEvents in dev to record/replay traces; UI is a pure projection of the GraphEvent stream (fixtures, solver runs, recorded traces all reuse the same protocol).

## Single-Pane "Stage" Layout
- Permanent elements: query input + full-bleed graph stage (~90% of screen) using React Flow. Treat graph as a stage, not a dashboard.
- Overlays not panels: transient iteration banner (top-center, ~1s), solver note near new node (“missing symbol: X”), tiny token badge (corner), minimal iteration dots (top-right) instead of a timeline panel.
- Controls: none except a Replay button near the prompt. Context diff is visual (node glow) instead of a text panel.
- Camera: fit once on load; keep fixed; pan only if a node would appear off-screen. Dim graph slightly before each iteration, brighten affected nodes during animation.

## Scope & Visibility Rules (avoid hairball)
- Only show the causal slice: anchors ∪ active frontier ∪ in-context nodes; hide unused/background graph.
- Hard cap: target 5–12 nodes; max visible ~25. Collapse/omit older branches if exceeded.
- Frontier collapse: if many neighbors, show “+N” expandable placeholder instead of fan-out.
- Emphasize the evidence chain: thicker/brighter edges along anchor → missing → definition → context; others faded/grey.
- Temporal fade: older iterations reduce opacity (e.g., 100% → 90% → 80%).
- Edge simplification: render only solver-relevant edges (calls/writes/imports that drove inclusion); skip utility noise.
- Maintain a clear vertical path; prefer one main chain with 1–2 side branches. If it can’t be explained in 3 seconds, it’s too complex.
