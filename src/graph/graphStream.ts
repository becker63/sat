import {
  Observable,
  concatMap,
  delay,
  of,
  filter,
  take,
  startWith,
  from,
  withLatestFrom,
  map,
} from "rxjs";
import { scan, shareReplay, tap, concatMap as rxConcatMap } from "rxjs/operators";
import { applyGraphEvent, initialGraphState, type GraphState } from "./reducer";
import type { GraphEvent } from "./events";
import { layoutGraph } from "./layoutGraph";
import { relaxGraph } from "./relaxGraph";

const EVENT_DELAY_MS = 700;

export function createGraphState$(
  events$: Observable<GraphEvent>,
  playing$: Observable<boolean>,
  eventDelayMs = EVENT_DELAY_MS,
) {
  const gatedEvents$ = events$.pipe(
    // Each event waits until play is true before continuing; pausing halts the next step.
    concatMap((event) =>
      playing$.pipe(
        filter(Boolean),
        take(1),
        concatMap(() => of(event).pipe(delay(eventDelayMs))),
      ),
    ),
  );

  const reduced$ = gatedEvents$.pipe(
    tap((event) => {
      console.groupCollapsed("%cGraphEvent", "color:#4CAF50;font-weight:bold");
      console.log(event);
      console.groupEnd();
    }),

    scan(applyGraphEvent, initialGraphState),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  return gatedEvents$.pipe(
    filter((event) => event.type === "iteration" || event.type === "updateNode"),
    withLatestFrom(reduced$),
    concatMap(([event, state]) =>
      from(layoutGraph(state)).pipe(
        rxConcatMap((layouted) => relaxGraph(layouted)),
        map((s) => ({ state: s, event })),
      ),
    ),
    map(({ state, event }) => addPanTarget(state, event)),

    tap((state) => {
      console.groupCollapsed("%cGraphState", "color:#FF9800;font-weight:bold");
      console.log(state);
      console.groupEnd();
    }),

    startWith(initialGraphState),
    shareReplay({ bufferSize: 1, refCount: false }),
  );
}

function addPanTarget(state: GraphState, event: GraphEvent): GraphState {
  const positionedNodes = Object.values(state.nodes).filter((n) => n.positioned);

  const pickDeepest = () =>
    positionedNodes.reduce((best, node) => {
      if (!best) return node;
      return best.position.y > node.position.y ? best : node;
    }, positionedNodes[0] ?? null);

  const targetId =
    event.type === "updateNode"
      ? event.id
      : event.type === "iteration"
        ? pickDeepest()?.id ?? null
        : null;

  if (!targetId) return state;

  return {
    ...state,
    panTargetId: targetId,
    panTick: (state.panTick ?? 0) + 1,
  };
}
