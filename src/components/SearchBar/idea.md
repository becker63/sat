Got it — this is actually **even better** than the scroll idea because it keeps the interaction **spatially local** to the bar. Nothing depends on page movement; everything is **cursor proximity**. That makes it feel tighter and more intentional.

Here’s the corrected overview.

---

# Demo Interaction Overview

## Core Principle

The UI is **stage-first**.

Permanent elements:

```text
query input
reasoning graph (React Flow)
```

Everything else appears **only when the user’s cursor indicates intent**.

The graph remains the **visual center of the demo**.

---

# Interaction Flow

## 1. Idle State

The interface starts minimal.

```
[ Search symbol... ]  Replay
```

The graph canvas sits behind it as the main stage.

No menus or controls are visible.

---

## 2. Hover State (Segment Activation)

When the cursor enters the search bar area:

```
perimeter segment appears
```

A short animated line follows the cursor around the border.

Purpose:

* subtle affordance
* indicates the bar is interactive
* visually anchors attention without distracting from the graph

The segment disappears when the cursor leaves the bar.

---

## 3. Cursor Moves Below the Bar (Corpus Selector Appears)

When the segment is active **and the cursor moves downward past the bar**, a small menu **materializes geometrically below it**.

Example:

```
Corpus

TanStack Query
Redux Toolkit
Zustand
React Router
```

Properties:

* appears directly below the search bar
* aligned with the bar’s width
* fades in quickly
* anchored visually to the bar

No dropdown arrows or explicit buttons are required.

The menu exists only while the cursor remains within the **interactive region around the bar**.

---

## 4. Cursor Leaves the Interaction Region

When the cursor leaves the search bar area:

```
segment fades
repo selector fades
```

Both disappear together with the same timing.

The UI returns to the minimal state.

---

# Interaction Model

The behavior follows **cursor proximity**, not clicks or scroll events.

```
cursor enters bar → segment appears
cursor moves below → repo selector appears
cursor leaves region → both fade out
```

This creates a single **coherent interaction zone**.

---

# Why This Works for the Demo

### 1. The Graph Remains the Focus

Only two persistent elements exist:

```
query
graph
```

All controls are temporary.

---

### 2. The UI Feels Spatial

The menu appears because the cursor moves **through space**, not because a button was pressed.

That feels natural and exploratory.

---

### 3. The Interaction Matches the Concept

The system flow is:

```
query
↓
select repository
↓
reason over minimal graph
```

The UI reveals these steps in the same order.

---

### 4. It Shows Frontend Discipline

The design demonstrates:

* progressive disclosure
* minimal interface
* animation tied to intent
* no dashboard clutter

The interaction feels **purposeful rather than decorative**.

---

# Final Result

The interface becomes a **two-element stage**:

```
query interface
+
graph reasoning visualization
```

All other controls appear **only when the user’s movement suggests they need them**.

This keeps attention on the **graph-based reasoning system**, which is the real subject of the demo.

Also: Make the repo selector width match the search bar exactly.
