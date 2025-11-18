/**
 * Undo tool plugin for canvas history operations
 */

import { useHistory } from '@/plugins/composables/useHistory'
import type { ToolPlugin } from '../types'

export const undoPlugin: ToolPlugin = {
  id: 'undo',
  name: 'Undo Tool',
  type: 'undo',
  metadata: {
    version: '1.0.0',
    description: 'Undo the last canvas operation',
  },
  category: 'utility',
  capabilities: {
    requiresNormalMode: true,
  },
  ui: {
    label: '撤销',
    iconComponent: 'i-lucide-undo-2',
  },
  shortcut: 'Ctrl+KeyZ',
  createTool: () => {
    const { undo } = useHistory()

    return {
      onActivate: () => {
        undo()
      },
    }
  },
}
