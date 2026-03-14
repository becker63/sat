import { describe, expect, it } from "vitest";
import { layoutGraph } from "./layoutGraph";
import type { GraphState } from "./reducer";

function baseState(
  nodes: GraphState["nodes"],
  edges: GraphState["edges"] = [],
): GraphState {
  return {
    nodes,
    edges,
    context: new Set(),
    iteration: 0,
    panTargetId: null,
    panTick: 0,
  };
}

const node = (
  id: string,
  state: GraphState["nodes"][string]["state"] = "pending",
): GraphState["nodes"][string] => ({
  id,
  label: id,
  kind: "function",
  state,
  positioned: false,
  position: { x: 0, y: 0 },
});

describe("layoutGraph (d3-dag layered layout)", () => {
  it("keeps anchors on the same layer horizontally", async () => {
    const state = baseState({
      a: node("a", "anchor"),
      b: node("b", "anchor"),
      c: node("c", "anchor"),
    });

    const result = await layoutGraph(state);

    const yValues = [
      result.nodes.a.position.y,
      result.nodes.b.position.y,
      result.nodes.c.position.y,
    ];
    const xValues = [
      result.nodes.a.position.x,
      result.nodes.b.position.x,
      result.nodes.c.position.x,
    ];

    expect(new Set(yValues).size).toBe(1);
    expect(Math.max(...xValues) - Math.min(...xValues)).toBeGreaterThan(0);
  });

  it("places dependencies on deeper layers in a DAG chain", async () => {
    const state = baseState(
      {
        a: node("a", "anchor"),
        b: node("b"),
        c: node("c"),
      },
      [
        { source: "a", target: "b", kind: "calls" },
        { source: "b", target: "c", kind: "calls" },
      ],
    );

    const result = await layoutGraph(state);

    expect(result.nodes.a.position.y).toBeLessThan(result.nodes.b.position.y);
    expect(result.nodes.b.position.y).toBeLessThan(result.nodes.c.position.y);
  });

  it("keeps branches from the same parent on the same layer", async () => {
    const state = baseState(
      {
        a: node("a", "anchor"),
        b: node("b"),
        c: node("c"),
        d: node("d"),
      },
      [
        { source: "a", target: "b", kind: "calls" },
        { source: "b", target: "c", kind: "calls" },
        { source: "b", target: "d", kind: "calls" },
      ],
    );

    const result = await layoutGraph(state);

    expect(result.nodes.c.position.y).toBeCloseTo(result.nodes.d.position.y);
  });

  it("centers shared dependencies beneath multiple anchors", async () => {
    const state = baseState(
      {
        a: node("a", "anchor"),
        b: node("b", "anchor"),
        c: node("c"),
      },
      [
        { source: "a", target: "c", kind: "calls" },
        { source: "b", target: "c", kind: "calls" },
      ],
    );

    const result = await layoutGraph(state);

    const anchorY = result.nodes.a.position.y;
    const cY = result.nodes.c.position.y;
    const midpoint = (result.nodes.a.position.x + result.nodes.b.position.x) / 2;

    expect(cY).toBeGreaterThan(anchorY);
    expect(Math.abs(result.nodes.c.position.x - midpoint)).toBeLessThan(1);
  });

  it("freezes existing coordinates when new nodes are added", async () => {
    const initial = await layoutGraph(
      baseState(
        {
          a: node("a", "anchor"),
          b: node("b"),
        },
        [{ source: "a", target: "b", kind: "calls" }],
      ),
    );

    const withNewNode: GraphState = {
      ...initial,
      nodes: {
        ...initial.nodes,
        c: node("c"),
      },
      edges: [
        ...initial.edges,
        { source: "b", target: "c", kind: "calls" },
      ],
    };

    const result = await layoutGraph(withNewNode);

    expect(result.nodes.a.position).toEqual(initial.nodes.a.position);
    expect(result.nodes.b.position).toEqual(initial.nodes.b.position);
  });

  it("keeps anchor y fixed across incremental layouts", async () => {
    const first = await layoutGraph(
      baseState({
        anchor: node("anchor", "anchor"),
      }),
    );

    const anchorY = first.nodes.anchor.position.y;

    const second = await layoutGraph({
      ...first,
      nodes: {
        ...first.nodes,
        next: node("next"),
      },
      edges: [...first.edges, { source: "anchor", target: "next", kind: "calls" }],
    });

    expect(second.nodes.anchor.position.y).toBe(anchorY);
  });
});
