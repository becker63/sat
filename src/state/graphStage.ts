import { atom } from "jotai";
import type { Edge, Node } from "@xyflow/react";

import { reactFlowNodeStyle } from "@/theme/react-flow";

const baseNodes: Node[] = [
  {
    id: "1",
    type: "input",
    position: { x: 0, y: 0 },
    data: { label: "input" },
    style: reactFlowNodeStyle,
  },
  { id: "2", position: { x: 0, y: 100 }, data: { label: "node 2" }, style: reactFlowNodeStyle },
  { id: "2a", position: { x: 0, y: 200 }, data: { label: "node 2a" }, style: reactFlowNodeStyle },
  { id: "2b", position: { x: 0, y: 300 }, data: { label: "node 2b" }, style: reactFlowNodeStyle },
  { id: "2c", position: { x: 0, y: 400 }, data: { label: "node 2c" }, style: reactFlowNodeStyle },
  { id: "2d", position: { x: 0, y: 500 }, data: { label: "node 2d" }, style: reactFlowNodeStyle },
  { id: "3", position: { x: 200, y: 100 }, data: { label: "node 3" }, style: reactFlowNodeStyle },
  { id: "4", position: { x: 220, y: 350 }, data: { label: "node 4" }, style: reactFlowNodeStyle },
];

const baseEdges: Edge[] = [
  { id: "e12", source: "1", target: "2", animated: true },
  { id: "e13", source: "1", target: "3", animated: true },
  { id: "e22a", source: "2", target: "2a", animated: true },
  { id: "e22b", source: "2", target: "2b", animated: true },
  { id: "e22c", source: "2", target: "2c", animated: true },
  { id: "e2c2d", source: "2c", target: "2d", animated: true },
];

export const graphInitialNodesAtom = atom(() =>
  baseNodes.map((node) => ({
    ...node,
    data: { ...node.data },
    position: { ...node.position },
    style: { ...node.style },
  })),
);

export const graphInitialEdgesAtom = atom(() =>
  baseEdges.map((edge) => ({
    ...edge,
  })),
);
