/**
 * Zoom out tool plugin for canvas zoom operations
 */

import { useZoomTool } from '@/composables/features/useZoomTool'
import type { ToolPlugin } from '../types'

export const zoomOutPlugin: ToolPlugin = {
  id: 'zoomOut',
  name: 'Zoom Out Tool',
  type: 'zoomOut',
  metadata: {
    version: '1.0.0',
    description: 'Zoom out the canvas',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '缩小',
    iconComponent: 'i-lucide-zoom-out',
  },
  shortcut: 'Ctrl+Minus',
  createTool: (context) => {
    const { store } = context
    const { zoomOut } = useZoomTool()

    return {
      onActivate: () => {
        const previousTool =
          store.currentTool === 'zoomOut' ? store.previousTool : store.currentTool
        zoomOut()
        if (previousTool && previousTool !== 'zoomOut') {
          store.setTool(previousTool as typeof store.currentTool)
        }
      },
    }
  },
}
