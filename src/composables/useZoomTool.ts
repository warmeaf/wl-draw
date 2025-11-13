/**
 * Composable for handling canvas zoom operations
 */

import { canvasConfig } from '@/config/canvas'
import { useCanvasStore } from '@/stores/canvas'

export function useZoomTool() {
  const store = useCanvasStore()

  function zoomIn(step = canvasConfig.zoom.step) {
    store.updateZoom(step)
  }

  function zoomOut(step = canvasConfig.zoom.step) {
    store.updateZoom(-step)
  }

  function resetZoom() {
    store.setZoom(canvasConfig.zoom.default)
  }

  return {
    zoomIn,
    zoomOut,
    resetZoom,
  }
}
