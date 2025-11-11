/**
 * Pan tool plugin
 */

import type { ToolPlugin } from '../types'

export const panPlugin: ToolPlugin = {
  id: 'pan',
  name: 'Pan Tool',
  type: 'pan',
  category: 'utility',
  ui: {
    label: '平移工具',
    iconComponent: 'i-lucide-hand',
    dividerAfter: true,
  },
  shortcut: 'KeySpace',
  createTool: () => {
    return {}
  },
}
