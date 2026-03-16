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

describe("panning behavior", () => {
  it("increments panTick when pan target changes", async () => {
    const events = [
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

    const ticks = states.map((s: any) => s.panTick);

    expect(Math.max(...ticks)).toBeGreaterThan(0);
  });
});
