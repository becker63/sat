import { atomWithObservable } from "jotai/utils";
import { selectedFixtureAtom } from "./fixtureAtom";
import { fixtureRegistry } from "@/graph/fixtures";
import { createGraphState$ } from "@/graph/graphStream";
import { graphPlayingAtom } from "./graphPlayback";
import { of } from "rxjs";
import { initialGraphState } from "@/graph/reducer";

/**
 * Cache for GraphState streams.
 *
 * Each fixture's GraphState observable is created once and reused.
 */
const graphStreamCache = new Map();

/**
 * Prewarm the cache so pipelines are constructed at startup.
 */
for (const [key, fixture] of Object.entries(fixtureRegistry)) {
  const events$ = fixture.events$();

  // temporary idle stream until playback begins
  const graphState$ = createGraphState$(events$, of(false));

  graphStreamCache.set(key, graphState$);
}

/**
 * graphStateAtom
 *
 * Bridges RxJS → Jotai.
 *
 * This atom rebuilds the observable whenever:
 *
 * • the selected fixture changes
 * • playback state changes
 */
export const graphStateAtom = atomWithObservable((get) => {
  const key = get(selectedFixtureAtom);
  const playing = get(graphPlayingAtom);

  if (!key) {
    return of(initialGraphState);
  }

  const events$ = fixtureRegistry[key].events$();

  // convert playback state to observable
  return createGraphState$(events$, of(playing));
});
