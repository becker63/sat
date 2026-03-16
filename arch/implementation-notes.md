# Implementation Notes (Minimal, TS Compiler API)

- **Data model:** Node {id, name, kind, file, startLine, endLine, tokens, snippet?}; Edge {from, to, type, weight}; auto reverse edges. SolverState {anchors, frontier, context, tokenBudget, tokensUsed, iteration}.

- **Indexing:** Use **TypeScript Compiler API** (chosen) for semantic symbols (imports, aliases, re-exports). Setup: program + checker; filter out `node_modules`/TS libs when expanding.

- **Token cost:** rough `tokens ≈ chars/4` or `lines × 8`.

- **Greedy solver (definition closure first):**
  ```
  context = seeds
  while tokens(context) < budget and depth < 3:
    ids = collectIdentifiers(context)
    refs = resolveSymbols(ids, checker)           // semantic refs
    missing = refs - defs
    if missing:
      defs += addDefinitions(missing, checker)    // definition closure
      context += defs just added
      continue
    frontier = neighbors(context)                 // optional prioritized edges
    best = pick_highest_signal(frontier, tokens)
    if !best: break
    context += best
  answer = LLM(context)
  reasoning_missing = parseMissingRequests(answer) // MISSING_SYMBOL: foo
  if reasoning_missing: context += defs(reasoning_missing); retry once
  ```
  - Safety: depth ≤3; max_edges_per_node=3; stop when no missing and no frontier within budget.

- **Priorities (optional frontier step):** calls/writes > reads > imports > same_file; score by weight/tokens.

- **LLM-guided expansion:** Allow `MISSING_SYMBOL: symbolName` tag; union with compiler-detected missing refs; loop max ~6 iterations.

- **Tool/agent flow:** LLM → `code_search` (anchors) → `dependency_solver` (definition-closure + optional frontier) → UI animates deltas; if LLM flags missing symbols, solver adds and reruns once. Server functions stream events via RxJS; fixtures are replayable streams; Jotai projects the event stream into UI state.

- **Solver event loop (GraphEvents-first):** Structure solver so events fall out naturally. Loop: emit `iteration` + `addNodes` for anchors; maintain `frontier`; for each symbol, expand via TS checker (refs/defs) → emit `addNodes`/`addEdges`; when a definition resolves emit `updateNode` (label/state); optionally emit `setContext` when packing context. Fixtures are recorded GraphEvent traces; real solver emits the same stream.
