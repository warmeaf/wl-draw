/**
 * Canvas configuration constants for zoom, wheel, and other canvas settings
 */

import { themeColors } from './theme'

export const canvasConfig = {
  theme: {
    fill: themeColors.primary,
    stroke: themeColors.primary,
    text: themeColors.text,
    background: themeColors.background,
    selectionBox: themeColors.secondary,
    controlPoint: themeColors.secondary,
    snapLineColor: themeColors.secondary,
  },
  zoom: {
    min: 0.02,
    max: 256,
    default: 1 as number,
    step: 0.1,
  },
  wheel: {
    zoomSpeed: 0.1,
  },
} as const

export type CanvasConfig = typeof canvasConfig
