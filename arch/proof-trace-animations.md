# Proof-Trace Animations (causal growth)

- Goal: make the graph feel like causal reasoning: edge grows → pulls node into existence → node resolves.
- Works with existing events (addNodes/addEdges/updateNode) and Framer Motion + React Flow.

## Edge-first growth
```tsx
<motion.path
  d={path}
  stroke="white"
  strokeWidth={2}
  fill="none"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.35 }}
/>
```

## Node spawn after edge reaches tip
```tsx
<motion.div
  initial={{ scale: 0.6, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.25, delay: 0.35 }} // matches edge draw
>
  {label}
</motion.div>
```

## Causal pulse on parent
```tsx
<motion.div
  animate={{
    boxShadow: [
      "0 0 0px rgba(59,130,246,0)",
      "0 0 12px rgba(59,130,246,0.8)",
      "0 0 0px rgba(59,130,246,0)"
    ]
  }}
  transition={{ duration: 0.6 }}
>
  {parentLabel}
</motion.div>
```

## Pending placeholder
```tsx
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ repeat: Infinity, duration: 1.2 }}
>
  ?
</motion.div>
```

## Resolve transition
```tsx
<motion.div
  animate={{
    backgroundColor: state === "resolved" ? "#22c55e" : "#facc15"
  }}
  transition={{ duration: 0.3 }}
>
  {label}
</motion.div>
```

## Iteration banner
Flash on `iteration` event: “Iteration N — call expansion/missing symbol” (top-center, ~1s).

## Camera nudge
Optionally `setCenter(x, y, { duration: 500 })` toward newest node to guide attention.

## Storyboard example
useQuery (glow) → edge draws → QueryObserver spawns pending → resolves → edge draws → focusManager spawns → resolves → edge draws → refetch spawns → resolves. Path lights up as the answer is “discovered.”

## Edge-Anchored Ghost Nodes (pending frontier)
- Spawn pending nodes at the tip of the causal edge that discovered them (use parent position + offset). Ghost: dashed/low opacity, spinner/“resolving…”.
- Sequence: parent glows → edge grows → ghost appears at edge tip → ghost resolves (pending→resolved, label appears, color morph).
- Keep position stable between ghost and resolved state for a smooth morph; optionally a light layout relax after resolution (not during discovery).
