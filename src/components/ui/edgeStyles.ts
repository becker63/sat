import { css } from "../../../styled-system/css";
import { reactFlowTheme } from "@/theme/react-flow";

export const graphEdgeClass = css({
  stroke: reactFlowTheme.edge.stroke,
  strokeWidth: "1.5px",
  strokeDasharray: "6 8",
  strokeLinecap: "round",
  fill: "none",
});

export const graphEdgeLabelClass = css({
  position: "absolute",
  fontSize: "11px",
  color: reactFlowTheme.edge.stroke,
  pointerEvents: "none",
  background: "transparent",
});
