"use client";

import { useAtomValue } from "jotai";
import { graphStateAtom } from "@/state/graphStreamAtom";
import {
  tokenCountBadgeClass,
  tokenPaneClass,
  tokenPaneHeaderClass,
  tokenPaneMetaRowClass,
  tokenPaneSegmentClass,
  tokenPaneSubtleTextClass,
} from "@/components/ui/search-styles";
import type { GraphState } from "@/graph/reducer";
import { useMemo } from "react";
import { useAnimatedTokenCount } from "@/hooks/useAnimatedTokenCount";
import type { TokenContribution } from "@/state/tokenSources";
import { tokenStateAtom } from "@/state/tokenStateAtom";
import { Box, HStack } from "../../../styled-system/jsx";

const TOKEN_BUDGET = 1024;
const SEGMENTS = 32;

export default function TokenPane() {
  const graphState = useAtomValue(graphStateAtom);
  const tokenState = useAtomValue(tokenStateAtom);

  const currentNode =
    (graphState.panTargetId &&
      graphState.nodes[graphState.panTargetId]) ||
    null;
  const currentNodeLabel =
    currentNode?.label || currentNode?.id || "—";
  const currentNodeTokens =
    currentNode && "tokens" in currentNode
      ? (currentNode as { tokens?: number }).tokens
      : undefined;

  const contributions = useMemo<TokenContribution[]>(
    () => [
      { source: "query", tokens: tokenState.query },
      { source: "anchor", tokens: tokenState.anchor },
      { source: "closure", tokens: tokenState.closure },
      { source: "semantic", tokens: tokenState.semantic },
    ],
    [tokenState],
  );

  const queryTarget =
    contributions.find((c) => c.source === "query")?.tokens ?? 0;
  const anchorTarget =
    contributions.find((c) => c.source === "anchor")?.tokens ?? 0;
  const closureTarget =
    contributions.find((c) => c.source === "closure")?.tokens ?? 0;
  const semanticTarget =
    contributions.find((c) => c.source === "semantic")?.tokens ?? 0;

  const animatedQuery = useAnimatedTokenCount(queryTarget);
  const animatedAnchor = useAnimatedTokenCount(anchorTarget);
  const animatedClosure = useAnimatedTokenCount(closureTarget);
  const animatedSemantic = useAnimatedTokenCount(semanticTarget);

  const animatedContributions: TokenContribution[] = [
    { source: "query", tokens: animatedQuery },
    { source: "anchor", tokens: animatedAnchor },
    { source: "closure", tokens: animatedClosure },
    { source: "semantic", tokens: animatedSemantic },
  ];

  const animatedTotal = animatedContributions.reduce(
    (sum, c) => sum + c.tokens,
    0,
  );

  const budgetRatio = Math.max(
    0,
    Math.min(1, animatedTotal / TOKEN_BUDGET),
  );
  const anchorNodes = useMemo(
    () =>
      Object.values(graphState.nodes).filter(
        (
          n,
        ): n is GraphState["nodes"][string] & {
          state: "anchor";
          tokens?: number;
        } => n.state === "anchor",
      ),
    [graphState.nodes],
  );
  const anchorCount = anchorNodes.length;
  const avgAnchorTokens =
    anchorCount === 0
      ? 0
      : Math.round(
          anchorNodes.reduce(
            (sum, n) => sum + (n.tokens ?? 0),
            0,
          ) / anchorCount,
        );

  const tokensPerSegment = TOKEN_BUDGET / SEGMENTS;
  const segments: Array<{ source: TokenContribution["source"] | null }> =
    animatedContributions.flatMap((contrib) => {
      const count = Math.round(contrib.tokens / tokensPerSegment);
      return Array.from({ length: count }, () => ({
        source: contrib.source,
      }));
    });

  while (segments.length < SEGMENTS) {
    segments.push({ source: null });
  }
  const limitedSegments = segments.slice(0, SEGMENTS);

  return (
    <Box className={tokenPaneClass}>
      <Box className={tokenPaneHeaderClass}>
        <span>Context Window</span>
        <span className={tokenCountBadgeClass}>
          {Math.round(animatedTotal)}
        </span>
      </Box>

      <Box>
        <HStack gap="0.5">
          {limitedSegments.map((seg, i) => (
            <Box
              key={i}
              className={tokenPaneSegmentClass}
              data-source={seg.source ?? undefined}
            />
          ))}
        </HStack>
      </Box>

      <Box className={tokenPaneSubtleTextClass}>
        {Math.round(animatedTotal)} / {TOKEN_BUDGET} tokens (
        {Math.round(budgetRatio * 100)}%)
      </Box>

      <Box className={tokenPaneSubtleTextClass}>
        anchors: {anchorCount} · avg tokens/anchor: {avgAnchorTokens}
      </Box>

      <Box className={tokenPaneMetaRowClass}>
        <span>Focus</span>
        <span>
          {currentNodeLabel}
          {currentNodeTokens !== undefined &&
            ` · ${currentNodeTokens} tokens`}
        </span>
      </Box>
    </Box>
  );
}
