/**
 * Select tool plugin
 */

import type { ToolPlugin } from '../types'

export const selectPlugin: ToolPlugin = {
  id: 'select',
  name: 'Select Tool',
  type: 'select',
  metadata: {
    version: '1.0.0',
    description: 'Selection tool for selecting and manipulating objects',
  },
  category: 'selection',
  capabilities: {
    requiresNormalMode: true,
    handlesTap: true,
  },
  ui: {
    label: '选择工具',
    iconComponent: 'i-lucide-mouse-pointer-2',
  },
  shortcut: 'KeyV',
  createTool: () => {
    return {}
  },
}
