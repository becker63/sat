import {
  Handle,
  Position,
  type NodeProps,
  type Node as FlowNode,
} from "@xyflow/react";
import { css, cva, cx } from "../../../styled-system/css";
import type { GraphNode } from "@/graph/events";
import { reactFlowTheme } from "@/theme/react-flow";
import { NODE_HEIGHT, NODE_WIDTH } from "@/graph/layoutGraph";

export type GraphNodeData = Pick<
  GraphNode,
  "label" | "state" | "kind" | "tokens"
>;

const graphNodeClass = cva({
  base: {
    width: `${NODE_WIDTH}px`,
    height: `${NODE_HEIGHT}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radii-l3)",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "0.01em",
    transition: "all 0.25s ease",
    boxShadow: "var(--shadows-panel)",
    border: "1px solid var(--colors-vercel-surface-border)",
    background: reactFlowTheme.node.background,
    color: reactFlowTheme.node.color,
    textAlign: "center",
    padding: "10px",
    gap: "8px",
    userSelect: "none",
  },

  variants: {
    state: {
      anchor: {
        background: "var(--colors-vercel-brand-9)",
        borderColor: "var(--colors-vercel-brand-8)",
        color: "var(--colors-vercel-surface-overlay)",
        boxShadow: "var(--shadows-glow)",
      },

      pending: {
        borderStyle: "dashed",
        borderColor: "var(--colors-vercel-surface-outline)",
        background: "transparent",
        color: "var(--colors-vercel-text-muted)",
        opacity: 0.85,
      },

      resolved: {
        background:
          "linear-gradient(135deg, var(--colors-vercel-brand-9), var(--colors-green-10))",
        borderColor: "transparent",
        color: "var(--colors-vercel-surface-overlay)",
        boxShadow: "var(--shadows-glow)",
      },
    },

    kind: {
      symbol: {},
      function: {},
      file: {
        fontStyle: "italic",
      },
      type: {
        borderWidth: "2px",
      },
    },
  },
});

const ghostClass = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "var(--radii-l3)",
    background: "var(--colors-vercel-surface-muted)",
    color: "var(--colors-vercel-text-subtle)",
    fontSize: "16px",
    border: "1px solid var(--colors-vercel-surface-border)",
  },
});

const handleClass = css({
  background: "transparent",
  border: "none",
});

export function GraphNode({ id, data, selected }: NodeProps) {
  const nodeData = data as GraphNodeData;

  return (
    <div
      className={cx(
        graphNodeClass({ state: nodeData.state, kind: nodeData.kind }),
        selected && "is-selected",
      )}
      data-testid="graph-node"
      data-node-id={id}
      data-state={nodeData.state}
      data-kind={nodeData.kind}
    >
      {nodeData.state === "pending" ? (
        <span className={ghostClass()}>👻</span>
      ) : (
        nodeData.label
      )}

      <Handle type="target" position={Position.Top} className={handleClass} />
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleClass}
      />
    </div>
  );
}

export type GraphFlowNode = FlowNode<GraphNodeData>;
