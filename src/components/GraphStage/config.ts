import { forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force";

import { collide } from "./forces";
import type { SimNode } from "./types";

export const SIM_CONFIG = {
  layoutScale: 1.25,
  durationMs: 6500,
  delayMs: 1200,
  settleSpeed: 0.04, // lower = slower motion; adjust to taste
  randomSeed: 1337,
} as const;

export function createSimulation() {
  return forceSimulation<SimNode>()
    .force("charge", forceManyBody().strength(-1200 * SIM_CONFIG.layoutScale))
    .force(
      "x",
      forceX()
        .x(0)
        .strength(0.06 * SIM_CONFIG.layoutScale),
    )
    .force(
      "y",
      forceY()
        .y(0)
        .strength(0.06 * SIM_CONFIG.layoutScale),
    )
    .force("collide", collide())
    .alphaTarget(0.05)
    .stop();
}
