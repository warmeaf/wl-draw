/**
 * Image tool plugin
 */

import { useImageTool } from '../composables/useImageTool'
import type { ToolPlugin } from '../types'

export const imagePlugin: ToolPlugin = {
  id: 'image',
  name: 'Image Tool',
  type: 'image',
  metadata: {
    version: '1.0.0',
    description: 'Image insertion tool',
  },
  category: 'drawing',
  capabilities: {
    requiresDrawMode: true,
    handlesTap: true,
  },
  ui: {
    label: '图片工具',
    iconComponent: 'i-lucide-image',
  },
  shortcut: 'KeyI',
  createTool: (context) => {
    return useImageTool(context.tree, context.store)
  },
}
