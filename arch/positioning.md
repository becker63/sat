# Positioning & Value

- **Pitch:** A deterministic context compiler that solves for the minimal evidence graph needed to answer a code question.
- **Value:** 3–8× context efficiency; causal chains preserved; deterministic/stable behavior; explainable inclusion rationale.

## Compared to Existing Tools
- Today: search/embeddings + heuristic expansion → top-k files → truncation; missing dependencies; no recovery.
- This: constraint-driven selection; definition-before-reference; token budget; adaptive refinement (missing symbol → expand → retry).
- Strengths: debugging chains, minimal context, stability. Weaknesses: higher latency; broad architecture Qs still need semantic search for anchors.

## Target Repos / Questions
- Best fit: medium JS/TS libs with multi-hop flows (TanStack Query, Zustand, Redux Toolkit, React Router).
- Example Q: “Why does this query refetch on window focus?” → useQuery → QueryObserver → focusManager → refetch; missing symbol triggers expansion.

## One-Liners
- “Solve for the minimal evidence graph, then let the LLM reason.”
- “A SAT-style context planner for LLMs.”
