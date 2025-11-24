/**
 * Composable for managing tool instance creation and caching
 */

import type { App } from 'leafer-ui'
import type { Ref } from 'vue'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point } from '@/types'
import { errorHandler } from '@/utils/errorHandler'

export interface DrawingState {
  isDrawing: Ref<boolean>
  startPoint: Ref<Point | null>
  currentElement: Ref<LeaferElement>
  isShiftPressed: Ref<boolean>
  penPathPoints: Ref<Array<Point>>
  dragStartPositions: Ref<Map<string, { x: number; y: number }>>
  resetState: () => void
}

export function useToolInstance(app: App, drawingState: DrawingState) {
  const store = useCanvasStore()
  const tree = app.tree
  const toolInstanceCache = new Map<string, ToolInstance>()

  function createToolContext() {
    return {
      tree,
      store,
      isDrawing: drawingState.isDrawing,
      startPoint: drawingState.startPoint,
      currentElement: drawingState.currentElement,
      isShiftPressed: drawingState.isShiftPressed,
      penPathPoints: drawingState.penPathPoints,
      eventBus: pluginEventBus,
    }
  }

  async function getToolInstance(toolType: string): Promise<ToolInstance | null> {
    if (!toolInstanceCache.has(toolType)) {
      try {
        const plugin = await pluginRegistry.getByType(toolType)
        if (plugin) {
          try {
            const instance = plugin.createTool(createToolContext())
            toolInstanceCache.set(toolType, instance)
          } catch (error) {
            errorHandler.handlePluginError(
              plugin.id,
              `createTool failed for tool type "${toolType}"`,
              error instanceof Error ? error : undefined,
              {
                pluginName: plugin.name,
                toolType,
                operation: 'createTool',
              }
            )
            return null
          }
        }
      } catch (error) {
        errorHandler.handleRuntimeError(
          `Failed to get plugin for tool type "${toolType}"`,
          error instanceof Error ? error : undefined,
          { toolType, operation: 'getByType' }
        )
        return null
      }
    }
    return toolInstanceCache.get(toolType) || null
  }

  async function createToolInstanceForPlugin(pluginId: string): Promise<ToolInstance | null> {
    try {
      const plugin = await pluginRegistry.get(pluginId)
      if (!plugin) return null

      if (!toolInstanceCache.has(pluginId)) {
        try {
          const instance = plugin.createTool(createToolContext())
          toolInstanceCache.set(pluginId, instance)
        } catch (error) {
          errorHandler.handlePluginError(
            pluginId,
            `createTool failed for plugin "${pluginId}"`,
            error instanceof Error ? error : undefined,
            {
              pluginName: plugin.name,
              operation: 'createTool',
            }
          )
          return null
        }
      }
      return toolInstanceCache.get(pluginId) || null
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to get plugin "${pluginId}"`,
        error instanceof Error ? error : undefined,
        { pluginId, operation: 'get' }
      )
      return null
    }
  }

  function destroyToolInstance(key: string): boolean {
    const instance = toolInstanceCache.get(key)
    if (instance) {
      try {
        if (instance.onDestroy) {
          instance.onDestroy()
        }
      } catch (error) {
        errorHandler.handleRuntimeError(
          `onDestroy failed for tool instance "${key}"`,
          error instanceof Error ? error : undefined,
          { key, operation: 'onDestroy' }
        )
      }
      toolInstanceCache.delete(key)
      return true
    }
    return false
  }

  function destroyAllToolInstances(): void {
    for (const [key, instance] of toolInstanceCache.entries()) {
      try {
        if (instance.onDestroy) {
          instance.onDestroy()
        }
      } catch (error) {
        errorHandler.handleRuntimeError(
          `onDestroy failed for tool instance "${key}"`,
          error instanceof Error ? error : undefined,
          { key, operation: 'onDestroy' }
        )
      }
    }
    toolInstanceCache.clear()
  }

  return {
    getToolInstance,
    createToolInstanceForPlugin,
    destroyToolInstance,
    destroyAllToolInstances,
    toolInstances: toolInstanceCache,
  }
}
