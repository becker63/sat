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
  {
    type: "addNodes",
    nodes: [
      {
        id: "function:useQuery",
        label: "useQuery",
        kind: "function",
        state: "anchor",
      },
    ],
    reason: "User query entrypoint",
  },

  { type: "iteration", step: 1 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:QueryObserver",
        label: "QueryObserver",
        kind: "function",
        state: "pending",
      },
    ],
    reason: "useQuery delegates to QueryObserver",
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

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:QueryClient",
        label: "QueryClient",
        kind: "function",
        state: "pending",
      },
      {
        id: "function:notifyManager",
        label: "notifyManager",
        kind: "function",
        state: "pending",
      },
    ],
    reason: "Observer interacts with QueryClient and scheduling",
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:QueryObserver",
        target: "function:QueryClient",
        kind: "references",
      },
      {
        source: "function:QueryObserver",
        target: "function:notifyManager",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 3 },

  {
    type: "addNodes",
    nodes: [
      {
        id: "function:Query",
        label: "Query",
        kind: "type",
        state: "pending",
      },
      {
        id: "function:Retryer",
        label: "Retryer",
        kind: "function",
        state: "pending",
      },
    ],
  },

  {
    type: "addEdges",
    edges: [
      {
        source: "function:QueryClient",
        target: "function:Query",
        kind: "references",
      },
      {
        source: "function:Query",
        target: "function:Retryer",
        kind: "calls",
      },
    ],
  },

  { type: "iteration", step: 4 },

  {
    type: "updateNode",
    id: "function:QueryObserver",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "function:QueryClient",
    patch: { state: "resolved" },
  },

  {
    type: "updateNode",
    id: "function:Query",
    patch: { state: "resolved" },
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
