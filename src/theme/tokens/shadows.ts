import { defineSemanticTokens } from '@pandacss/dev'

export const shadows = defineSemanticTokens.shadows({
  xs: {
    value: {
      _light: '0px 1px 2px {colors.gray.a6}, 0px 0px 1px {colors.gray.a7}',
      _dark: '0px 1px 1px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  sm: {
    value: {
      _light: '0px 2px 4px {colors.gray.a4}, 0px 0px 1px {colors.gray.a4}',
      _dark: '0px 2px 4px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  md: {
    value: {
      _light: '0px 4px 8px {colors.gray.a4}, 0px 0px 1px {colors.gray.a4}',
      _dark: '0px 4px 8px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  lg: {
    value: {
      _light: '0px 8px 16px {colors.gray.a4}, 0px 0px 1px {colors.gray.a4}',
      _dark: '0px 8px 16px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  xl: {
    value: {
      _light: '0px 16px 24px {colors.gray.a4}, 0px 0px 1px {colors.gray.a4}',
      _dark: '0px 16px 24px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  '2xl': {
    value: {
      _light: '0px 24px 40px {colors.gray.a4}, 0px 0px 1px {colors.gray.a4}',
      _dark: '0px 24px 40px {colors.black.a8}, 0px 0px 1px inset {colors.gray.a8}',
    },
  },
  panel: {
    value: {
      _light: '0px 24px 80px rgba(0, 0, 0, 0.28), 0px 0px 1px rgba(0, 0, 0, 0.16)',
      _dark: '0px 24px 80px rgba(0, 0, 0, 0.45), 0px 0px 1px rgba(0, 0, 0, 0.26)',
    },
  },
  glow: {
    value: {
      _light: '0 0 0 1px {colors.vercel.surface.border}, 0 12px 60px rgba(0, 0, 0, 0.22)',
      _dark: '0 0 0 1px {colors.vercel.surface.border}, 0 16px 70px rgba(0, 0, 0, 0.4)',
    },
  },
  inset: {
    value: {
      _light: 'inset 8px 0 12px -8px {colors.gray.a4}',
      _dark: 'inset 8px 0 12px -8px {colors.black.a6}',
    },
  },
})
