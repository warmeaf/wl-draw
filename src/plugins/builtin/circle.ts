/**
 * Circle tool plugin
 */

import { useCircleTool } from '../composables/useCircleTool'
import type { ToolPlugin } from '../types'

export const circlePlugin: ToolPlugin = {
  id: 'circle',
  name: 'Circle Tool',
  type: 'circle',
  category: 'drawing',
  ui: {
    label: '圆形工具',
    iconComponent: 'i-lucide-circle',
  },
  shortcut: 'KeyC',
  createTool: (context) => {
    return useCircleTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement,
      context.isShiftPressed
    )
  },
}
