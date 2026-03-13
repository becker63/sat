import { from, of } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { Position, ReactFlowProvider } from "@xyflow/react";
import { createGraphState$ } from "@/graph/graphStream";
import type { GraphEvent } from "@/graph/events";
import type { GraphState } from "@/graph/reducer";
import { buildFlowElements } from "./GraphStage";
import { AnimatedGraphEdge } from "./AnimatedGraphEdge";
import { firstValueFrom, filter, take } from "rxjs";

vi.mock("@/graph/layoutGraph", () => {
  return {
    layoutGraph: (state: GraphState) =>
      new Promise<GraphState>((resolve) => {
        setTimeout(() => {
          const positionedNodes = Object.fromEntries(
            Object.entries(state.nodes).map(([id, node], index) => {
              // Simulate different layouts depending on edge awareness
              const hasEdges = state.edges.length > 0;
              return [
                id,
                {
                  ...node,
                  positioned: true,
                  position: hasEdges
                    ? { x: 100 + index * 10, y: 200 + index * 20 }
                    : { x: 0, y: 0 },
                },
              ];
            }),
          );

          resolve({ ...state, nodes: positionedNodes });
        }, 25);
      }),
    NODE_HEIGHT: 40,
    NODE_WIDTH: 180,
    EDGE_SCALE: 0.35,
  };
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("GraphStage layout pipeline", () => {
  it("does not emit nodes until layout resolves", async () => {
    vi.useFakeTimers();

    const events: GraphEvent[] = [
      {
        type: "addNodes",
        nodes: [
          { id: "function:a", label: "A", kind: "function", state: "pending" },
          { id: "function:b", label: "B", kind: "function", state: "pending" },
        ],
      },
      {
        type: "addEdges",
        edges: [
          { source: "function:a", target: "function:b", kind: "calls" },
        ],
      },
      { type: "iteration", step: 1 },
    ];

    const statePromise = firstValueFrom(
      createGraphState$(from(events), of(true), 0).pipe(
        filter((s) => Object.keys(s.nodes).length > 0),
        take(1),
      ),
    );

    // Let layout + relaxation resolve
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const latest = await statePromise;
    const nodes = Object.values(latest.nodes);
    expect(nodes.every((n) => n.positioned)).toBe(true);
    expect(nodes.every((n) => n.position.y >= 50)).toBe(true);
  });

  it("marks first render of positioned nodes as non-animated", () => {
    const graphState: GraphState = {
      nodes: {
        a: {
          id: "a",
          label: "A",
          kind: "function",
          state: "pending",
          positioned: true,
          position: { x: 100, y: 200 },
        },
      },
      edges: [],
      context: new Set(),
      iteration: 0,
      panTargetId: null,
      panTick: 0,
    };

    const prevIds = new Set<string>();

    const { nodes } = buildFlowElements(graphState, prevIds);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].style?.transition).toBe("none");

    const { nodes: secondPass } = buildFlowElements(
      graphState,
      new Set(nodes.map((n) => n.id)),
      new Set(),
    );

    expect(secondPass[0].style?.transition).toContain("transform");
  });

  it("animates edges only on first appearance", () => {
    const graphState: GraphState = {
      nodes: {
        a: {
          id: "a",
          label: "A",
          kind: "function",
          state: "pending",
          positioned: true,
          position: { x: 0, y: 0 },
        },
        b: {
          id: "b",
          label: "B",
          kind: "function",
          state: "pending",
          positioned: true,
          position: { x: 100, y: 100 },
        },
      },
      edges: [{ source: "a", target: "b", kind: "calls" }],
      context: new Set(),
      iteration: 0,
      panTargetId: null,
      panTick: 0,
    };

    const { edges } = buildFlowElements(graphState, new Set(), new Set());
    expect(edges[0].data?.animateOnMount).toBe(true);

    const { edges: edgesSecond } = buildFlowElements(
      graphState,
      new Set(["a", "b"]),
      new Set(edges.map((e) => e.id)),
    );
    expect(edgesSecond[0].data?.animateOnMount).toBe(false);
  });

  it("renders edge animation only once per mount", () => {
    const baseProps = {
      id: "a-b-0",
      sourceX: 0,
      sourceY: 0,
      targetX: 100,
      targetY: 100,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      markerEnd: undefined,
      data: { kind: "calls", animateOnMount: true },
    };

    const { rerender } = render(
      <ReactFlowProvider>
        <svg>
          <AnimatedGraphEdge {...(baseProps as any)} />
        </svg>
      </ReactFlowProvider>,
    );

    const firstPath = screen.getByTestId("graph-edge").querySelector("path");
    expect(firstPath?.getAttribute("data-animate")).toBe("true");

    rerender(
      <ReactFlowProvider>
        <svg>
          <AnimatedGraphEdge {...(baseProps as any)} />
        </svg>
      </ReactFlowProvider>,
    );

    const secondPath = screen.getByTestId("graph-edge").querySelector("path");
    expect(secondPath?.getAttribute("data-animate")).toBe("false");
  });
});
