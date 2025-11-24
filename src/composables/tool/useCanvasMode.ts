/**
 * Composable for automatically setting canvas mode and drag based on tool capabilities
 */

import type { App } from 'leafer-ui'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolType } from '@/types'

export function useCanvasMode(app: App) {
  async function autoSetMode(newTool: ToolType) {
    const plugin = await pluginRegistry.getByType(newTool)
    if (!plugin) return

    const capabilities = plugin.capabilities
    if (capabilities?.requiresNormalMode) {
      app.mode = 'normal'
    } else if (capabilities?.requiresDrawMode) {
      app.mode = 'draw'
    }
  }

  async function autoSetDrag(newTool: ToolType) {
    const plugin = await pluginRegistry.getByType(newTool)
    if (!plugin || !app.config.move) return

    app.config.move.drag = plugin.capabilities?.enablesDrag === true
  }

  return {
    autoSetMode,
    autoSetDrag,
  }
}
