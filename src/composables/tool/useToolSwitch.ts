/**
 * Composable for handling tool switching logic and lifecycle management
 */

import { watch } from 'vue'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { useCanvasMode } from './useCanvasMode'
import type { DrawingState } from './useToolInstance'

export function useToolSwitch(
  getToolInstance: (toolType: string) => ToolInstance | null,
  canvasMode: ReturnType<typeof useCanvasMode>,
  drawingState: DrawingState
) {
  const store = useCanvasStore()
  let previousToolInstance: ToolInstance | null = null

  watch(
    () => store.currentTool,
    async (newTool, oldTool) => {
      if (oldTool) {
        const oldPlugin = pluginRegistry.getByType(oldTool)
        if (oldPlugin) {
          pluginRegistry.updatePluginState(oldPlugin.id, 'deactivated')
          pluginEventBus.emit('plugin:deactivated', {
            pluginId: oldPlugin.id,
            toolType: oldTool,
          })
        }
        if (previousToolInstance?.onDeactivate) {
          previousToolInstance.onDeactivate()
        }
      }

      if (oldTool && newTool) {
        const canSwitch = await pluginRegistry.executeHook('beforeToolSwitch', {
          from: oldTool,
          to: newTool,
        })
        if (!canSwitch) {
          return
        }
      }

      drawingState.resetState()
      canvasMode.autoSetMode(newTool)
      canvasMode.autoSetDrag(newTool)

      const newToolInstance = getToolInstance(newTool)
      const newPlugin = pluginRegistry.getByType(newTool)
      if (newPlugin) {
        pluginRegistry.updatePluginState(newPlugin.id, 'activated')
        pluginEventBus.emit('plugin:activated', {
          pluginId: newPlugin.id,
          toolType: newTool,
        })
      }
      if (oldTool) {
        pluginEventBus.emit('tool:switched', {
          from: oldTool,
          to: newTool,
        })
        await pluginRegistry.executeHook('afterToolSwitch', {
          from: oldTool,
          to: newTool,
        })
      }
      if (newToolInstance?.onActivate) {
        newToolInstance.onActivate()
      }
      previousToolInstance = newToolInstance
    }
  )
}
