/**
 * Canvas tools composable for handling drawing tools and mouse interactions
 * Main entry point that composes all tool-related composables
 */

import type { App } from 'leafer-ui'
import { onBeforeUnmount } from 'vue'
import { useCanvasEvents } from '@/composables/events/useCanvasEvents'
import { useKeyboardShortcuts } from '@/composables/events/useKeyboardShortcuts'
import { useDrawingState } from '@/composables/state/useDrawingState'
import { useCanvasMode } from '@/composables/tool/useCanvasMode'
import { useToolInstance } from '@/composables/tool/useToolInstance'
import { useToolSwitch } from '@/composables/tool/useToolSwitch'

export function useCanvasTools(
  app: App,
  elementPopover?: ReturnType<typeof import('./state/useElementPopover').useElementPopover>,
  canvasContainer?: HTMLElement | null
) {
  const drawingState = useDrawingState()
  const canvasMode = useCanvasMode(app)
  const toolInstance = useToolInstance(app, drawingState)

  useToolSwitch(toolInstance.getToolInstance, canvasMode, drawingState, elementPopover)

  const canvasEvents = useCanvasEvents(
    app,
    drawingState,
    toolInstance.getToolInstance,
    elementPopover,
    canvasContainer
  )
  const keyboardShortcuts = useKeyboardShortcuts(
    app,
    toolInstance.createToolInstanceForPlugin,
    elementPopover
  )

  onBeforeUnmount(() => {
    canvasEvents.cleanup()
    keyboardShortcuts.cleanup()
  })
}
