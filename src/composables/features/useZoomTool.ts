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

  function handleZoomKeyboardEvent(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    const isInputFocused =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

    if (isInputFocused) {
      return
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.code === 'Equal' ||
        e.code === 'Minus' ||
        e.code === 'NumpadAdd' ||
        e.code === 'NumpadSubtract')
    ) {
      e.preventDefault()
    }
  }

  function setupZoomKeyboardPrevention() {
    document.addEventListener('keydown', handleZoomKeyboardEvent, true)
    return () => {
      document.removeEventListener('keydown', handleZoomKeyboardEvent, true)
    }
  }

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    setupZoomKeyboardPrevention,
  }
}
