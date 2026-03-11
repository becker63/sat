export const reactFlowTheme = {
  canvas: {
    background: "var(--colors-vercel-surface-overlay)",
  },
  grid: {
    color: "var(--colors-vercel-surface-outline-muted)",
  },
  node: {
    background: "var(--colors-vercel-surface-overlay)",
    border: "1px solid var(--colors-vercel-surface-border)",
    color: "var(--colors-vercel-text-primary)",
    shadow: "var(--shadows-panel)",
  },
  edge: {
    stroke: "var(--colors-vercel-surface-outline)",
    selectedStroke: "var(--colors-vercel-brand-9)",
    hoverStroke: "var(--colors-vercel-surface-outline)",
  },
};

const imp = (value: string) => `${value} !important`;

export const reactFlowCssVars = {
  "--xy-edge-stroke-default": imp("var(--colors-vercel-surface-outline)"),
  "--xy-edge-stroke-width-default": "1.25",
  "--xy-edge-stroke-selected-default": imp("var(--colors-vercel-brand-9)"),
  "--xy-connectionline-stroke-default": imp(
    "var(--colors-vercel-surface-outline)",
  ),
  "--xy-connectionline-stroke-width-default": "1.25",
  "--xy-attribution-background-color-default": "transparent",
  "--xy-minimap-background-color-default": imp(
    "var(--colors-vercel-surface-overlay)",
  ),
  "--xy-background-pattern-dots-color-default": imp(
    "var(--colors-vercel-surface-outline-muted)",
  ),
  "--xy-background-pattern-line-color-default": imp(
    "var(--colors-vercel-graph-grid)",
  ),
  "--xy-background-pattern-cross-color-default": imp(
    "var(--colors-vercel-graph-grid)",
  ),
  "--xy-node-color-default": imp("var(--colors-vercel-text-primary)"),
  "--xy-node-border-default": imp(
    "1px solid var(--colors-vercel-surface-border)",
  ),
  "--xy-node-background-color-default": imp(
    "var(--colors-vercel-surface-overlay)",
  ),
  "--xy-node-group-background-color-default": imp(
    "var(--colors-vercel-surface-muted)",
  ),
  "--xy-node-boxshadow-hover-default": imp("var(--shadows-panel)"),
  "--xy-node-boxshadow-selected-default": imp("var(--shadows-glow)"),
  "--xy-handle-background-color-default": imp("var(--colors-vercel-brand-9)"),
  "--xy-handle-border-color-default": imp(
    "var(--colors-vercel-surface-overlay)",
  ),
  "--xy-selection-background-color-default": imp(
    "var(--colors-vercel-surface-highlight)",
  ),
  "--xy-selection-border-default": imp(
    "1px solid var(--colors-vercel-brand-9)",
  ),
  "--xy-controls-button-background-color-default": imp(
    "var(--colors-vercel-surface-overlay)",
  ),
  "--xy-controls-button-background-color-hover-default": imp(
    "var(--colors-vercel-surface-muted)",
  ),
  "--xy-controls-button-color-default": imp(
    "var(--colors-vercel-text-primary)",
  ),
  "--xy-controls-button-color-hover-default": imp(
    "var(--colors-vercel-text-primary)",
  ),
  "--xy-controls-button-border-color-default": imp(
    "var(--colors-vercel-surface-border)",
  ),
  "--xy-controls-box-shadow-default": imp("var(--shadows-panel)"),
  "--xy-resize-background-color-default": imp("var(--colors-vercel-brand-9)"),
};

export const reactFlowNodeStyle = {
  background: reactFlowTheme.node.background,
  border: reactFlowTheme.node.border,
  color: reactFlowTheme.node.color,
  boxShadow: reactFlowTheme.node.shadow,
  borderRadius: "var(--radii-l3)",
  padding: 12,
};

export const reactFlowCanvasStyle = {
  background: reactFlowTheme.canvas.background,
};
