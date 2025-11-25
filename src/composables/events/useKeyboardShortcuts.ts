/**
 * Composable for handling keyboard shortcuts and keyboard events
 */

import { useThrottleFn } from '@vueuse/core'
import type { App } from 'leafer-ui'
import { KeyEvent, ZoomEvent } from 'leafer-ui'
import { ref } from 'vue'
import { TIMING, TOOL_TYPES } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import { useZoomTool } from '@/plugins/composables/useZoomTool'
import { pluginEventBus } from '@/plugins/events'
import { pluginRegistry } from '@/plugins/registry'
import { parseShortcut } from '@/plugins/shortcut'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'
import { isValidToolType } from '@/types'
import { errorHandler } from '@/utils/errorHandler'

export function useKeyboardShortcuts(
  app: App,
  createToolInstanceForPlugin: (pluginId: string) => Promise<ToolInstance | null>,
  elementPopover?: ReturnType<typeof import('../state/useElementPopover').useElementPopover>
) {
  const store = useCanvasStore()
  const { zoomIn, zoomOut } = useZoomTool(elementPopover)
  const { undo, redo } = useHistory()

  const throttledEmitCanvasZoom = useThrottleFn((payload: { zoom: number }) => {
    pluginEventBus.emit('canvas:zoom', payload)
  }, TIMING.CANVAS_ZOOM_THROTTLE)

  function buildShortcutMap() {
    const shortcutMap = new Map<
      string,
      { pluginId: string; toolType: ToolType | 'zoomIn' | 'zoomOut' | 'undo' | 'redo' }
    >()
    const pluginsMetadata = pluginRegistry.getAllPluginMetadata()

    for (const metadata of pluginsMetadata) {
      if (metadata.shortcut) {
        const parsed = parseShortcut(metadata.shortcut)
        if (parsed) {
          const shortcutKey = buildShortcutKey(parsed)
          if (metadata.type === 'zoomIn' || metadata.type === 'zoomOut') {
            shortcutMap.set(shortcutKey, {
              pluginId: metadata.id,
              toolType: metadata.type as 'zoomIn' | 'zoomOut',
            })
          } else if (metadata.type === 'undo' || metadata.type === 'redo') {
            shortcutMap.set(shortcutKey, {
              pluginId: metadata.id,
              toolType: metadata.type as 'undo' | 'redo',
            })
          } else if (isValidToolType(metadata.type)) {
            shortcutMap.set(shortcutKey, {
              pluginId: metadata.id,
              toolType: metadata.type,
            })
          }
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

  async function handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space') {
      store.enablePanWithSpace()
      return
    }

    try {
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

          if (toolType === 'undo') {
            undo()
            return
          }

          if (toolType === 'redo') {
            redo()
            return
          }

          try {
            const plugin = await pluginRegistry.get(pluginId)
            if (plugin && (plugin.id === 'export' || plugin.id === 'exportJson')) {
              const toolInstance = await createToolInstanceForPlugin(pluginId)
              if (toolInstance?.onActivate) {
                toolInstance.onActivate()
              }
              return
            }

            if (
              isValidToolType(toolType) &&
              (toolType !== TOOL_TYPES.PAN || !store.isPanningWithSpace)
            ) {
              store.setTool(toolType)
            }
          } catch (error) {
            errorHandler.handleRuntimeError(
              `Failed to handle keyboard shortcut`,
              error instanceof Error ? error : undefined,
              { shortcut: shortcutKey, pluginId, toolType, operation: 'handleKeyDown' }
            )
          }
          break
        }
      }
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to process keyboard shortcut`,
        error instanceof Error ? error : undefined,
        { operation: 'handleKeyDown' }
      )
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
    throttledEmitCanvasZoom({ zoom })
    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
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
