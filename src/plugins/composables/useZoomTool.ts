/**
 * Composable for handling canvas zoom operations
 */

import { canvasConfig } from '@/config/canvas'
import { useCanvasStore } from '@/stores/canvas'

export function useZoomTool(
  elementPopover?: ReturnType<
    typeof import('@/composables/state/useElementPopover').useElementPopover
  >
) {
  const store = useCanvasStore()

  function zoomIn(step = canvasConfig.zoom.step) {
    store.updateZoom(step)
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
  }

  function zoomOut(step = canvasConfig.zoom.step) {
    store.updateZoom(-step)
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
  }

  function resetZoom() {
    store.setZoom(canvasConfig.zoom.default)
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
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
