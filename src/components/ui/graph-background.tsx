import { Background, type BackgroundProps } from "@xyflow/react";
import { reactFlowTheme } from "@/theme/react-flow";

type Props = Omit<BackgroundProps, "color" | "bgColor">;

export function GraphBackground(props: Props) {
  return (
    <Background
      color={reactFlowTheme.grid.color}
      bgColor={reactFlowTheme.canvas.background}
      {...props}
    />
  );
}
