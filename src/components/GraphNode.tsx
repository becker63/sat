/* eslint-disable style-firewall/no-styling-outside-ui, style-firewall/no-surface-props-outside-recipes */
import {
  Handle,
  Position,
  type NodeProps,
  type Node as FlowNode,
} from "@xyflow/react";
import { css, cva, cx } from "../../styled-system/css";
import type { GraphNode } from "@/graph/events";
import { reactFlowTheme } from "@/theme/react-flow";
import { NODE_HEIGHT, NODE_WIDTH } from "@/graph/layoutGraph";

export type GraphNodeData = {
  label?: GraphNode["label"];
  state: GraphNode["state"];
  kind: GraphNode["kind"];
  tokens?: number;
  evidence?: {
    snippet: string;
    file?: string;
    startLine?: number;
  };
};

const graphNodeClass = cva({
  base: {
    width: `${NODE_WIDTH}px`,
    height: `${NODE_HEIGHT}px`,
    display: "grid",
    gridTemplateRows: "auto auto 1fr",
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
    padding: "12px",
    gap: "8px",
    userSelect: "none",
  },

    variants: {
    state: {
    anchor: {
      borderColor: "var(--colors-vercel-brand-9)",
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
      borderColor: "var(--colors-green-9)",
      boxShadow: "var(--shadows-glow)",
    },

    pruned: {
      borderStyle: "dashed",
      borderColor: "var(--colors-vercel-surface-outline)",
      background: "var(--colors-vercel-surface-50)",
      color: "var(--colors-vercel-text-muted)",
      opacity: 0.45,
      boxShadow: "none",
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
    width: "28px",
    height: "28px",
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

const headerClass = css({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  justifyContent: "space-between",
});

const labelClass = css({
  fontSize: "15px",
  fontWeight: 700,
  color: "var(--colors-vercel-text-strong)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const metaClass = css({
  fontSize: "12px",
  color: "var(--colors-vercel-text-subtle)",
  display: "flex",
  flexDirection: "column",
  gap: "2px",
});

const snippetClass = css({
  fontFamily: "var(--fonts-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: "12px",
  lineHeight: 1.4,
  background: "var(--colors-vercel-surface-50)",
  border: "1px solid var(--colors-vercel-surface-border)",
  borderRadius: "var(--radii-l2)",
  padding: "8px",
  whiteSpace: "pre-wrap",
  overflowY: "hidden",
  display: "block",
  minHeight: "5em",
  maxHeight: "7.5em",
});

const tokenBadgeClass = css({
  fontSize: "11px",
  color: "var(--colors-vercel-text-muted)",
  border: "1px solid var(--colors-vercel-surface-border)",
  borderRadius: "var(--radii-l3)",
  padding: "2px 8px",
});

export function GraphNode({ id, data, selected }: NodeProps) {
  const nodeData = data as GraphNodeData;
  const snippet = nodeData.evidence?.snippet;
  const fileLabel =
    nodeData.state === "resolved" ? nodeData.evidence?.file : undefined;
  const kindLabel = nodeData.kind;

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
      <div className={headerClass}>
        <div
          className={cx(
            labelClass,
            nodeData.state === "pruned" &&
              css({ textDecoration: "line-through" }),
          )}
        >
          {nodeData.label ?? id}
        </div>
        <div className={tokenBadgeClass}>
          {nodeData.tokens ? `${nodeData.tokens}t` : kindLabel}
        </div>
      </div>

      <div className={metaClass}>
        <span>{kindLabel}</span>
        {fileLabel && <span>{fileLabel}</span>}
      </div>

      <div className={snippetClass}>
        {nodeData.state === "pending" ? (
          <span className={ghostClass()}>?</span>
        ) : nodeData.state === "pruned" ? (
          <span className={ghostClass()}>×</span>
        ) : (
          snippet
        )}
      </div>

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
