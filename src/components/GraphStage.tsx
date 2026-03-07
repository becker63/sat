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

const nodeTypes = {};
const edgeTypes = {};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "Anchor: useQuery" },
  },
  {
    id: "2",
    position: { x: 200, y: 120 },
    data: { label: "focusManager" },
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
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        onMoveStart={handleDragStart}
        onMoveEnd={handleDragEnd}
        onNodeDragStart={handleDragStart}
        onNodeDragStop={handleDragEnd}
      >
        <Background
          variant={BackgroundVariant.Cross}
          gap={32}
          size={1}
          color="#3a3a3a"
        />
      </ReactFlow>
    </div>
  );
}
