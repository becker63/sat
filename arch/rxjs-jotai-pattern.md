# RxJS + Jotai Pattern (clean pipeline)

- Canonical flow: `GraphEvent$ → scan(reducer) → GraphState$ → Jotai atom → React`.
- Keep a single event stream; everything else derives from it (fixtures, solver, playback).

## Reducer (unchanged)
```ts
function applyGraphEvent(state: GraphState, event: GraphEvent): GraphState {
  switch (event.type) {
    case "addNodes": {
      const nodes = { ...state.nodes }
      for (const n of event.nodes) nodes[n.id] = n
      return { ...state, nodes }
    }
    case "addEdges":
      return { ...state, edges: [...state.edges, ...event.edges] }
    case "updateNode":
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [event.id]: { ...state.nodes[event.id], ...event.patch }
        }
      }
    case "setContext":
      return { ...state, context: new Set(event.nodes) }
    case "iteration":
      return { ...state, iteration: event.step }
    default:
      return state
  }
}
```

## Event streams
```ts
const fixture$ = from(events).pipe(concatMap(e => of(e).pipe(delay(800))))
const solver$ = solverStream(query) // Observable<GraphEvent>
```

## State stream
```ts
function createGraphState$(events$) {
  return events$.pipe(
    scan(applyGraphEvent, initialGraphState),
    shareReplay(1)
  )
}
```

## Jotai bridge
```ts
import { atomWithObservable } from "jotai/utils"

export const graphStateAtom = atomWithObservable(() =>
  createGraphState$(fixture$) // swap to solver$ later
)
```

- UI uses `useAtomValue(graphStateAtom)`; no RxJS in components.
- Swap fixtures → solver by changing the source observable; UI unchanged.
- Query cancellation: `query$.pipe(switchMap(q => solverStream(q)))`.
- Animation pacing: `events$.pipe(concatMap(e => of(e).pipe(delay(600))))` to slow playback without slowing solver.
- Logging/replay: `events$.subscribe(log)`; replay via `from(loggedEvents)`.
