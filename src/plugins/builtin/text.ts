/**
 * Text tool plugin
 */

import { useTextTool } from '../composables/useTextTool'
import type { ToolPlugin } from '../types'

export const textPlugin: ToolPlugin = {
  id: 'text',
  name: 'Text Tool',
  type: 'text',
  metadata: {
    version: '1.0.0',
    description: 'Text insertion tool',
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesTap: true,
  },
  ui: {
    label: '文本工具',
    iconComponent: 'i-lucide-type',
  },
  shortcut: 'KeyT',
  createTool: (context) => {
    return useTextTool(context.tree, context.store)
  },
}
