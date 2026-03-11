import { Observable } from "rxjs";
import { concatMap, delay, of } from "rxjs";
import { scan, shareReplay, tap } from "rxjs/operators";
import { applyGraphEvent, initialGraphState } from "./reducer";
import type { GraphEvent } from "./events";

const EVENT_DELAY_MS = 700;

export function createGraphState$(events$: Observable<GraphEvent>) {
  return events$.pipe(
    // centralized playback timing
    concatMap((event) => of(event).pipe(delay(EVENT_DELAY_MS))),

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

    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
