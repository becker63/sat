import { describe, expect, it } from "vitest";
import { layoutGraph, NODE_HEIGHT, NODE_WIDTH } from "./layoutGraph";
import type { GraphState } from "./reducer";

function baseState(nodes: GraphState["nodes"], edges: GraphState["edges"] = []): GraphState {
  return {
    nodes,
    edges,
    context: new Set(),
    iteration: 0,
    panTargetId: null,
    panTick: 0,
  };
}

describe("layoutGraph incremental positioning", () => {
  it("does not move previously positioned nodes when new nodes are added", async () => {
    const initial = baseState({
      a: {
        id: "a",
        label: "A",
        kind: "function",
        state: "resolved",
        positioned: true,
        position: { x: 0, y: 0 },
      },
      b: {
        id: "b",
        label: "B",
        kind: "function",
        state: "pending",
        positioned: false,
        position: { x: 0, y: 0 },
      },
    }, [{ source: "a", target: "b", kind: "calls" }]);

    const result = await layoutGraph(initial);

    expect(result.nodes.a.position).toEqual({ x: 0, y: 0 });
  });

  it("places child nodes below their parent on the main chain", async () => {
    const state = baseState(
      {
        a: {
          id: "a",
          label: "A",
          kind: "function",
          state: "resolved",
          positioned: true,
          position: { x: 0, y: 0 },
        },
        b: {
          id: "b",
          label: "B",
          kind: "function",
          state: "pending",
          positioned: false,
          position: { x: 0, y: 0 },
        },
      },
      [{ source: "a", target: "b", kind: "calls" }],
    );

    const result = await layoutGraph(state);

    expect(result.nodes.b.position.y).toBeGreaterThan(result.nodes.a.position.y);
    expect(result.nodes.b.position.x).toBe(result.nodes.a.position.x);
  });

  it("places branch nodes horizontally beside parent", async () => {
    const state = baseState(
      {
        a: {
          id: "a",
          label: "A",
          kind: "function",
          state: "resolved",
          positioned: true,
          position: { x: 0, y: 0 },
        },
        b: {
          id: "b",
          label: "B",
          kind: "function",
          state: "pending",
          positioned: false,
          position: { x: 0, y: 0 },
        },
        c: {
          id: "c",
          label: "C",
          kind: "function",
          state: "pending",
          positioned: false,
          position: { x: 0, y: 0 },
        },
      },
      [
        { source: "a", target: "b", kind: "references" },
        { source: "a", target: "c", kind: "references" },
      ],
    );

    const result = await layoutGraph(state);

    expect(result.nodes.b.position.x).not.toBe(result.nodes.a.position.x);
    expect(result.nodes.c.position.x).not.toBe(result.nodes.a.position.x);
    expect(result.nodes.b.position.y).toBe(result.nodes.a.position.y);
    expect(result.nodes.c.position.y).toBe(result.nodes.a.position.y);
  });

  it("does not recompute layout when no new nodes are added", async () => {
    const state = baseState({
      a: {
        id: "a",
        label: "A",
        kind: "function",
        state: "resolved",
        positioned: true,
        position: { x: 100, y: 200 },
      },
    });

    const result = await layoutGraph(state);

    expect(result.nodes.a.position).toEqual({ x: 100, y: 200 });
  });
});
