/**
 * Canvas tools composable for handling drawing tools and mouse interactions
 */

import { useKeyModifier } from '@vueuse/core'
import type { App } from 'leafer-ui'
import { DragEvent, KeyEvent, PointerEvent, ZoomEvent } from 'leafer-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useHistory } from '@/composables/useHistory'
import { useZoomTool } from '@/composables/useZoomTool'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import { parseShortcut } from '@/plugins/shortcut'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, ToolType } from '@/types'

export function useCanvasTools(app: App) {
  const store = useCanvasStore()
  const tree = app.tree
  const { zoomIn, zoomOut } = useZoomTool()
  const { addSnapshot } = useHistory()

  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)
  const currentElement = ref<LeaferElement>(null)
  const penPathPoints = ref<Array<Point>>([])
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())

  const isShiftPressedRaw = useKeyModifier('Shift', { events: ['keydown', 'keyup'] })
  const isShiftPressed = computed(() => isShiftPressedRaw.value ?? false)

  const toolInstances = new Map<string, ToolInstance>()
  let previousToolInstance: ToolInstance | null = null

  function getToolInstance(toolType: string): ToolInstance | null {
    if (!toolInstances.has(toolType)) {
      const plugin = pluginRegistry.getByType(toolType)
      if (plugin) {
        const instance = plugin.createTool({
          tree,
          store,
          isDrawing,
          startPoint,
          currentElement,
          isShiftPressed,
          penPathPoints,
          eventBus: pluginEventBus,
        })
        toolInstances.set(toolType, instance)
      }
    }
    return toolInstances.get(toolType) || null
  }

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

      resetState()
      autoSetMode(newTool)
      autoSetDrag(newTool)

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

  function resetState() {
    isDrawing.value = false
    startPoint.value = null
    currentElement.value = null
    penPathPoints.value = []
  }

  function autoSetMode(newTool: ToolType) {
    const plugin = pluginRegistry.getByType(newTool)
    if (!plugin) return

    const capabilities = plugin.capabilities
    if (capabilities?.requiresNormalMode) {
      app.mode = 'normal'
    } else if (capabilities?.requiresDrawMode) {
      app.mode = 'draw'
    }
  }

  function autoSetDrag(newTool: ToolType) {
    const plugin = pluginRegistry.getByType(newTool)
    if (!plugin || !app.config.move) return

    app.config.move.drag = plugin.capabilities?.enablesDrag === true
  }

  function handleDrag(e: DragEvent) {
    if (!tree || !isDrawing.value) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesDrag) return

    const bounds = e.getPageBounds()
    if (bounds) {
      pluginEventBus.emit('drawing:update', {
        toolType: tool,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      })
    }

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.updateDrawing) {
      toolInstance.updateDrawing(e)
    }
  }

  async function handleDragEnd() {
    if (!tree) return

    if (isDrawing.value) {
      const tool = store.currentTool
      const plugin = pluginRegistry.getByType(tool)
      if (!plugin || !plugin.capabilities?.handlesDragEnd) return

      const canFinish = await pluginRegistry.executeHook('beforeDrawingFinish', {
        toolType: tool,
      })
      if (!canFinish) {
        return
      }

      const objectCountBefore = store.objects.length

      const toolInstance = getToolInstance(tool)
      if (toolInstance?.finishDrawing) {
        toolInstance.finishDrawing()
      }

      const objectCountAfter = store.objects.length

      if (objectCountAfter > objectCountBefore) {
        addSnapshot()
      }

      await pluginRegistry.executeHook('afterDrawingFinish', {
        toolType: tool,
      })

      resetState()
    } else if (dragStartPositions.value.size > 0) {
      let hasPositionChanged = false
      const POSITION_THRESHOLD = 0.5

      for (const [objectId, startPosition] of dragStartPositions.value.entries()) {
        const obj = store.objects.find((o) => o.id === objectId)
        if (obj?.element) {
          const currentX = obj.element.x ?? 0
          const currentY = obj.element.y ?? 0
          const deltaX = Math.abs(currentX - startPosition.x)
          const deltaY = Math.abs(currentY - startPosition.y)

          if (deltaX > POSITION_THRESHOLD || deltaY > POSITION_THRESHOLD) {
            hasPositionChanged = true
            break
          }
        }
      }

      if (hasPositionChanged) {
        addSnapshot()
      }

      dragStartPositions.value.clear()
    }
  }

  function handleTap(e: PointerEvent) {
    if (!tree) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)
    if (!plugin || !plugin.capabilities?.handlesTap) return

    const objectCountBefore = store.objects.length

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.handleTap) {
      toolInstance.handleTap(e)
    }

    if (tool === 'text') {
      const objectCountAfter = store.objects.length
      if (objectCountAfter > objectCountBefore) {
        addSnapshot()
      }
    }
  }

  const dragStartId = app.on_(DragEvent.START, async (e: DragEvent) => {
    if (!tree) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)

    if (app.mode === 'normal' && !isDrawing.value) {
      const selectedObjectIds = app.editor.list.map((item) => {
        return store.objects.find((obj) => obj.element.innerId === item.innerId)?.id
      })
      if (selectedObjectIds.length > 0) {
        dragStartPositions.value.clear()
        for (const objectId of selectedObjectIds) {
          if (!objectId) continue
          const obj = store.objects.find((o) => o.id === objectId)
          if (obj?.element) {
            dragStartPositions.value.set(objectId, {
              x: obj.element.x ?? 0,
              y: obj.element.y ?? 0,
            })
          }
        }
      }
    }

    if (!plugin || !plugin.capabilities?.handlesDragStart) return

    const bounds = e.getPageBounds()
    if (!bounds) return

    const drawingStartContext = {
      toolType: tool,
      point: { x: bounds.x, y: bounds.y },
    }

    const canStart = await pluginRegistry.executeHook('beforeDrawingStart', drawingStartContext)
    if (!canStart) {
      return
    }

    startPoint.value = { x: bounds.x, y: bounds.y }
    penPathPoints.value = [{ x: bounds.x, y: bounds.y }]
    isDrawing.value = true

    pluginEventBus.emit('drawing:start', drawingStartContext)

    await pluginRegistry.executeHook('afterDrawingStart', drawingStartContext)

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.startDrawing) {
      toolInstance.startDrawing()
    }
  })

  const dragId = app.on_(DragEvent.DRAG, (e: DragEvent) => {
    handleDrag(e)
  })

  const dragEndId = app.on_(DragEvent.END, () => {
    handleDragEnd()
  })

  const tapId = app.on_(PointerEvent.TAP, (e: PointerEvent) => {
    handleTap(e)
  })

  function buildShortcutMap() {
    const shortcutMap = new Map<string, { pluginId: string; toolType: ToolType }>()
    const plugins = pluginRegistry.getAll()

    for (const plugin of plugins) {
      if (plugin.shortcut) {
        const parsed = parseShortcut(plugin.shortcut)
        if (parsed) {
          const shortcutKey = buildShortcutKey(parsed)
          shortcutMap.set(shortcutKey, {
            pluginId: plugin.id,
            toolType: plugin.type as ToolType,
          })
        }
      }
    }

    return shortcutMap
  }

  function buildShortcutKey(parsed: {
    key: string
    ctrl: boolean
    shift: boolean
    alt: boolean
    meta: boolean
  }): string {
    const modifiers: string[] = []
    if (parsed.ctrl) modifiers.push('Ctrl')
    if (parsed.shift) modifiers.push('Shift')
    if (parsed.alt) modifiers.push('Alt')
    if (parsed.meta) modifiers.push('Meta')
    return modifiers.length > 0 ? `${modifiers.join('+')}+${parsed.key}` : parsed.key
  }

  function matchShortcut(
    e: KeyboardEvent,
    parsed: { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean }
  ): boolean {
    if (parsed.key !== e.code) return false

    if (parsed.ctrl) {
      if (!(e.ctrlKey || e.metaKey)) return false
    } else if (parsed.meta) {
      if (!e.metaKey) return false
    } else {
      if (e.ctrlKey || e.metaKey) return false
    }

    if (parsed.shift !== e.shiftKey) return false
    if (parsed.alt !== e.altKey) return false

    return true
  }

  const shortcutMap = ref(buildShortcutMap())

  const keyDownId = app.on_(KeyEvent.DOWN, (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      store.enablePanWithSpace()
      return
    }

    for (const [shortcutKey, { pluginId, toolType }] of shortcutMap.value.entries()) {
      const parsed = parseShortcut(shortcutKey)
      if (parsed && matchShortcut(e, parsed)) {
        if (toolType === 'zoomIn') {
          zoomIn()
          return
        }
        if (toolType === 'zoomOut') {
          zoomOut()
          return
        }

        const plugin = pluginRegistry.get(pluginId)
        if (
          plugin &&
          (plugin.id === 'export' ||
            plugin.id === 'exportJson' ||
            plugin.id === 'undo' ||
            plugin.id === 'redo')
        ) {
          let toolInstance = toolInstances.get(pluginId)
          if (!toolInstance) {
            toolInstance = plugin.createTool({
              tree,
              store,
              isDrawing,
              startPoint,
              currentElement,
              isShiftPressed,
              penPathPoints,
              eventBus: pluginEventBus,
            })
            toolInstances.set(pluginId, toolInstance)
          }
          if (toolInstance?.onActivate) {
            toolInstance.onActivate()
          }
          return
        }

        if (toolType !== 'pan' || !store.isPanningWithSpace) {
          store.setTool(toolType)
        }
        break
      }
    }
  })

  const keyUpId = app.on_(KeyEvent.UP, (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      store.disablePanWithSpace()
    }
  })

  const zoomId = app.on_(ZoomEvent.ZOOM, (_e: ZoomEvent) => {
    const zoom = app.tree.scale as number
    store.setZoom(zoom)
    pluginEventBus.emit('canvas:zoom', { zoom })
  })

  onBeforeUnmount(() => {
    app.off_(dragStartId)
    app.off_(dragId)
    app.off_(dragEndId)
    app.off_(tapId)
    app.off_(keyDownId)
    app.off_(keyUpId)
    app.off_(zoomId)
  })
}
