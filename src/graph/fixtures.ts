import type { GraphEvent, GraphEdge, GraphNode } from "./events";
import type { Observable } from "rxjs";
import { from } from "rxjs";

export type Fixture = {
  id: string;
  label: string;
  prompt: string;
  events$: () => Observable<GraphEvent>;
};

/**
 * Fixtures now only define events.
 * No playback timing here.
 */

const CHAOS_ANCHOR_COUNT = 40;

function generateAnchors(count: number): GraphNode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `anchor:${i}`,
    label: `candidate_${i}`,
    kind: "symbol",
    state: "anchor",
    tokens: 12 + Math.floor(Math.random() * 18),
    evidence: {
      snippet: "…semantic match…",
    },
  }));
}

function generateAnchorEdges(count: number): GraphEdge[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `query-anchor-${i}`,
    source: "query",
    target: `anchor:${i}`,
    kind: "references",
  }));
}

function resolveSomeAnchors(): GraphEvent[] {
  const resolved = [2, 7, 12, 23, 31];

  return resolved.map((i) => ({
    type: "updateNode",
    id: `anchor:${i}`,
    patch: {
      state: "resolved",
    },
  }));
}

const chaosAnchorIds = Array.from(
  { length: CHAOS_ANCHOR_COUNT },
  (_, i) => `anchor:${i}`,
);

const semanticSearchChaosEvents: GraphEvent[] = [
  {
    type: "iteration",
    step: 1,
    description: "Top-K semantic search candidates",
  },
  {
    type: "addNodes",
    nodes: [
      {
        id: "query",
        label: "query",
        kind: "symbol",
        state: "resolved",
        tokens: 32,
        evidence: {
          snippet: "User question: find matching symbols in the codebase",
        },
      },
    ],
  },
  {
    type: "addNodes",
    nodes: generateAnchors(CHAOS_ANCHOR_COUNT),
  },
  {
    type: "addEdges",
    edges: generateAnchorEdges(CHAOS_ANCHOR_COUNT),
  },
  {
    type: "iteration",
    step: 2,
    description: "LLM reasoning over noisy context",
  },
  ...resolveSomeAnchors(),
  {
    type: "setContext",
    nodes: ["query", ...chaosAnchorIds],
    tokens: 820,
  },
];

const tanstackEvents: GraphEvent[] = [
  /**
   * Anchor: starting symbol
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:useQuery",
        label: "useQuery",
        kind: "function",
        state: "anchor",
        tokens: 40,
        evidence: {
          file: "react-query/useQuery.ts",
          startLine: 15,
          snippet: `export function useQuery(options) {
   const client = useQueryClient()
   const observer = new QueryObserver(client, options)
   return observer.getOptimisticResult(options)`,
        },
      },
    ],
  },

  /**
   * ITERATION 1
   * ctrl-click QueryObserver
   */

  { type: "iteration", step: 1 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "var:observer",
        label: "observer",
        kind: "symbol",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:useQuery",
        target: "var:observer",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 2 },

  {
    type: "updateNode",
    id: "var:observer",
    patch: {
      state: "resolved",
      tokens: 22,
      evidence: {
        file: "query-core/queryObserver.ts",
        startLine: 40,
        snippet: `constructor(client, options) {
   this.client = client
   this.options = options
   notifyManager.batch(() =>`,
      },
    },
  },

  /**
   * ITERATION 3
   * ctrl-click symbols inside QueryObserver
   */

  { type: "iteration", step: 3 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "var:client",
        label: "client",
        kind: "symbol",
        state: "pending",
      },

      {
        id: "var:notifyManager",
        label: "notifyManager",
        kind: "symbol",
        state: "pending",
      },

      {
        id: "var:focusManager",
        label: "focusManager",
        kind: "symbol",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "var:observer",
        target: "var:client",
        kind: "references",
      },
      {
        source: "var:observer",
        target: "var:notifyManager",
        kind: "calls",
      },
      {
        source: "var:observer",
        target: "var:focusManager",
        kind: "references",
      },
    ],
  },

  /**
   * ITERATION 4
   * ctrl-click client
   */

  { type: "iteration", step: 4 },

  {
    type: "updateNode",
    id: "var:client",
    patch: {
      state: "resolved",
      tokens: 20,
      evidence: {
        file: "query-core/queryClient.ts",
        startLine: 20,
        snippet: `constructor(config) {
   this.queryCache = new QueryCache()
   this.mutationCache = new MutationCache()
 `,
      },
    },
  },

  {
    type: "updateNode",
    id: "var:notifyManager",
    patch: { state: "pruned" },
  },

  {
    type: "updateNode",
    id: "var:focusManager",
    patch: { state: "pruned" },
  },

  /**
   * ITERATION 5
   * ctrl-click queryCache inside client
   */

  { type: "iteration", step: 5 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "var:queryCache",
        label: "queryCache",
        kind: "symbol",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "var:client",
        target: "var:queryCache",
        kind: "references",
      },
    ],
  },

  /**
   * ITERATION 6
   */

  { type: "iteration", step: 6 },

  {
    type: "updateNode",
    id: "var:queryCache",
    patch: {
      state: "resolved",
      tokens: 24,
      evidence: {
        file: "query-core/queryCache.ts",
        startLine: 10,
        snippet: `build(client, options) {
   const query = new Query(client, options)
   this.queries.push(query)
 `,
      },
    },
  },

  /**
   * ITERATION 7
   * ctrl-click query
   */

  { type: "iteration", step: 7 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "var:query",
        label: "query",
        kind: "symbol",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "var:queryCache",
        target: "var:query",
        kind: "calls",
      },
    ],
  },

  /**
   * ITERATION 8
   */

  { type: "iteration", step: 8 },

  {
    type: "updateNode",
    id: "var:query",
    patch: {
      state: "resolved",
      tokens: 24,
      evidence: {
        file: "query-core/query.ts",
        startLine: 30,
        snippet: `fetch() {
   this.retryer = new Retryer({
     retry: this.options.retry
 `,
      },
    },
  },

  /**
   * ITERATION 9
   * ctrl-click retryer
   */

  { type: "iteration", step: 9 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "var:retryer",
        label: "retryer",
        kind: "symbol",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "var:query",
        target: "var:retryer",
        kind: "calls",
      },
    ],
  },

  /**
   * ITERATION 10
   */

  { type: "iteration", step: 10 },

  {
    type: "updateNode",
    id: "var:retryer",
    patch: {
      state: "resolved",
      tokens: 18,
      evidence: {
        file: "query-core/retryer.ts",
        startLine: 10,
        snippet: `constructor(config) {
   this.retry = config.retry
   this.abort = config.abort
 `,
      },
    },
  },

  {
    type: "setContext",
    nodes: [
      "function:useQuery",
      "var:observer",
      "var:client",
      "var:queryCache",
      "var:query",
      "var:retryer",
    ],
  },
];

const tanstackFixture = {
  id: "tanstack",
  label: "TanStack Query",
  prompt: "How does useQuery work internally in TanStack Query?",
  events$: () => from(tanstackEvents),
} as const satisfies Fixture;

const semanticSearchChaosFixture = {
  id: "semantic-search-chaos",
  label: "Semantic Search Chaos",
  prompt: "Show semantic search candidates before solver pruning.",
  events$: () => from(semanticSearchChaosEvents),
} as const satisfies Fixture;

export const fixtureRegistry = {
  tanstack: tanstackFixture,
  "semantic-search-chaos": semanticSearchChaosFixture,
} as const satisfies Record<string, Fixture>;
