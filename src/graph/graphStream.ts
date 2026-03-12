import { Observable, concatMap, delay, of, filter, take, startWith } from "rxjs";
import { scan, shareReplay, tap } from "rxjs/operators";
import { applyGraphEvent, initialGraphState } from "./reducer";
import type { GraphEvent } from "./events";

const EVENT_DELAY_MS = 700;

export function createGraphState$(
  events$: Observable<GraphEvent>,
  playing$: Observable<boolean>,
) {
  const gatedEvents$ = events$.pipe(
    // Each event waits until play is true before continuing; pausing halts the next step.
    concatMap((event) =>
      playing$.pipe(
        filter(Boolean),
        take(1),
        concatMap(() => of(event).pipe(delay(EVENT_DELAY_MS))),
      ),
    ),
  );

  return gatedEvents$.pipe(
    tap((event) => {
      console.groupCollapsed("%cGraphEvent", "color:#4CAF50;font-weight:bold");
      console.log(event);
      console.groupEnd();
    }),

    scan(applyGraphEvent, initialGraphState),

    tap((state) => {
      console.groupCollapsed("%cGraphState", "color:#FF9800;font-weight:bold");
      console.log(state);
      console.groupEnd();
    }),

    startWith(initialGraphState),
    shareReplay({ bufferSize: 1, refCount: false }),
  );
}
