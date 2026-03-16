# Demo Plan (2–3 Minute “Aha”)

- **Goal:** Show that we solve for the minimal evidence graph before reasoning.
- **Flow to display:** query → anchors → graph expansion → missing symbol → refinement → stable answer.

## Script Outline
- Prompt: “Why does this query refetch when the window gains focus?” (TanStack Query) or “Why does scrollOwner reset?” (scroll example).
- Iteration 1: seeds appear (blue): `useQuery`, `focusManager` (or `useAutoScroll`, `scrollOwner`).
- Expansion: graph grows (yellow); context packed (green) within budget.
- LLM reasoning: flags missing `QueryObserver`/`scrollOwnerSetter`.
- Refinement: solver adds definition node; context diff shows `+ symbol`; answer stabilizes.
- Value callout: live token savings (naive ~6–12k tokens vs solver ~1–2k).

## Architecture Pieces to Demo
- Indexer: Tree-sitter or TS compiler API → nodes/edges JSON.
- Solver: deterministic expansion, edge priorities, greedy packing, single refinement loop.
- UI: React Flow graph + timeline + context diff; animate new nodes on constraints.

## Build Targets (1 Month)
- Week 1: indexer + graph store (nodes/edges).
- Week 2: expansion rules + token estimator + edge weighting.
- Week 3: LLM integration + missing-symbol detection + retry-once.
- Week 4: UI polish + token-savings display + canned prompts.
