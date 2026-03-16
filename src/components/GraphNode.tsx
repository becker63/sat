/* eslint-disable style-firewall/no-styling-outside-ui, style-firewall/no-surface-props-outside-recipes */
import { useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
  type NodeProps,
  type Node as FlowNode,
} from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { Ghost } from "lucide-react";
import { css, cva, cx } from "../../styled-system/css";
import type { GraphNode } from "@/graph/events";
import { reactFlowTheme } from "@/theme/react-flow";
import { NODE_HEIGHT, NODE_WIDTH } from "@/graph/layoutGraph";

export type GraphNodeData = {
  label?: GraphNode["label"];
  state: GraphNode["state"];
  kind: GraphNode["kind"];
  tokens?: number;
  inContext?: boolean;
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
    transition:
      "transform 0.18s ease, box-shadow 0.24s ease, border-color 0.24s ease, background 0.24s ease, opacity 0.24s ease",
    boxShadow: "var(--shadows-panel)",
    border: "1px solid var(--colors-vercel-surface-border)",
    background: reactFlowTheme.node.background,
    color: reactFlowTheme.node.color,
    padding: "12px",
    gap: "8px",
    userSelect: "none",
    position: "relative",
    overflow: "hidden",
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

const contextGlowClass = css({
  boxShadow: "var(--shadows-glow)",
  borderColor: "var(--colors-vercel-brand-9)",
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
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: "8px",
  position: "relative",
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

const ghostShellClass = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  paddingInline: "8px",
  paddingBlock: "6px",
  width: "100%",
  border: "1px dashed var(--colors-vercel-surface-border)",
  borderRadius: "var(--radii-l2)",
  background: "var(--colors-vercel-surface-muted)",
  color: "var(--colors-vercel-text-muted)",
  letterSpacing: "0.01em",
});

const ghostIconClass = css({
  width: "18px",
  height: "18px",
});

const ghostLabelClass = css({
  fontSize: "12px",
  textTransform: "uppercase",
});

const resolvedContentClass = css({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export function GraphNode({ id, data, selected }: NodeProps) {
  const nodeData = data as GraphNodeData;
  const snippet = nodeData.evidence?.snippet;
  const fileLabel =
    nodeData.state === "resolved" ? nodeData.evidence?.file : undefined;
  const kindLabel = nodeData.kind;
  const [contextGlow, setContextGlow] = useState(false);
  const prevStateRef = useRef(nodeData.state);
  const prevContextRef = useRef(Boolean(nodeData.inContext));
  const resolvingNow =
    nodeData.state === "resolved" && prevStateRef.current === "pending";

  useEffect(() => {
    prevStateRef.current = nodeData.state;
  }, [nodeData.state]);

  useEffect(() => {
    let timer: number | null = null;
    const wasInContext = prevContextRef.current;
    if (nodeData.inContext && !wasInContext) {
      setContextGlow(true);
      timer = window.setTimeout(() => setContextGlow(false), 820);
      prevContextRef.current = true;
    } else {
      prevContextRef.current = Boolean(nodeData.inContext);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [nodeData.inContext]);

  return (
    <motion.div
      className={cx(
        graphNodeClass({ state: nodeData.state, kind: nodeData.kind }),
        contextGlow && contextGlowClass,
        selected && "is-selected",
      )}
      data-testid="graph-node"
      data-node-id={id}
      data-state={nodeData.state}
      data-kind={nodeData.kind}
      whileHover={{ scale: 1.03 }}
      initial={resolvingNow ? { scale: 0.95 } : false}
      animate={{ scale: 1 }}
      transition={
        resolvingNow
          ? { type: "spring", stiffness: 240, damping: 22 }
          : { duration: 0.12, ease: "easeOut" }
      }
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
        <AnimatePresence mode="wait" initial={false}>
          {nodeData.state === "pending" ? (
            <motion.div
              key="ghost"
              className={ghostShellClass}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 0.9,
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <motion.span
                className={ghostIconClass}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 1.6,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              >
                <Ghost size={18} />
              </motion.span>
              <span className={ghostLabelClass}>Pending</span>
            </motion.div>
          ) : nodeData.state === "pruned" ? (
            <motion.span
              key="pruned"
              className={ghostShellClass}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 0.7, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              ×
            </motion.span>
          ) : (
            <motion.div
              key="content"
              className={resolvedContentClass}
              initial={resolvingNow ? { opacity: 0, y: 6, scale: 0.98 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
              }}
            >
              {snippet}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Handle type="target" position={Position.Top} className={handleClass} />
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleClass}
      />
    </motion.div>
  );
}

export type GraphFlowNode = FlowNode<GraphNodeData>;
