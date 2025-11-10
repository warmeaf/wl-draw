/**
 * Pen tool plugin
 */

import { usePenTool } from '../composables/usePenTool'
import type { ToolPlugin } from '../types'

export const penPlugin: ToolPlugin = {
  id: 'pen',
  name: 'Pen Tool',
  type: 'pen',
  category: 'drawing',
  ui: {
    label: '画笔工具',
    iconComponent: 'i-lucide-pen-tool',
    dividerAfter: true,
  },
  shortcut: 'KeyP',
  createTool: (context) => {
    if (!context.penPathPoints) {
      throw new Error('Pen tool requires penPathPoints in context')
    }
    return usePenTool(
      context.tree,
      context.store,
      context.startPoint,
      context.currentElement,
      context.penPathPoints
    )
  },
}
