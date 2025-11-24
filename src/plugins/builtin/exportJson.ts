/**
 * Export JSON tool plugin for exporting canvas content as JSON
 */

import { useExportTool } from '../composables/useExportTool'
import type { ToolPlugin } from '../types'

export const exportJsonPlugin: ToolPlugin = {
  id: 'exportJson',
  name: 'Export JSON Tool',
  type: 'exportJson',
  metadata: {
    version: '1.0.0',
    description: 'Export canvas content as JSON',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '导出 JSON',
    iconComponent: 'i-lucide-file-braces-corner',
  },
  shortcut: 'Shift+KeyJ',
  createTool: (context) => {
    const { tree, store } = context
    const { exportCanvasAsJSON } = useExportTool(tree, store)

    return {
      onActivate: () => {
        exportCanvasAsJSON()
      },
    }
  },
}
