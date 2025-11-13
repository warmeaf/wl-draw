/**
 * Export tool plugin for exporting canvas content as image
 */

import { useExportTool } from '../composables/useExportTool'
import type { ToolPlugin } from '../types'

export const exportPlugin: ToolPlugin = {
  id: 'export',
  name: 'Export Tool',
  type: 'export',
  metadata: {
    version: '1.0.0',
    description: 'Export canvas content as image',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '导出图片',
    iconComponent: 'i-lucide-image-down',
  },
  shortcut: 'Shift+KeyE',
  createTool: (context) => {
    const { tree, store, eventBus } = context
    const { exportCanvas } = useExportTool(tree, store)

    let toolBeforeExport: string | null = null

    const unsubscribe = eventBus.on('tool:switched', (data) => {
      if (data.to === 'export' && data.from !== 'export') {
        toolBeforeExport = data.from
      }
    })

    return {
      onActivate: async () => {
        await exportCanvas('png')
        const toolToRestore = toolBeforeExport || store.previousTool || 'select'
        setTimeout(() => {
          if (toolToRestore !== 'export') {
            store.setTool(toolToRestore as typeof store.currentTool)
          } else {
            store.setTool('select')
          }
        }, 100)
      },
      onDeactivate: () => {
        unsubscribe?.()
      },
    }
  },
}
