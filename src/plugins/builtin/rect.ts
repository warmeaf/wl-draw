/**
 * Rectangle tool plugin
 */

import { useRectTool } from '../composables/useRectTool'
import type { ToolPlugin } from '../types'

export const rectPlugin: ToolPlugin = {
  id: 'rect',
  name: 'Rectangle Tool',
  type: 'rect',
  metadata: {
    version: '1.0.0',
    description: 'Rectangle drawing tool',
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesDragStart: true,
    handlesDrag: true,
    handlesDragEnd: true,
  },
  ui: {
    label: '矩形工具',
    iconComponent: 'i-lucide-square',
  },
  shortcut: 'KeyR',
  createTool: (context) => {
    return useRectTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement,
      context.isShiftPressed
    )
  },
}
