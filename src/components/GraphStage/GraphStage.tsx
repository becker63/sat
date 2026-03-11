"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  BackgroundVariant,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

import { GraphBackground, ThemedReactFlow, graphStageBackgroundClass } from "@/components/ui";
import { flowDraggingAtom } from "@/state/searchbar";
import { graphInitialEdgesAtom, graphInitialNodesAtom } from "@/state/graphStage";
import { reactFlowTheme } from "@/theme/react-flow";

import { createSimulation } from "./config";
import { useForceLayout } from "./useForceLayout";
import type { SimNode } from "./types";

import "@xyflow/react/dist/style.css";

const nodeTypes = {};
const edgeTypes = {};
const simulation = createSimulation();

function GraphStageInner() {
  const initialNodes = useAtomValue(graphInitialNodesAtom);
  const initialEdges = useAtomValue(graphInitialEdgesAtom);
  const setFlowDragging = useSetAtom(flowDraggingAtom);
  const draggingNodeRef = useRef<SimNode | null>(null);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const dragEvents = useForceLayout(simulation, draggingNodeRef);

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
    <div className={graphStageBackgroundClass} suppressHydrationWarning>
      <ThemedReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={(event, node) => {
          dragEvents.start(event, node);
          handleDragStart();
        }}
        onNodeDrag={(event, node) => {
          dragEvents.drag(event, node);
        }}
        onNodeDragStop={(event, node) => {
          dragEvents.stop();
          handleDragEnd();
        }}
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
