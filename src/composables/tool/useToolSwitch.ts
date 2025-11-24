/**
 * Composable for handling tool switching logic and lifecycle management
 */

import { watch } from 'vue'
import { TOOL_TYPES } from '@/constants'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import { errorHandler } from '@/utils/errorHandler'
import type { useCanvasMode } from './useCanvasMode'
import type { DrawingState } from './useToolInstance'

export function useToolSwitch(
  getToolInstance: (toolType: string) => Promise<ToolInstance | null>,
  canvasMode: ReturnType<typeof useCanvasMode>,
  drawingState: DrawingState,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>
) {
  const store = useCanvasStore()
  let previousToolInstance: ToolInstance | null = null

  watch(
    () => store.currentTool,
    async (newTool, oldTool) => {
      try {
        if (oldTool) {
          try {
            const oldPlugin = await pluginRegistry.getByType(oldTool)
            if (oldPlugin) {
              pluginRegistry.updatePluginState(oldPlugin.id, 'deactivated')
              pluginEventBus.emit('plugin:deactivated', {
                pluginId: oldPlugin.id,
                toolType: oldTool,
              })
            }
          } catch (error) {
            errorHandler.handleRuntimeError(
              `Failed to deactivate plugin for tool "${oldTool}"`,
              error instanceof Error ? error : undefined,
              { toolType: oldTool, operation: 'deactivate' }
            )
          }

          try {
            if (previousToolInstance?.onDeactivate) {
              previousToolInstance.onDeactivate()
            }
          } catch (error) {
            errorHandler.handleRuntimeError(
              `Tool instance onDeactivate failed for "${oldTool}"`,
              error instanceof Error ? error : undefined,
              { toolType: oldTool, operation: 'onDeactivate' }
            )
          }
        }

        if (oldTool && newTool) {
          try {
            const canSwitch = await pluginRegistry.executeHook('beforeToolSwitch', {
              from: oldTool,
              to: newTool,
            })
            if (!canSwitch) {
              return
            }
          } catch (error) {
            errorHandler.handleRuntimeError(
              `beforeToolSwitch hook failed when switching from "${oldTool}" to "${newTool}"`,
              error instanceof Error ? error : undefined,
              { from: oldTool, to: newTool, operation: 'beforeToolSwitch' }
            )
            return
          }
        }

        drawingState.resetState()

        try {
          await canvasMode.autoSetMode(newTool)
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Failed to set canvas mode for tool "${newTool}"`,
            error instanceof Error ? error : undefined,
            { toolType: newTool, operation: 'autoSetMode' }
          )
        }

        try {
          await canvasMode.autoSetDrag(newTool)
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Failed to set canvas drag for tool "${newTool}"`,
            error instanceof Error ? error : undefined,
            { toolType: newTool, operation: 'autoSetDrag' }
          )
        }

        let newToolInstance: ToolInstance | null = null
        try {
          newToolInstance = await getToolInstance(newTool)
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Failed to get tool instance for "${newTool}"`,
            error instanceof Error ? error : undefined,
            { toolType: newTool, operation: 'getToolInstance' }
          )
        }

        try {
          const newPlugin = await pluginRegistry.getByType(newTool)
          if (newPlugin) {
            pluginRegistry.updatePluginState(newPlugin.id, 'activated')
            pluginEventBus.emit('plugin:activated', {
              pluginId: newPlugin.id,
              toolType: newTool,
            })
          }
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Failed to activate plugin for tool "${newTool}"`,
            error instanceof Error ? error : undefined,
            { toolType: newTool, operation: 'activate' }
          )
        }

        if (oldTool) {
          try {
            pluginEventBus.emit('tool:switched', {
              from: oldTool,
              to: newTool,
            })
            await pluginRegistry.executeHook('afterToolSwitch', {
              from: oldTool,
              to: newTool,
            })
          } catch (error) {
            errorHandler.handleRuntimeError(
              `afterToolSwitch hook failed when switching from "${oldTool}" to "${newTool}"`,
              error instanceof Error ? error : undefined,
              { from: oldTool, to: newTool, operation: 'afterToolSwitch' }
            )
          }
        }

        try {
          if (newToolInstance?.onActivate) {
            newToolInstance.onActivate()
          }
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Tool instance onActivate failed for "${newTool}"`,
            error instanceof Error ? error : undefined,
            { toolType: newTool, operation: 'onActivate' }
          )
        }

        previousToolInstance = newToolInstance

        if (newTool === TOOL_TYPES.PAN && elementPopover?.showPopover.value) {
          try {
            elementPopover.hidePopover()
          } catch (error) {
            errorHandler.handleRuntimeError(
              `Failed to hide popover when switching to pan tool`,
              error instanceof Error ? error : undefined,
              { toolType: newTool, operation: 'hidePopover' }
            )
          }
        }
      } catch (error) {
        errorHandler.handleRuntimeError(
          `Unexpected error during tool switch from "${oldTool || 'none'}" to "${newTool}"`,
          error instanceof Error ? error : undefined,
          { from: oldTool, to: newTool, operation: 'toolSwitch' }
        )
      }
    }
  )
}
