import { atomWithObservable } from "jotai/utils";
import { EMPTY } from "rxjs";
import { selectedFixtureAtom } from "./fixtureAtom";
import { fixtureRegistry } from "@/graph/fixtures";
import { createGraphState$ } from "@/graph/graphStream";

/**
 * Cache for GraphState streams.
 *
 * Each fixture's graph stream is created only once and reused
 * whenever that fixture is selected again.
 */
const graphStreamCache = new Map();

/**
 * graphStateAtom
 *
 * This atom exposes our GraphState as a Jotai atom, but the underlying
 * state is actually produced by an RxJS stream.
 *
 * atomWithObservable lets us plug an RxJS Observable directly into Jotai.
 * Jotai will subscribe to the stream and update React whenever new values arrive.
 */
export const graphStateAtom = atomWithObservable((get) => {
  /**
   * Read the currently selected fixture from Jotai state.
   */
  const key = get(selectedFixtureAtom);

  /**
   * If no fixture is selected we return an empty observable.
   */
  if (!key) {
    return EMPTY;
  }

  /**
   * If we have not created a stream for this fixture yet,
   * build it now and store it in the cache.
   */
  if (!graphStreamCache.has(key)) {
    const events$ = fixtureRegistry[key].events$();
    const graphState$ = createGraphState$(events$);

    graphStreamCache.set(key, graphState$);
  }

  /**
   * Return the cached GraphState stream for this fixture.
   */
  return graphStreamCache.get(key);
});
