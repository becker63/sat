"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { graphStateAtom } from "@/state/graphStreamAtom";
import {
  tokenCountBadgeClass,
  tokenPaneClass,
  tokenPaneHeaderClass,
  tokenPaneMetaRowClass,
  tokenPaneSegmentClass,
  tokenPaneSubtleTextClass,
} from "@/components/ui/search-styles";
import { useEffect, useMemo } from "react";
import { useAnimatedTokenCount } from "@/hooks/useAnimatedTokenCount";
import {
  tokenContributionsAtom,
  type TokenContribution,
  type TokenSource,
} from "@/state/tokenSources";
import { Box, HStack } from "../../../styled-system/jsx";

const TOKEN_BUDGET = 1024;
const SEGMENTS = 32;

export default function TokenPane() {
  const graphState = useAtomValue(graphStateAtom);
  const setContributions = useSetAtom(tokenContributionsAtom);

  const currentNode =
    (graphState.panTargetId &&
      graphState.nodes[graphState.panTargetId]) ||
    null;
  const currentNodeLabel =
    currentNode?.label || currentNode?.id || "—";

  const anchorNodes = useMemo(
    () =>
      Object.values(graphState.nodes).filter(
        (n) => n.state === "anchor",
      ),
    [graphState.nodes],
  );

  useEffect(() => {
    const entries: Record<TokenSource, number> = {
      query: 0,
      anchor: 0,
      closure: 0,
      semantic: 0,
    };

    for (const node of Object.values(graphState.nodes)) {
      const nodeTokens =
        node.tokens ??
        (node.state === "anchor" ? 24 : 0);

      // only count nodes in or ready for context
      if (node.state !== "anchor" && node.state !== "resolved") continue;

      if (node.id === "query") {
        entries.query += nodeTokens;
        continue;
      }

      if (node.state === "anchor") {
        entries.anchor += nodeTokens;
        continue;
      }

      if (node.state === "resolved") {
        entries.closure += nodeTokens;
        continue;
      }
    }

    const nextContributions: TokenContribution[] = [
      { source: "query", tokens: entries.query },
      { source: "anchor", tokens: entries.anchor },
      { source: "closure", tokens: entries.closure },
      { source: "semantic", tokens: entries.semantic },
    ];

    setContributions(nextContributions);
  }, [graphState.nodes, setContributions]);

  const contributions = useAtomValue(tokenContributionsAtom);

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
  const segments = animatedContributions.flatMap((contrib) => {
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
          {currentNode?.tokens !== undefined &&
            ` · ${currentNode.tokens} tokens`}
        </span>
      </Box>
    </Box>
  );
}
