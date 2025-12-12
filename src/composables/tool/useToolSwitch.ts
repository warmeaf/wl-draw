/**
 * Composable for handling tool switching logic and lifecycle management
 */

import { watch } from 'vue'
import { TOOL_TYPES } from '@/constants'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'
import { errorHandler } from '@/utils/errorHandler'
import type { useCanvasMode } from './useCanvasMode'
import type { DrawingState } from './useToolInstance'

function handleErrorWithContext(
  message: string,
  error: unknown,
  context: Record<string, unknown>
): void {
  errorHandler.handleRuntimeError(message, error instanceof Error ? error : undefined, context)
}

async function deactivatePreviousTool(
  oldTool: string,
  previousToolInstance: ToolInstance | null
): Promise<void> {
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
    handleErrorWithContext(`Failed to deactivate plugin for tool "${oldTool}"`, error, {
      toolType: oldTool,
      operation: 'deactivate',
    })
  }

  try {
    if (previousToolInstance?.onDeactivate) {
      previousToolInstance.onDeactivate()
    }
  } catch (error) {
    handleErrorWithContext(`Tool instance onDeactivate failed for "${oldTool}"`, error, {
      toolType: oldTool,
      operation: 'onDeactivate',
    })
  }
}

async function checkToolSwitchPermission(oldTool: string, newTool: string): Promise<boolean> {
  try {
    const canSwitch = await pluginRegistry.executeHook('beforeToolSwitch', {
      from: oldTool,
      to: newTool,
    })
    return canSwitch !== false
  } catch (error) {
    handleErrorWithContext(
      `beforeToolSwitch hook failed when switching from "${oldTool}" to "${newTool}"`,
      error,
      { from: oldTool, to: newTool, operation: 'beforeToolSwitch' }
    )
    return false
  }
}

async function configureCanvasForTool(
  newTool: ToolType,
  canvasMode: ReturnType<typeof useCanvasMode>
): Promise<void> {
  try {
    await canvasMode.autoSetMode(newTool)
  } catch (error) {
    handleErrorWithContext(`Failed to set canvas mode for tool "${newTool}"`, error, {
      toolType: newTool,
      operation: 'autoSetMode',
    })
  }

  try {
    await canvasMode.autoSetDrag(newTool)
  } catch (error) {
    handleErrorWithContext(`Failed to set canvas drag for tool "${newTool}"`, error, {
      toolType: newTool,
      operation: 'autoSetDrag',
    })
  }
}

async function getNewToolInstance(
  newTool: string,
  getToolInstance: (toolType: string) => Promise<ToolInstance | null>
): Promise<ToolInstance | null> {
  try {
    return await getToolInstance(newTool)
  } catch (error) {
    handleErrorWithContext(`Failed to get tool instance for "${newTool}"`, error, {
      toolType: newTool,
      operation: 'getToolInstance',
    })
    return null
  }
}

async function activateNewToolPlugin(newTool: string): Promise<void> {
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
    handleErrorWithContext(`Failed to activate plugin for tool "${newTool}"`, error, {
      toolType: newTool,
      operation: 'activate',
    })
  }
}

async function emitToolSwitchEvents(oldTool: string, newTool: string): Promise<void> {
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
    handleErrorWithContext(
      `afterToolSwitch hook failed when switching from "${oldTool}" to "${newTool}"`,
      error,
      { from: oldTool, to: newTool, operation: 'afterToolSwitch' }
    )
  }
}

function activateToolInstance(newTool: string, newToolInstance: ToolInstance | null): void {
  try {
    if (newToolInstance?.onActivate) {
      newToolInstance.onActivate()
    }
  } catch (error) {
    handleErrorWithContext(`Tool instance onActivate failed for "${newTool}"`, error, {
      toolType: newTool,
      operation: 'onActivate',
    })
  }
}

function hidePopoverIfPanTool(
  newTool: string,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>
): void {
  if (newTool === TOOL_TYPES.PAN && elementPopover?.showPopover.value) {
    try {
      elementPopover.hidePopover()
    } catch (error) {
      handleErrorWithContext(`Failed to hide popover when switching to pan tool`, error, {
        toolType: newTool,
        operation: 'hidePopover',
      })
    }
  }
}

export function useToolSwitch(
  getToolInstance: (toolType: string) => Promise<ToolInstance | null>,
  canvasMode: ReturnType<typeof useCanvasMode>,
  drawingState: DrawingState,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>
) {
  const store = useCanvasStore()
  let previousToolInstance: ToolInstance | null = null

  watch(
    () => store.currentTool as ToolType,
    async (newTool, oldTool) => {
      try {
        if (oldTool) {
          await deactivatePreviousTool(oldTool, previousToolInstance)
        }

        if (oldTool && newTool) {
          const canSwitch = await checkToolSwitchPermission(oldTool, newTool)
          if (!canSwitch) {
            return
          }
        }

        drawingState.resetState()

        await configureCanvasForTool(newTool, canvasMode)

        const newToolInstance = await getNewToolInstance(newTool, getToolInstance)

        await activateNewToolPlugin(newTool)

        if (oldTool) {
          await emitToolSwitchEvents(oldTool, newTool)
        }

        activateToolInstance(newTool, newToolInstance)

        previousToolInstance = newToolInstance

        hidePopoverIfPanTool(newTool, elementPopover)
      } catch (error) {
        handleErrorWithContext(
          `Unexpected error during tool switch from "${oldTool || 'none'}" to "${newTool}"`,
          error,
          { from: oldTool, to: newTool, operation: 'toolSwitch' }
        )
      }
    }
  )
}
