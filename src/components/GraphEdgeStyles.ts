/* eslint-disable style-firewall/no-styling-outside-ui, style-firewall/no-surface-props-outside-recipes */
import { cva, css } from "../../styled-system/css";
import { reactFlowTheme } from "@/theme/react-flow";

export const graphEdgeClass = cva({
  base: {
    stroke: reactFlowTheme.edge.stroke,
    strokeWidth: "1.5px",
    strokeDasharray: "6 8",
    strokeLinecap: "round",
    fill: "none",
    opacity: 0.86,
    transition:
      "stroke-width 0.16s ease, opacity 0.2s ease, stroke 0.2s ease",
    "&:hover": {
      strokeWidth: "2px",
      stroke: reactFlowTheme.edge.hoverStroke,
      opacity: 1,
    },
  },
  variants: {
    emphasis: {
      primary: { strokeWidth: "1.9px", opacity: 0.95 },
      secondary: { opacity: 0.6, strokeWidth: "1.4px" },
    },
  },
  defaultVariants: {
    emphasis: "primary",
  },
});

export const graphEdgeLabelClass = css({
  position: "absolute",
  fontSize: "11px",
  color: reactFlowTheme.edge.stroke,
  pointerEvents: "none",
  background: "transparent",
});
