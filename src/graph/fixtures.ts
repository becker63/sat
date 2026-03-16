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
    patch: {
      state: "resolved",
      tokens: 36,
      evidence: {
        file: "redux/createReducer.ts",
        startLine: 12,
        snippet: `export function createReducer(initialState, builderCallback) {
  const actionsMap = builderCallback({})
  return function reducer(state = initialState, action) {
    const caseReducer = actionsMap[action.type]
    return caseReducer ? caseReducer(state, action) : state
  }
}`,
      },
    },
  },

  {
    type: "updateNode",
    id: "function:createAction",
    patch: {
      state: "resolved",
      tokens: 22,
      evidence: {
        file: "redux/createAction.ts",
        startLine: 8,
        snippet: `export function createAction(type) {
  const actionCreator = payload => ({ type, payload })
  actionCreator.toString = () => type
  return actionCreator
}`,
      },
    },
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
    patch: {
      state: "resolved",
      tokens: 26,
      evidence: {
        file: "zustand/core.ts",
        startLine: 14,
        snippet: `const setState = (partial, replace) => {
  const nextState = typeof partial === "function" ? partial(state) : partial
  state = replace ? nextState : { ...state, ...nextState }
  listeners.forEach(listener => listener(state))
}`,
      },
    },
  },

  {
    type: "updateNode",
    id: "function:subscribe",
    patch: {
      state: "resolved",
      tokens: 18,
      evidence: {
        file: "zustand/core.ts",
        startLine: 28,
        snippet: `const subscribe = listener => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}`,
      },
    },
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
