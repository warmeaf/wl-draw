/**
 * Composable for handling keyboard shortcuts and keyboard events
 */

import type { App } from 'leafer-ui'
import { KeyEvent, ZoomEvent } from 'leafer-ui'
import { ref } from 'vue'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import { parseShortcut } from '@/plugins/shortcut'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'

export function useKeyboardShortcuts(
  app: App,
  createToolInstanceForPlugin: (pluginId: string) => ToolInstance | null
) {
  const store = useCanvasStore()
  const { zoomIn, zoomOut } = useZoomTool()

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

  function handleKeyDown(e: KeyboardEvent) {
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
          const toolInstance = createToolInstanceForPlugin(pluginId)
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
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      store.disablePanWithSpace()
    }
  }

  function handleZoom(_e: ZoomEvent) {
    const zoom = app.tree.scale as number
    store.setZoom(zoom)
    pluginEventBus.emit('canvas:zoom', { zoom })
  }

  const keyDownId = app.on_(KeyEvent.DOWN, handleKeyDown)
  const keyUpId = app.on_(KeyEvent.UP, handleKeyUp)
  const zoomId = app.on_(ZoomEvent.ZOOM, handleZoom)

  function cleanup() {
    app.off_(keyDownId)
    app.off_(keyUpId)
    app.off_(zoomId)
  }

  return {
    cleanup,
  }
}
