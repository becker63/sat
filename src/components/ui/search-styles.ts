import { css, cx } from "../../../styled-system/css";
import { reactFlowCssVars } from "@/theme/react-flow";
import type { SystemStyleObject } from "../../../styled-system/types";

export const searchBarShellClass = css({
  layerStyle: "panel",
  background: "var(--colors-vercel-surface-overlay)",
  border: "1px solid var(--colors-vercel-surface-border)",
  boxShadow: "var(--shadows-panel)",
  backdropFilter: "blur(14px)",
  borderRadius: "var(--radii-l3)",
  display: "flex",
  alignItems: "center",
  gap: "3",
  width: "100%",
  height: "72px",
  boxSizing: "border-box",
  position: "relative",
  px: "7",
  py: "3",
  overflow: "visible",
});

export const tokenPaneClass = css({
  layerStyle: "panel",
  position: "absolute",
  bottom: "20px",
  left: "20px",
  px: "14px",
  py: "10px",
  borderRadius: "var(--radii-l3)",
  fontSize: "13px",
  backdropFilter: "blur(8px)",
  border: "1px solid var(--colors-vercel-surface-border)",
  background: "var(--colors-vercel-surface)",
  color: "var(--colors-vercel-text-subtle)",
  zIndex: 9,
  pointerEvents: "none",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

export const searchBarHiddenClass = css({
  pointerEvents: "auto",
  visibility: "hidden",
});

export const tokenPaneHeaderClass = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  fontWeight: 600,
  color: "var(--colors-vercel-text-primary)",
});

export const tokenCountBadgeClass = css({
  borderRadius: "var(--radii-l2)",
  padding: "4px 8px",
  border: "1px solid var(--colors-vercel-surface-border)",
  fontVariantNumeric: "tabular-nums",
});

export const tokenPaneMetaRowClass = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  fontSize: "12px",
  color: "var(--colors-vercel-text-muted)",
});

export const tokenPaneProgressClass = css({
  position: "relative",
  width: "100%",
  height: "6px",
  borderRadius: "var(--radii-l4)",
  overflow: "hidden",
  background: "var(--colors-vercel-surface-muted)",
});

export const tokenPaneProgressFillClass = css({
  position: "absolute",
  inset: 0,
  background: "linear-gradient(90deg, var(--colors-vercel-brand-9), var(--colors-vercel-brand-7))",
  transformOrigin: "left",
});

export const graphStageBackgroundClass = css({
  position: "absolute",
  inset: 0,
  zIndex: 0,
  background:
    "var(--colors-vercel-surface-overlay, var(--colors-vercel-canvas))",
});

export const reactFlowCanvasClass = css({
  background:
    "var(--colors-vercel-canvas, var(--colors-vercel-surface-overlay))",
});

const reactFlowVarsWithImportant = Object.fromEntries(
  Object.entries(reactFlowCssVars).map(([key, value]) => [
    key,
    `${value} !important`,
  ]),
) as Record<string, string>;

export const reactFlowVarsClass = css({
  "&.react-flow": reactFlowVarsWithImportant as unknown as SystemStyleObject,
});

export const reactFlowHandleColorsClass = css({
  "& .react-flow__handle.source": {
    "--xy-handle-background-color": "var(--colors-vercel-brand-9)",
    "--xy-handle-border-color": "var(--colors-vercel-surface-overlay)",
  },
  "& .react-flow__handle.target": {
    "--xy-handle-background-color": "var(--colors-green-plain-fg, #22c55e)",
    "--xy-handle-border-color": "var(--colors-vercel-surface-overlay)",
  },
});

export const searchBarSvgClass = css({
  position: "absolute",
  pointerEvents: "auto",
  overflow: "visible",
  zIndex: 0,
});

export const outlineHoverClass = css({
  filter: "drop-shadow(0 0 6px var(--colors-vercel-surface-highlight))",
});

export const searchInputClass = css({
  flex: "1 1 0",
  minWidth: 0,
  height: "48px",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--colors-vercel-text-primary)",
  fontSize: "16px",
  zIndex: 1,
});

export const searchButtonClass = css({
  flex: "0 0 auto",
  height: "48px",
  px: "6",
  borderRadius: "var(--radii-l2)",
  zIndex: 1,
});

export const menuContainerClass = css({
  layerStyle: "panel",
  background: "var(--colors-vercel-surface-overlay)",
  border: "1px solid var(--colors-vercel-surface-border)",
  boxShadow: "var(--shadows-panel)",
  backdropFilter: "blur(14px)",
  borderRadius: "var(--radii-l3)",
  position: "absolute",
  minHeight: "200px",
  minWidth: "380px",
  overflow: "hidden",
});

export const menuHeaderClass = css({
  width: "100%",
  paddingBottom: "10px",
  marginBottom: "4px",
  borderBottom: "1px solid var(--colors-vercel-surface-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "13px",
  letterSpacing: "0.02em",
  fontWeight: 600,
});

export const menuItemClass = css({
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 6px",
  borderRadius: "var(--radii-l2)",
  cursor: "pointer",
  transition: "background 0.12s ease",
  "&:hover": {
    background: "var(--colors-vercel-surface-muted)",
  },
});

export const menuControlClass = css({
  width: "16px",
  height: "16px",
  borderRadius: "var(--radii-l1)",
  border: "1px solid var(--colors-vercel-surface-borderStrong)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.12s ease-out",
  "&[data-state=checked]": {
    backgroundColor: "var(--colors-vercel-brand-9)",
    borderColor: "var(--colors-vercel-brand-9)",
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "var(--shadows-glow)",
  },
});

export const menuIndicatorClass = css({
  color: "var(--colors-vercel-text-primary)",
  fontSize: "12px",
});

export const menuLabelClass = css({
  fontSize: "14px",
  color: "var(--colors-vercel-text-muted)",
  lineHeight: "1.5",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
});

export const searchSurfaceClassName = cx(searchBarShellClass);

export const menuSubLabelClass = css({
  fontSize: "12px",
  color: "var(--colors-vercel-text-subtle)",
  letterSpacing: "0.04em",
  paddingLeft: "6px",
});
