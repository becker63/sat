export const reactFlowTheme = {
  canvas: {
    background: "{colors.vercel.surface.overlay}",
  },
  grid: {
    color: "{colors.vercel.surface.outlineMuted}",
  },
  node: {
    background: "{colors.vercel.surface.overlay}",
    border: "1px solid {colors.vercel.surface.border}",
    color: "{colors.vercel.text.primary}",
    shadow: "{shadows.panel}",
  },
  edge: {
    stroke: "{colors.vercel.surface.outlineMuted}",
    selectedStroke: "{colors.vercel.brand.9}",
    hoverStroke: "{colors.vercel.surface.outline}",
  },
};

export const reactFlowCssVars = {
  "--xy-edge-stroke-default": "var(--colors-vercel-surface-outlineMuted)",
  "--xy-edge-stroke-width-default": "1.25",
  "--xy-edge-stroke-selected-default": "var(--colors-vercel-brand-9)",
  "--xy-connectionline-stroke-default": "var(--colors-vercel-surface-outline)",
  "--xy-connectionline-stroke-width-default": "1.25",
  "--xy-attribution-background-color-default": "transparent",
  "--xy-minimap-background-color-default": "var(--colors-vercel-surface-overlay)",
  "--xy-background-pattern-dots-color-default": "var(--colors-vercel-surface-outlineMuted)",
  "--xy-background-pattern-line-color-default": "var(--colors-vercel-graph-grid)",
  "--xy-background-pattern-cross-color-default": "var(--colors-vercel-graph-grid)",
  "--xy-node-color-default": "var(--colors-vercel-text-primary)",
  "--xy-node-border-default": "1px solid var(--colors-vercel-surface-border)",
  "--xy-node-background-color-default": "var(--colors-vercel-surface-overlay)",
  "--xy-node-group-background-color-default": "var(--colors-vercel-surface-muted)",
  "--xy-node-boxshadow-hover-default": "var(--shadows-panel)",
  "--xy-node-boxshadow-selected-default": "var(--shadows-glow)",
  "--xy-handle-background-color-default": "var(--colors-vercel-brand-9)",
  "--xy-handle-border-color-default": "var(--colors-vercel-surface-overlay)",
  "--xy-selection-background-color-default": "var(--colors-vercel-surface-highlight)",
  "--xy-selection-border-default": "1px solid var(--colors-vercel-brand-9)",
  "--xy-controls-button-background-color-default": "var(--colors-vercel-surface-overlay)",
  "--xy-controls-button-background-color-hover-default": "var(--colors-vercel-surface-muted)",
  "--xy-controls-button-color-default": "var(--colors-vercel-text-primary)",
  "--xy-controls-button-color-hover-default": "var(--colors-vercel-text-primary)",
  "--xy-controls-button-border-color-default": "var(--colors-vercel-surface-border)",
  "--xy-controls-box-shadow-default": "var(--shadows-panel)",
  "--xy-resize-background-color-default": "var(--colors-vercel-brand-9)",
};

export const reactFlowNodeStyle = {
  background: reactFlowTheme.node.background,
  border: reactFlowTheme.node.border,
  color: reactFlowTheme.node.color,
  boxShadow: reactFlowTheme.node.shadow,
  borderRadius: "{radii.l3}",
  padding: 12,
};

export const reactFlowCanvasStyle = {
  background: reactFlowTheme.canvas.background,
};
