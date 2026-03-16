# Demo Architecture (Consolidated)

- **Goal:** Show a deterministic context compiler that solves for the minimal evidence graph needed to answer a code question.
- **Story beat:** query → anchors → deterministic expansion → token-bounded packing → SAT-style refinement → answer/visualization.

## Concept & Novelty
- Treat context as a **constraint/optimization** problem, not search: enforce definition-before-reference, deterministic expansion, and token budget.
- Graph-first, semantics-second: structural graph bounds the candidate set; optional semantic ranking orders it but cannot add new nodes.
- Refinement loop mirrors CEGIS/SAT: detect missing symbols, learn constraint, expand once or twice, stabilize.
- Deterministic behavior → same query yields same context; failures are explainable (budget, depth, missing anchor).

## System Pipeline
```
repo → static index (symbols + edges) → graph store → greedy context solver → LLM reasoning → (optional) refinement → UI
```
- Inputs: anchors from query (lexical/embedding search).
- Outputs: graph slice + context prompt + timeline of solver iterations.

## Data Model (Minimal)
- Node: { id, name, kind ("function" | "variable" | "file"), file, startLine, endLine, tokens, snippet? }.
- Edge: { from, to, type ("calls" | "reads" | "writes" | "imports"), weight } with auto reverse edges.
- SolverState: anchors, frontier, context, tokenBudget, tokensUsed, iteration.
- Graph store: JSON or SQLite tables (nodes, edges, files, symbols).

## Indexing Options
- **Tree-sitter (fast, shallow):** extract definitions, calls, imports, writes; string-match symbols; token ≈ chars/4; ~150–200 LOC.
- **TypeScript Compiler API (semantic, TS-only):** real symbol resolution, module imports, overloads; better call edges; ~460 LOC backend total.

## Expansion & Heuristics
- Deterministic rules: include definition(node); callers/callees; imports(file); variable writes; bounded depth (≤2–3); max_edges_per_node=3.
- Edge priorities (calls/writes > reads > imports > same_file); traversal sorted by weight to avoid utility noise.
- Token optimizer: greedy pack highest signal/low cost until budget; value ≈ priority_score / tokens.

## Solver Loop (Greedy + Refinement)
```
context = anchors
while tokens(context) < budget:
  missing = referenced(context) - defined(context)
  if missing: context += definitions(missing); continue
  candidate = best_frontier(context); if !candidate: break
  context += candidate
answer = LLM(context)
missing = detect_missing_symbols(answer)
if missing: context += expand(missing); retry once
```
- Constraints enforced: definition closure, token budget, anchor inclusion, depth bound.

## UI / Demo Experience
- Stack: Next.js + React Flow + Framer Motion.
- Panels:
  - Graph: blue=anchors, yellow=expanded, green=in-context; animate new nodes on constraints.
  - Solver timeline: iteration, nodes, tokens, learned constraint.
  - Context diff: prompt deltas per iteration; show token savings vs naive top-K files.
- Key moment: LLM flags missing symbol → node animates in → answer stabilizes.

## Value Proposition (for engineers)
- 3–8× context efficiency: typical debugging path ~400–2000 tokens vs 6000–12000 from top-8 files.
- Better debugging: causal chains preserved (definitions, callers, state writes) → fewer hallucinations.
- Stability/explainability: same query ⇒ same context; each node has inclusion rationale; failures are legible.

## Differentiation vs Existing Tools
- GitHub/Sourcegraph: search + heuristic expansion; truncate arbitrarily; no recovery.
- This system: constraint-driven, minimal satisfying subgraph, adaptive refinement; deterministic failure modes.
- Weak spots: higher latency; broad architecture questions still need semantic search for anchors.

## Repo Targets & Demo Prompt
- Best fit: medium TS/JS libs with multi-hop chains (TanStack Query, Zustand, Redux Toolkit, React Router).
- Example question: “Why does this query refetch when the window gains focus?” → useQuery → QueryObserver → focusManager → refetch; missing symbol triggers expansion.

## Build Outline (1 Month)
- Week 1: indexer (Tree-sitter or TS API), node/edge model, graph store.
- Week 2: deterministic expansion + token estimator + priorities.
- Week 3: LLM integration, missing-symbol detection, single refinement loop.
- Week 4: UI (graph + timeline + diff), token-savings display, demo polish.

## Solver Termination (Bounds)
- Depth ≤ 3; max_edges_per_node ≤ 3; max_nodes ≤ ~60; token_budget enforced. These bounds prevent unbounded expansion.

## Optional Layers
- Semantic rerank inside candidate set (score/token).
- Specialized tools: trace_calls(symbol), trace_state_changes(symbol).
- Constraint set design (~6–8 types) if you want more rigor.
- Tool/agent flow: LLM plans; `code_search` finds anchors (lexical/embedding); `dependency_solver` returns graph slice + delta; UI animates each solver call; optional second pass when LLM flags missing symbols.
