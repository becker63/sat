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
import { getDefaultStore } from "jotai";
import { initialTokenState, tokenReducer } from "@/state/tokenReducer";
import { tokenStateAtom } from "@/state/tokenStateAtom";
import type { TokenSource } from "@/state/tokenSources";

const EVENT_DELAY_MS = 700;
const tokenStore = getDefaultStore();
const nodeTokenCache = new Map<string, number>();
const resolvedNodes = new Set<string>();

const emitTokenAdd = (source: TokenSource, tokens: number) => {
  if (tokens <= 0) return;
  tokenStore.set(tokenStateAtom, (prev) => tokenReducer(prev, source, tokens));
};

function handleTokenSideEffects(event: GraphEvent) {
  if (event.type === "tokenAdd") {
    emitTokenAdd(event.source, event.tokens);
    return;
  }

  if (event.type === "addNodes") {
    for (const node of event.nodes) {
      if (node.state !== "anchor" && node.state !== "resolved") continue;

      const tokens = node.tokens ?? (node.state === "anchor" ? 24 : 0);
      if (!tokens) continue;

      nodeTokenCache.set(node.id, tokens);
      const source: TokenSource =
        node.id === "query"
          ? "query"
          : node.state === "anchor"
            ? "anchor"
            : "closure";

      emitTokenAdd(source, tokens);
    }
  }

  if (event.type === "updateNode" && event.patch.state === "resolved") {
    if (resolvedNodes.has(event.id)) return;

    const patchTokens =
      "tokens" in event.patch
        ? (event.patch as { tokens?: number }).tokens
        : undefined;

    const cached = nodeTokenCache.get(event.id) ?? 0;
    const tokens = patchTokens ?? cached;

    if (!tokens) return;
    resolvedNodes.add(event.id);
    nodeTokenCache.set(event.id, tokens);

    emitTokenAdd("anchor", -tokens);
    const source: TokenSource = event.id === "query" ? "query" : "closure";
    emitTokenAdd(source, tokens);
  }

  if (
    event.type === "updateNode" &&
    "tokens" in event.patch &&
    (event.patch as { tokens?: number }).tokens !== undefined
  ) {
    nodeTokenCache.set(
      event.id,
      (event.patch as { tokens?: number }).tokens as number,
    );
  }
}

export function createGraphState$(
  events$: Observable<GraphEvent>,
  playing$: Observable<boolean>,
  eventDelayMs = EVENT_DELAY_MS,
) {
  tokenStore.set(tokenStateAtom, { ...initialTokenState });
  nodeTokenCache.clear();
  resolvedNodes.clear();

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
    tap(handleTokenSideEffects),
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
      from(layoutGraph(state)).pipe(map((s) => ({ state: s, event }))),
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

  let targetId: string | null = null;

  if (event.type === "iteration") {
    targetId = pickDeepest()?.id ?? null;
  } else if (event.type === "updateNode") {
    const updated = state.nodes[event.id];
    if (updated?.positioned && updated.state === "resolved") {
      targetId = updated.id;
    }
  }

  if (!targetId) return state;

  return {
    ...state,
    panTargetId: targetId,
    panTick: (state.panTick ?? 0) + 1,
  };
}
