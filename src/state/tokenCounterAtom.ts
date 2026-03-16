import { atom } from "jotai";
import type { GraphState } from "@/graph/reducer";
import { graphStateAtom } from "./graphStreamAtom";

export const contextTokenCountAtom = atom((get) => {
  const state = get(graphStateAtom) as GraphState;

  let total = 0;

  for (const node of Object.values(state.nodes)) {
    if (node.state === "resolved" || node.state === "anchor") {
      total += node.tokens ?? 0;
    }
  }

  return total;
});
