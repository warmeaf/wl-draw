/**
 * Canvas tools composable for handling drawing tools and mouse interactions
 */

import '@/plugins/builtin'
import { useKeyModifier } from '@vueuse/core'
import type { App } from 'leafer-ui'
import { DragEvent, KeyEvent, PointerEvent, ZoomEvent } from 'leafer-ui'
import { computed, onBeforeUnmount, ref } from 'vue'
import { pluginRegistry } from '@/plugins/registry'
import { parseShortcut } from '@/plugins/shortcut'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, ToolType } from '@/types'

export function useCanvasTools(app: App) {
  const store = useCanvasStore()
  const tree = app.tree

  const isDrawing = ref(false)
  const startPoint = ref<Point | null>(null)
  const currentElement = ref<LeaferElement>(null)
  const penPathPoints = ref<Array<Point>>([])

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
        })
        toolInstances.set(toolType, instance)
      }
    }
    return toolInstances.get(toolType) || null
  }

  watch(
    () => store.currentTool,
    (newTool, oldTool) => {
      if (oldTool && previousToolInstance?.onDeactivate) {
        previousToolInstance.onDeactivate()
      }

      resetState()
      autoSetMode(newTool)
      autoSetDrag(newTool)

      const newToolInstance = getToolInstance(newTool)
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
    if (newTool === 'select' || newTool === 'pan') {
      app.mode = 'normal'
    } else {
      app.mode = 'draw'
    }
  }

  function autoSetDrag(newTool: ToolType) {
    if (app.config.move) {
      app.config.move.drag = newTool === 'pan'
    }
  }

  function handleDrag(e: DragEvent) {
    if (!tree || !isDrawing.value) return

    const toolInstance = getToolInstance(store.currentTool)
    if (toolInstance?.updateDrawing) {
      toolInstance.updateDrawing(e)
    }
  }

  function handleDragEnd() {
    if (!tree || !isDrawing.value) return

    const toolInstance = getToolInstance(store.currentTool)
    if (toolInstance?.finishDrawing) {
      toolInstance.finishDrawing()
    }

    resetState()
  }

  function handleTap(e: PointerEvent) {
    if (!tree) return

    const toolInstance = getToolInstance(store.currentTool)
    if (toolInstance?.handleTap) {
      toolInstance.handleTap(e)
    }
  }

  const dragStartId = app.on_(DragEvent.START, (e: DragEvent) => {
    if (!tree) return

    const tool = store.currentTool
    const plugin = pluginRegistry.getByType(tool)
    if (!plugin) return

    if (tool === 'select' || tool === 'pan' || tool === 'text' || tool === 'image') {
      return
    }

    const bounds = e.getPageBounds()
    if (!bounds) return

    startPoint.value = { x: bounds.x, y: bounds.y }
    penPathPoints.value = [{ x: bounds.x, y: bounds.y }]
    isDrawing.value = true

    const toolInstance = getToolInstance(tool)
    if (toolInstance?.handleMouseDown) {
      toolInstance.handleMouseDown()
    }
  })

  const dragId = app.on_(DragEvent.DRAG, (e: DragEvent) => {
    const tool = store.currentTool

    if (tool === 'pan') {
      return
    }

    handleDrag(e)
  })

  const dragEndId = app.on_(DragEvent.END, () => {
    const tool = store.currentTool

    if (tool === 'pan') {
      return
    }

    handleDragEnd()
  })

  const tapId = app.on_(PointerEvent.TAP, (e: PointerEvent) => {
    handleTap(e)
  })

  function buildShortcutMap() {
    const shortcutMap = new Map<string, ToolType>()
    const plugins = pluginRegistry.getAll()

    for (const plugin of plugins) {
      if (plugin.shortcut) {
        const parsed = parseShortcut(plugin.shortcut)
        if (parsed) {
          const shortcutKey = buildShortcutKey(parsed)
          shortcutMap.set(shortcutKey, plugin.type as ToolType)
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

    for (const [shortcutKey, toolType] of shortcutMap.value.entries()) {
      const parsed = parseShortcut(shortcutKey)
      if (parsed && matchShortcut(e, parsed)) {
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
    store.setZoom(app.tree.scale as number)
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
