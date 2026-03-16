import { atom } from "jotai";
import { graphStateAtom } from "./graphStreamAtom";

export const contextTokenCountAtom = atom((get) => {
  const state = get(graphStateAtom);

  let total = 0;

  for (const node of Object.values(state.nodes)) {
    if (node.state === "resolved" || node.state === "anchor") {
      total += node.tokens ?? 0;
    }
  }

  return total;
});
