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
    nodes: [{ id: "function:useQuery", kind: "function", state: "anchor" }],
  },
  { type: "iteration", step: 1 },
  {
    type: "addNodes",
    nodes: [
      { id: "function:QueryObserver", kind: "function", state: "pending" },
    ],
  },
];

const reduxEvents: GraphEvent[] = [
  {
    type: "addNodes",
    nodes: [{ id: "function:createSlice", kind: "function", state: "anchor" }],
  },
];

const zustandEvents: GraphEvent[] = [
  {
    type: "addNodes",
    nodes: [{ id: "function:createStore", kind: "function", state: "anchor" }],
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
