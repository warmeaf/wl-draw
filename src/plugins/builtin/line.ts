/**
 * Line tool plugin
 */

import { useLineTool } from '../composables/useLineTool'
import type { ToolPlugin } from '../types'

export const linePlugin: ToolPlugin = {
  id: 'line',
  name: 'Line Tool',
  type: 'line',
  category: 'drawing',
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
