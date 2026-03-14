import type { GraphEvent } from "./events";
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

const tanstackEvents: GraphEvent[] = [
  /**
   * Semantic anchor phase
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:useQuery",
        label: "useQuery",
        kind: "function",
        state: "anchor",
        tokens: 42,
        evidence: {
          file: "react-query/useQuery.ts",
          startLine: 15,
          snippet: `export function useQuery(options) {
   const client = useQueryClient()
   const observer = new QueryObserver(client, options)
   return observer.getOptimisticResult(options)
 }`,
        },
      },

      {
        id: "function:useMutation",
        label: "useMutation",
        kind: "function",
        state: "anchor",
        tokens: 38,
        evidence: {
          file: "react-query/useMutation.ts",
          startLine: 10,
          snippet: `export function useMutation(options) {
   const client = useQueryClient()
   return new MutationObserver(client, options)
 }`,
        },
      },

      {
        id: "function:QueryClient",
        label: "QueryClient",
        kind: "function",
        state: "anchor",
        tokens: 50,
        evidence: {
          file: "query-core/queryClient.ts",
          startLine: 20,
          snippet: `export class QueryClient {
   constructor(config) {
     this.queryCache = new QueryCache()
   }
 }`,
        },
      },
    ],
    reason: "Semantic anchors discovered from query",
  },

  { type: "iteration", step: 1 },

  /**
   * Solver begins exploring useQuery path
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:QueryObserver",
        label: "QueryObserver",
        kind: "function",
        state: "pending",
        tokens: 60,
        evidence: {
          file: "query-core/queryObserver.ts",
          startLine: 40,
          snippet: `export class QueryObserver {
   constructor(client, options) {
     this.client = client
     this.options = options
   }
 }`,
        },
      },
    ],
    reason: "useQuery constructs a QueryObserver",
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:useQuery",
        target: "function:QueryObserver",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 2 },

  /**
   * Branch nodes
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:notifyManager",
        label: "notifyManager",
        kind: "function",
        state: "pending",
        tokens: 30,
        evidence: {
          file: "query-core/notifyManager.ts",
          startLine: 5,
          snippet: `export const notifyManager = {
   batch(fn) {
     queueMicrotask(fn)
   }
 }`,
        },
      },

      {
        id: "function:focusManager",
        label: "focusManager",
        kind: "function",
        state: "pending",
        tokens: 28,
        evidence: {
          file: "query-core/focusManager.ts",
          startLine: 10,
          snippet: `export const focusManager = {
   setFocused(focused) {
     this.listeners.forEach(l => l(focused))
   }
 }`,
        },
      },
    ],
    reason: "QueryObserver integrates scheduling and focus events",
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:QueryObserver",
        target: "function:notifyManager",
        kind: "calls",
      },
      {
        source: "function:QueryObserver",
        target: "function:focusManager",
        kind: "references",
      },
    ],
  },

  { type: "iteration", step: 3 },

  /**
   * Continue main causal path
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "type:Query",
        label: "Query",
        kind: "type",
        state: "pending",
        tokens: 65,
        evidence: {
          file: "query-core/query.ts",
          startLine: 30,
          snippet: `export class Query {
   fetch() {
     this.retryer = new Retryer(this.options)
   }
 }`,
        },
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:QueryClient",
        target: "type:Query",
        kind: "references",
      },
    ],
  },

  { type: "iteration", step: 4 },

  /**
   * Final causal node
   */

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:Retryer",
        label: "Retryer",
        kind: "function",
        state: "pending",
        tokens: 35,
        evidence: {
          file: "query-core/retryer.ts",
          startLine: 10,
          snippet: `export class Retryer {
   constructor(config) {
     this.retry = config.retry
   }
 }`,
        },
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "type:Query",
        target: "function:Retryer",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 5 },

  /**
   * Solver resolves nodes
   */

  {
    type: "updateNode",
    id: "function:QueryObserver",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "type:Query",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "function:Retryer",
    patch: { state: "resolved" },
  },

  {
    type: "setContext",
    nodes: [
      "function:useQuery",
      "function:QueryObserver",
      "function:QueryClient",
      "type:Query",
      "function:Retryer",
    ],
  },
];

const reduxEvents: GraphEvent[] = [
  {
    type: "addNodes",
    nodes: [
      {
        id: "function:createSlice",
        label: "createSlice",
        kind: "function",
        state: "anchor",
      },
    ],
  },

  { type: "iteration", step: 1 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:createReducer",
        label: "createReducer",
        kind: "function",
        state: "pending",
      },
      {
        id: "function:createAction",
        label: "createAction",
        kind: "function",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:createSlice",
        target: "function:createReducer",
        kind: "calls",
      },
      {
        source: "function:createSlice",
        target: "function:createAction",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 2 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "type:Slice",
        label: "Slice",
        kind: "type",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:createSlice",
        target: "type:Slice",
        kind: "references",
      },
    ],
  },

  { type: "iteration", step: 3 },

  {
    type: "updateNode",
    id: "function:createReducer",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "function:createAction",
    patch: { state: "resolved" },
  },
];

const zustandEvents: GraphEvent[] = [
  {
    type: "addNodes",
    nodes: [
      {
        id: "function:createStore",
        label: "createStore",
        kind: "function",
        state: "anchor",
      },
    ],
  },

  { type: "iteration", step: 1 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:setState",
        label: "setState",
        kind: "function",
        state: "pending",
      },
      {
        id: "function:subscribe",
        label: "subscribe",
        kind: "function",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:createStore",
        target: "function:setState",
        kind: "calls",
      },
      {
        source: "function:createStore",
        target: "function:subscribe",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 2 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "type:StoreApi",
        label: "StoreApi",
        kind: "type",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:createStore",
        target: "type:StoreApi",
        kind: "references",
      },
    ],
  },

  { type: "iteration", step: 3 },

  {
    type: "updateNode",
    id: "function:setState",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "function:subscribe",
    patch: { state: "resolved" },
  },
];

const tanstackFixture = {
  id: "tanstack",
  label: "TanStack Query",
  prompt: "How does useQuery work internally in TanStack Query?",
  events$: () => from(tanstackEvents),
} as const satisfies Fixture;

const reduxFixture = {
  id: "redux",
  label: "Redux Toolkit",
  prompt: "How does createSlice generate reducers in Redux Toolkit?",
  events$: () => from(reduxEvents),
} as const satisfies Fixture;

const zustandFixture = {
  id: "zustand",
  label: "Zustand",
  prompt: "How does Zustand create and update store state?",
  events$: () => from(zustandEvents),
} as const satisfies Fixture;

export const fixtureRegistry = {
  tanstack: tanstackFixture,
  redux: reduxFixture,
  zustand: zustandFixture,
} as const satisfies Record<string, Fixture>;
