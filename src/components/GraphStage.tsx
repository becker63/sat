"use client";

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import { useSetAtom } from "jotai";

import "@xyflow/react/dist/style.css";
import { flowDraggingAtom } from "@/state/searchbar";
import { reactFlowNodeStyle, reactFlowTheme } from "@/theme/react-flow";
import { GraphBackground, graphStageBackgroundClass, reactFlowCanvasClass } from "@/components/ui";

const nodeTypes = {};
const edgeTypes = {};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Anchor: useQuery" },
    style: reactFlowNodeStyle,
  },
  {
    id: "2",
    position: { x: 200, y: 120 },
    data: { label: "focusManager" },
    style: reactFlowNodeStyle,
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
];

export default function GraphStage() {
  const setFlowDragging = useSetAtom(flowDraggingAtom);

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
    <div className={graphStageBackgroundClass}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        onNodeDragStart={handleDragStart}
        onNodeDragStop={handleDragEnd}
        defaultEdgeOptions={{
          style: {
            stroke: reactFlowTheme.edge.stroke,
          },
          markerEnd: {
            type: "arrowclosed",
            color: reactFlowTheme.edge.stroke,
          },
        }}
        className={reactFlowCanvasClass}
      >
        <GraphBackground variant={BackgroundVariant.Cross} gap={32} size={1} />
      </ReactFlow>
    </div>
  );
}
