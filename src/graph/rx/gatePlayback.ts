import { type Observable } from "rxjs";
import { concatMap, filter, map, take } from "rxjs/operators";

export function gatePlayback<T>(
  events$: Observable<T>,
  playing$: Observable<boolean>,
): Observable<T> {
  return events$.pipe(
    concatMap((event) =>
      playing$.pipe(
        filter(Boolean),
        take(1),
        map(() => event),
      ),
    ),
  );
}
