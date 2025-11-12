/**
 * Pan tool plugin
 */

import type { ToolPlugin } from '../types'

export const panPlugin: ToolPlugin = {
  id: 'pan',
  name: 'Pan Tool',
  type: 'pan',
  metadata: {
    version: '1.0.0',
    description: 'Pan tool for navigating the canvas',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
    enablesDrag: true,
  },
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
