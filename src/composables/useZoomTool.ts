/**
 * Composable for handling canvas zoom operations
 */

import { useCanvasStore } from '@/stores/canvas'

export function useZoomTool() {
  const store = useCanvasStore()

  function zoomIn(step = 0.1) {
    store.updateZoom(step)
  }

  function zoomOut(step = 0.1) {
    store.updateZoom(-step)
  }

  function resetZoom() {
    store.setZoom(1)
  }

  return {
    zoomIn,
    zoomOut,
    resetZoom,
  }
}
