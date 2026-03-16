# Framer Motion + RxJS + React Flow (smooth updates)

- Goal: align solver events with animation phases: batch structural updates per frame, animate visual state changes individually.

## Split streams
```ts
const [structure$, visual$] = partition(
  graphEvent$,
  e => ["addNodes","addEdges","removeNodes","removeEdges"].includes(e.type)
)
```

## Batch structural events per frame
```ts
const structureBatch$ = structure$.pipe(
  bufferTime(16),          // or buffer(animationFrames())
  filter(batch => batch.length > 0)
)
```

## Merge back
```ts
const merged$ = merge(structureBatch$, visual$)
```

## Reducer for batches or singles
```ts
function applyGraphEvents(state, events) {
  let next = state
  for (const e of events) next = applyGraphEvent(next, e)
  return next
}

const graphState$ = merged$.pipe(
  scan((state, e) => Array.isArray(e) ? applyGraphEvents(state, e) : applyGraphEvent(state, e), initialGraphState),
  shareReplay(1)
)
```

## Framer Motion patterns
- Node pop-in: `initial {scale:0.7, opacity:0} → animate {scale:1, opacity:1}` (~200ms).
- Pending pulse: slow scale loop on pending nodes.
- Resolve: color interpolate pending→resolved.
- Edge draw: motion.path `pathLength 0→1` (~350–400ms).
- Iteration banner: keyed motion div on `iteration` event.
- Timing rhythm (suggested): iteration delay ~700ms; node spawn ~200ms; edge draw ~350ms; resolve ~250ms.

## Why it matters
- Structural bursts (addNodes/Edges) render once per frame → no jitter.
- Visual state changes still animate smoothly via Framer Motion.
- Clean pipeline: solver → GraphEvent$ → (partition + batch) → scan → GraphState$ → Jotai atom → React Flow.
