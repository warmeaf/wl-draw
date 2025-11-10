/**
 * Select tool plugin
 */

import type { ToolPlugin } from '../types'

export const selectPlugin: ToolPlugin = {
  id: 'select',
  name: 'Select Tool',
  type: 'select',
  category: 'selection',
  ui: {
    label: '选择工具',
    iconComponent: 'i-lucide-mouse-pointer-2',
  },
  createTool: () => {
    return {}
  },
}
