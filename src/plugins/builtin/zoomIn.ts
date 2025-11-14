/**
 * Zoom in tool plugin for canvas zoom operations
 */

import { useZoomTool } from '@/composables/useZoomTool'
import type { ToolPlugin } from '../types'

export const zoomInPlugin: ToolPlugin = {
  id: 'zoomIn',
  name: 'Zoom In Tool',
  type: 'zoomIn',
  metadata: {
    version: '1.0.0',
    description: 'Zoom in the canvas',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '放大',
    iconComponent: 'i-lucide-zoom-in',
  },
  shortcut: 'Ctrl+Equal',
  createTool: (context) => {
    const { store } = context
    const { zoomIn } = useZoomTool()

    return {
      onActivate: () => {
        const previousTool = store.currentTool === 'zoomIn' ? store.previousTool : store.currentTool
        zoomIn()
        if (previousTool && previousTool !== 'zoomIn') {
          store.setTool(previousTool as typeof store.currentTool)
        }
      },
    }
  },
}
