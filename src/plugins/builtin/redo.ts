/**
 * Redo tool plugin for canvas history operations
 */

import { useHistory } from '@/composables/state/useHistory'
import type { ToolPlugin } from '../types'

export const redoPlugin: ToolPlugin = {
  id: 'redo',
  name: 'Redo Tool',
  type: 'redo',
  metadata: {
    version: '1.0.0',
    description: 'Redo the last undone canvas operation',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '重做',
    iconComponent: 'i-lucide-redo-2',
  },
  shortcut: 'Ctrl+Shift+KeyZ',
  createTool: () => {
    const { redo } = useHistory()

    return {
      onActivate: () => {
        redo()
      },
    }
  },
}
