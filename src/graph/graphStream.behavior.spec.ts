import { describe, it, expect } from "vitest";
import { from, of } from "rxjs";
import { createGraphState$ } from "./graphStream";

async function collectStates<T>(stream$: { subscribe: any }) {
  const states: T[] = [];

  await new Promise<void>((resolve) => {
    stream$.subscribe({
      next: (s: T) => states.push(s),
      complete: resolve,
    });
  });

  return states;
}

describe("graphStream behavior", () => {
  it("transitions node from pending to resolved", async () => {
    const events = [
      {
        type: "addNodes",
        nodes: [
          {
            id: "nodeA",
            kind: "function" as const,
            state: "pending" as const,
          },
        ],
      },
      {
        type: "updateNode",
        id: "nodeA",
        patch: {
          state: "resolved" as const,
          tokens: 12,
          evidence: { snippet: "test" },
        },
      },
    ];

    const states = await collectStates(createGraphState$(from(events), of(true)));

    const last = states.at(-1)!;

    expect(last.nodes.nodeA.state).toBe("resolved");
  });

  it("pans to node when it resolves", async () => {
    const events = [
      {
        type: "addNodes",
        nodes: [
          {
            id: "nodeA",
            kind: "function" as const,
            state: "pending" as const,
          },
        ],
      },
      {
        type: "updateNode",
        id: "nodeA",
        patch: {
          state: "resolved" as const,
          tokens: 5,
          evidence: { snippet: "example" },
        },
      },
    ];

    const states = await collectStates(createGraphState$(from(events), of(true)));

    const last = states.at(-1)!;

    expect(last.panTargetId).toBe("nodeA");
    expect(last.panTick).toBeGreaterThan(0);
  });

  it("pans when iteration advances", async () => {
    const events = [
      {
        type: "addNodes",
        nodes: [
          {
            id: "nodeA",
            kind: "function" as const,
            state: "anchor" as const,
          },
        ],
      },
      {
        type: "iteration",
        step: 1,
      },
    ];

    const states = await collectStates(createGraphState$(from(events), of(true)));

    const last = states.at(-1)!;

    expect(last.panTargetId).not.toBeNull();
  });

  it("preserves event order", async () => {
    const events = [
      { type: "iteration", step: 1 },
      {
        type: "addNodes",
        nodes: [{ id: "A", kind: "function" as const, state: "pending" as const }],
      },
      {
        type: "updateNode",
        id: "A",
        patch: { state: "resolved" as const, tokens: 1, evidence: { snippet: "" } },
      },
    ];

    const states = await collectStates(createGraphState$(from(events), of(true)));

    expect(states.length).toBeGreaterThanOrEqual(3);
  });

  it("matches golden state trace", async () => {
    const events = [
      {
        type: "addNodes",
        nodes: [{ id: "A", kind: "function" as const, state: "anchor" as const }],
      },
      { type: "iteration", step: 1 },
      {
        type: "updateNode",
        id: "A",
        patch: { state: "resolved" as const, tokens: 5, evidence: { snippet: "" } },
      },
    ];

    const states = await collectStates(createGraphState$(from(events), of(true)));

    expect(states).toMatchSnapshot();
  });
});
