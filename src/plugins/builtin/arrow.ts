/**
 * Arrow tool plugin
 */

import { useArrowTool } from '../composables/useArrowTool'
import type { ToolPlugin } from '../types'

export const arrowPlugin: ToolPlugin = {
  id: 'arrow',
  name: 'Arrow Tool',
  type: 'arrow',
  category: 'drawing',
  ui: {
    label: '箭头工具',
    iconComponent: 'i-lucide-arrow-right',
  },
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
