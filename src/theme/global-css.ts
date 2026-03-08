import { reactFlowCssVars } from "./react-flow";

export const globalCss = {
  extend: {
    '*': {
      '--global-color-border': 'colors.border',
      '--global-color-placeholder': 'colors.fg.subtle',
      '--global-color-selection': 'colors.colorPalette.subtle.bg',
      '--global-color-focus-ring': 'colors.colorPalette.solid.bg',
    },
    html: {
      colorPalette: 'gray',
    },
    body: {
      background: "var(--colors-vercel-surface-overlay)",
      color: "var(--colors-vercel-text-primary)",
    },
    ".react-flow": reactFlowCssVars,
  },
}
