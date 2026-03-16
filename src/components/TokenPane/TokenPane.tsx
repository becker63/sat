"use client";

import { useAtomValue } from "jotai";
import { contextTokenCountAtom } from "@/state/tokenCounterAtom";
import { graphStateAtom } from "@/state/graphStreamAtom";
import {
  tokenCountBadgeClass,
  tokenPaneClass,
  tokenPaneHeaderClass,
  tokenPaneMetaRowClass,
  tokenPaneProgressClass,
  tokenPaneProgressFillClass,
} from "@/components/ui/search-styles";
import { Box } from "../../../styled-system/jsx";

const TOKEN_BUDGET = 4096;

export default function TokenPane() {
  const tokens = useAtomValue(contextTokenCountAtom);
  const graphState = useAtomValue(graphStateAtom);

  const currentNode =
    (graphState.panTargetId &&
      graphState.nodes[graphState.panTargetId]) ||
    null;
  const currentNodeLabel =
    currentNode?.label || currentNode?.id || "—";

  const budgetRatio = Math.max(
    0,
    Math.min(1, tokens / TOKEN_BUDGET),
  );

  return (
    <Box className={tokenPaneClass}>
      <Box className={tokenPaneHeaderClass}>
        <span>Context Tokens</span>
        <span className={tokenCountBadgeClass}>{tokens}</span>
      </Box>

      <Box
        className={tokenPaneProgressClass}
        aria-label="Context token usage"
      >
        <Box
          className={tokenPaneProgressFillClass}
          style={{
            transform: `scaleX(${budgetRatio || 0})`,
          }}
        />
      </Box>

      <Box className={tokenPaneMetaRowClass}>
        <span>Budget</span>
        <span>
          {tokens} / {TOKEN_BUDGET} (
          {Math.round(budgetRatio * 100)}%)
        </span>
      </Box>

      <Box className={tokenPaneMetaRowClass}>
        <span>Focus</span>
        <span>
          {currentNodeLabel}
          {currentNode?.tokens !== undefined &&
            ` · ${currentNode.tokens} tokens`}
        </span>
      </Box>
    </Box>
  );
}
