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
      const plugin = await pluginRegistry.getByType(toolType)
      if (plugin) {
        const instance = plugin.createTool(createToolContext())
        toolInstanceCache.set(toolType, instance)
      }
    }
    return toolInstanceCache.get(toolType) || null
  }

  async function createToolInstanceForPlugin(pluginId: string): Promise<ToolInstance | null> {
    const plugin = await pluginRegistry.get(pluginId)
    if (!plugin) return null

    if (!toolInstanceCache.has(pluginId)) {
      const instance = plugin.createTool(createToolContext())
      toolInstanceCache.set(pluginId, instance)
    }
    return toolInstanceCache.get(pluginId) || null
  }

  function destroyToolInstance(key: string): boolean {
    const instance = toolInstanceCache.get(key)
    if (instance) {
      if (instance.onDestroy) {
        instance.onDestroy()
      }
      toolInstanceCache.delete(key)
      return true
    }
    return false
  }

  function destroyAllToolInstances(): void {
    for (const [_key, instance] of toolInstanceCache.entries()) {
      if (instance.onDestroy) {
        instance.onDestroy()
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
