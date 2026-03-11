import type { Node } from "@xyflow/react";

export type SimNode = Node & {
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  vx?: number;
  vy?: number;
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
};

export type DragEvents = {
  start: (event: any, node: Node) => void;
  drag: (event: any, node: Node) => void;
  stop: () => void;
};
