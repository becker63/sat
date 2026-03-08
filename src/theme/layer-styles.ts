import { defineLayerStyles } from "@pandacss/dev";

export const layerStyles = defineLayerStyles({
  panel: {
    value: {
      background: "{colors.vercel.surface.overlay}",
      borderWidth: "1px",
      borderColor: "{colors.vercel.surface.border}",
      borderRadius: "{radii.l3}",
      boxShadow: "{shadows.panel}",
      backdropFilter: "blur(14px)",
    },
  },
  disabled: {
    value: {
      cursor: "not-allowed",
      opacity: "0.67",
      filter: "grayscale(100%)",
    },
  },
});
