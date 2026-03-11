import { ReactFlow } from "@xyflow/react";
import { cx } from "../../../styled-system/css";
import { reactFlowCanvasClass, reactFlowVarsClass } from "./search-styles";

type Props = React.ComponentProps<typeof ReactFlow>;

export function ThemedReactFlow({ className, ...props }: Props) {
  return (
    <ReactFlow
      {...props}
      className={cx(reactFlowCanvasClass, reactFlowVarsClass, className)}
    />
  );
}
