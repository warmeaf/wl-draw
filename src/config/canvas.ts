/**
 * Canvas configuration constants for zoom, wheel, and other canvas settings
 */

export const canvasConfig = {
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
