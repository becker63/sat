"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
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
import { layoutGraph } from "./layoutGraph";

import { useFollowNode } from "./useFollowNode";

import "@xyflow/react/dist/style.css";

import { graphStateAtom } from "@/state/graphStreamAtom";

const nodeTypes = {};
const edgeTypes = {};
const INITIAL_ZOOM = 1.5;

function GraphStageInner() {
  const rf = useReactFlow();

  const containerRef = useRef<HTMLDivElement>(null);

  const followNode = useFollowNode(containerRef, INITIAL_ZOOM);

  const initialNodes = useAtomValue(graphInitialNodesAtom);
  const initialEdges = useAtomValue(graphInitialEdgesAtom);

  const graphState = useAtomValue(graphStateAtom);

  const setFlowDragging = useSetAtom(flowDraggingAtom);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);

  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  /**
   * Rebuild graph whenever stream updates
   */
  useEffect(() => {
    let cancelled = false;

    async function runLayout() {
      const ids = Object.keys(graphState.nodes);

      const prevIds = prevNodeIdsRef.current;
      const addedId = ids.find((id) => !prevIds.has(id));

      prevNodeIdsRef.current = new Set(ids);

      const baseNodes: Node[] = ids.map((id) => {
        const n = graphState.nodes[id];

        return {
          id: n.id,
          data: { label: n.label ?? n.id },
          position: { x: 0, y: 0 },
          style: {
            transition: "transform 0.45s cubic-bezier(.22,1,.36,1)",
          },
        };
      });

      const baseEdges: Edge[] = graphState.edges.map((e, index) => ({
        id: `${e.source}-${e.target}-${index}`,
        source: e.source,
        target: e.target,
        animated: true,
        label: e.kind,
        data: { kind: e.kind },
      }));

      const layoutedNodes = await layoutGraph(baseNodes, baseEdges);

      if (cancelled) return;

      setNodes(layoutedNodes);
      setEdges(baseEdges);

      const lowestNode = layoutedNodes.reduce((best, n) => {
        if (!best) return n;
        return n.position.y > best.position.y ? n : best;
      }, layoutedNodes[0]);

      if (lowestNode) {
        requestAnimationFrame(() => {
          followNode(lowestNode);
        });
      }
    }

    runLayout();

    return () => {
      cancelled = true;
    };
  }, [graphState, rf, setNodes, setEdges, followNode]);

  /**
   * Drag state (used by SearchBar system)
   */
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
        /* restore zoom */
        minZoom={0.25}
        maxZoom={4}
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        /* restore canvas panning */
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
