import { type Observable, of } from "rxjs";
import { concatMap, delay } from "rxjs/operators";
import { GRAPH_TIMING } from "../timing";

export function paceEvents<T extends { type: string }>(
  events$: Observable<T>,
): Observable<T> {
  return events$.pipe(
    concatMap((event) => {
      const delayMs =
        GRAPH_TIMING.EVENT_DELAYS[event.type as keyof typeof GRAPH_TIMING.EVENT_DELAYS] ?? 0;

      return of(event).pipe(delay(delayMs));
    }),
  );
}
