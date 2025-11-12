/**
 * Line tool plugin
 */

import { useLineTool } from '../composables/useLineTool'
import type { ToolPlugin } from '../types'

export const linePlugin: ToolPlugin = {
  id: 'line',
  name: 'Line Tool',
  type: 'line',
  metadata: {
    version: '1.0.0',
    description: 'Line drawing tool',
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesDragStart: true,
    handlesDrag: true,
    handlesDragEnd: true,
  },
  ui: {
    label: '直线工具',
    iconComponent: 'i-lucide-minus',
  },
  shortcut: 'KeyL',
  createTool: (context) => {
    return useLineTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement,
      context.isShiftPressed
    )
  },
}
