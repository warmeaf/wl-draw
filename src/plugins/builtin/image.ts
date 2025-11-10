/**
 * Image tool plugin
 */

import { useImageTool } from '../composables/useImageTool'
import type { ToolPlugin } from '../types'

export const imagePlugin: ToolPlugin = {
  id: 'image',
  name: 'Image Tool',
  type: 'image',
  category: 'drawing',
  ui: {
    label: '图片工具',
    iconComponent: 'i-lucide-image',
  },
  createTool: (context) => {
    return useImageTool(context.tree, context.store)
  },
}
