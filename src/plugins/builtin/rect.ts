/**
 * Rectangle tool plugin
 */

import { useRectTool } from '../composables/useRectTool'
import type { ToolPlugin } from '../types'

export const rectPlugin: ToolPlugin = {
  id: 'rect',
  name: 'Rectangle Tool',
  type: 'rect',
  category: 'drawing',
  ui: {
    label: '矩形工具',
    iconComponent: 'i-lucide-square',
  },
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
