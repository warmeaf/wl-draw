/**
 * Arrow tool plugin
 */

import { useArrowTool } from '../composables/useArrowTool'
import type { ToolPlugin } from '../types'

export const arrowPlugin: ToolPlugin = {
  id: 'arrow',
  name: 'Arrow Tool',
  type: 'arrow',
  metadata: {
    version: '1.0.0',
    description: 'Arrow drawing tool',
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesDragStart: true,
    handlesDrag: true,
    handlesDragEnd: true,
  },
  ui: {
    label: '箭头工具',
    iconComponent: 'i-lucide-arrow-right',
  },
  shortcut: 'KeyA',
  createTool: (context) => {
    return useArrowTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement,
      context.isShiftPressed
    )
  },
}
