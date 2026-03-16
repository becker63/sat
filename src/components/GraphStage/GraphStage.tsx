"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  BackgroundVariant,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Controls,
  type Edge,
  type Node,
} from "@xyflow/react";

import {
  GraphBackground,
  ThemedReactFlow,
  graphStageBackgroundClass,
  reactFlowCanvasClass,
} from "@/components/ui";

import { flowDraggingAtom } from "@/state/searchbar";

import {
  graphInitialEdgesAtom,
  graphInitialNodesAtom,
} from "@/state/graphStage";

import { reactFlowTheme } from "@/theme/react-flow";

import { useFollowNodes } from "./useFollowNodes";
import { GraphNode } from "@/components/GraphNode";
import { AnimatedGraphEdge } from "./AnimatedGraphEdge";

import "@xyflow/react/dist/style.css";

import { graphStateAtom } from "@/state/graphStreamAtom";
import type { GraphState } from "@/graph/reducer";

const nodeTypes = {
  graph: GraphNode,
};

const edgeTypes = {
  graph: AnimatedGraphEdge,
};

const INITIAL_ZOOM = 1.5;

const isNode = (n: Node | undefined): n is Node => Boolean(n);

export function buildFlowElements(
  graphState: GraphState,
  prevIds: Set<string>,
  prevEdgeIds: Set<string> = new Set(),
) {
  const ids = Object.keys(graphState.nodes);

  const nodes: Node[] = ids
    .map((id) => {
      const n = graphState.nodes[id];
      const hasPrev = prevIds.has(id);

      if (!n.positioned) return null;

      return {
        id: n.id,
        type: "graph",
        data: {
          label: n.label ?? n.id,
          state: n.state,
          kind: n.kind,
          tokens:
            n.state === "resolved" || n.state === "anchor"
              ? n.tokens
              : undefined,
          evidence:
            n.state === "resolved" || n.state === "anchor"
              ? n.evidence
              : undefined,
          inContext: graphState.context.has(n.id),
        },
        position: n.position,
        selectable: false,
        draggable: false,
        style: {
          transition: hasPrev
            ? "transform 0.45s cubic-bezier(.22,1,.36,1)"
            : "none",
        },
      };
    })
    .filter(Boolean) as Node[];

  const edges: Edge[] = graphState.edges.map((e, index) => ({
    id: `${e.source}-${e.target}-${index}`,
    source: e.source,
    target: e.target,
    animated: false,
    type: "graph",
    label: e.kind,
    data: {
      kind: e.kind,
      animateOnMount: !prevEdgeIds.has(`${e.source}-${e.target}-${index}`),
      primary: e.primary,
    },
  }));

  return {
    nodes,
    edges,
    renderedIds: nodes.map((n) => n.id),
    renderedEdgeIds: edges.map((e) => e.id),
  };
}

function GraphStageInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  const followNodes = useFollowNodes(containerRef, INITIAL_ZOOM);

  const initialNodes = useAtomValue(graphInitialNodesAtom);
  const initialEdges = useAtomValue(graphInitialEdgesAtom);

  const graphState = useAtomValue(graphStateAtom);

  const setFlowDragging = useSetAtom(flowDraggingAtom);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  const prevNodeIdsRef = useRef<Set<string>>(new Set());
  const prevEdgeIdsRef = useRef<Set<string>>(new Set());

  /**
   * Always reconcile rendered graph from latest graphState
   */
  useEffect(() => {
    const prevIds = prevNodeIdsRef.current;

    const {
      nodes: mappedNodes,
      edges: mappedEdges,
      renderedIds,
      renderedEdgeIds,
    } = buildFlowElements(graphState, prevIds, prevEdgeIdsRef.current);

    prevNodeIdsRef.current = new Set(renderedIds);
    prevEdgeIdsRef.current = new Set(renderedEdgeIds);

    setNodes(mappedNodes);
    setEdges(mappedEdges);
  }, [graphState, setNodes, setEdges]);

  /**
   * Camera follows solver intent
   */
  useEffect(() => {
    const panTarget = nodes.find((n) => n.id === graphState.panTargetId);

    if (!panTarget) return;

    const parentNodes = graphState.edges
      .filter((e) => e.target === panTarget.id)
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter(isNode);

    const siblingNodes = parentNodes.length
      ? graphState.edges
          .filter((e) => parentNodes.some((p) => p.id === e.source))
          .filter((e) => e.target !== panTarget.id)
          .map((e) => nodes.find((n) => n.id === e.target))
          .filter(isNode)
      : [];

    const targets = [panTarget, ...parentNodes, ...siblingNodes].filter(isNode);

    if (targets.length) {
      requestAnimationFrame(() => followNodes(targets));
    }
  }, [
    graphState.panTick,
    graphState.panTargetId,
    graphState.edges,
    nodes,
    followNodes,
  ]);

  const handleDragStart = useCallback(() => {
    setFlowDragging(true);
  }, [setFlowDragging]);

  const handleDragEnd = useCallback(() => {
    setFlowDragging(false);
  }, [setFlowDragging]);

  useEffect(() => {
    return () => setFlowDragging(false);
  }, [setFlowDragging]);

  return (
    <div
      ref={containerRef}
      className={graphStageBackgroundClass}
      suppressHydrationWarning
    >
      <ThemedReactFlow
        className={reactFlowCanvasClass}
        defaultViewport={{ x: 0, y: 0, zoom: INITIAL_ZOOM }}
        minZoom={0.25}
        maxZoom={4}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        panOnDrag
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={handleDragStart}
        onNodeDragStop={handleDragEnd}
        defaultEdgeOptions={{
          type: "default",
          style: {
            stroke: reactFlowTheme.edge.stroke,
            strokeWidth: 1,
            strokeDasharray: "6 6",
          },
          markerEnd: {
            type: "arrowclosed",
            color: reactFlowTheme.edge.stroke,
            width: 10,
            height: 6,
          },
        }}
      >
        <Controls position="bottom-right" />
        <GraphBackground variant={BackgroundVariant.Cross} gap={32} size={1} />
      </ThemedReactFlow>
    </div>
  );
}

export default function GraphStage() {
  return (
    <ReactFlowProvider>
      <GraphStageInner />
    </ReactFlowProvider>
  );
}
