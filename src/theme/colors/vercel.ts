import { defineSemanticTokens } from '@pandacss/dev'

export const vercel = defineSemanticTokens.colors({
  brand: {
    9: { value: { _light: '#3291ff', _dark: '#3291ff' } },
    10: { value: { _light: '#4d9dff', _dark: '#4d9dff' } },
    glow: { value: { _light: 'rgba(50, 145, 255, 0.28)', _dark: 'rgba(50, 145, 255, 0.28)' } },
  },
  text: {
    primary: { value: { _light: '#eaeaea', _dark: '#eaeaea' } },
    muted: { value: { _light: '#b4bbc7', _dark: '#b4bbc7' } },
    subtle: { value: { _light: '#8b92a3', _dark: '#8b92a3' } },
  },
  surface: {
    overlay: { value: { _light: 'rgba(12, 12, 12, 0.9)', _dark: 'rgba(12, 12, 12, 0.9)' } },
    raised: { value: { _light: 'rgba(18, 18, 18, 0.92)', _dark: 'rgba(18, 18, 18, 0.92)' } },
    muted: { value: { _light: 'rgba(255, 255, 255, 0.04)', _dark: 'rgba(255, 255, 255, 0.04)' } },
    border: { value: { _light: 'rgba(255, 255, 255, 0.08)', _dark: 'rgba(255, 255, 255, 0.08)' } },
    borderStrong: { value: { _light: 'rgba(255, 255, 255, 0.14)', _dark: 'rgba(255, 255, 255, 0.14)' } },
    outline: { value: { _light: 'rgba(255, 255, 255, 0.28)', _dark: 'rgba(255, 255, 255, 0.28)' } },
    outlineMuted: { value: { _light: 'rgba(255, 255, 255, 0.2)', _dark: 'rgba(255, 255, 255, 0.2)' } },
    highlight: { value: { _light: 'rgba(50, 145, 255, 0.2)', _dark: 'rgba(50, 145, 255, 0.2)' } },
  },
  graph: {
    grid: { value: { _light: '#2f2f2f', _dark: '#2f2f2f' } },
  },
})
