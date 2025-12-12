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
import { matchShortcut, type ParsedShortcut, parseShortcut } from '@/plugins/shortcut'
import type { ToolInstance } from '@/plugins/types'
import { useCanvasStore } from '@/stores/canvas'
import type { ToolType } from '@/types'
import { isValidToolType } from '@/types'
import { errorHandler } from '@/utils/errorHandler'

const SPACE_KEY_CODE = 'Space'
const EXPORT_PLUGIN_IDS = ['export', 'exportJson'] as const

type ShortcutActionType = ToolType | 'zoomIn' | 'zoomOut' | 'undo' | 'redo'
type ShortcutMapping = Map<string, { pluginId: string; toolType: ShortcutActionType }>

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

  function buildShortcutKeyString(parsedShortcut: ParsedShortcut): string {
    const modifierKeys: string[] = []
    if (parsedShortcut.ctrl) modifierKeys.push('Ctrl')
    if (parsedShortcut.shift) modifierKeys.push('Shift')
    if (parsedShortcut.alt) modifierKeys.push('Alt')
    if (parsedShortcut.meta) modifierKeys.push('Meta')
    return modifierKeys.length > 0
      ? `${modifierKeys.join('+')}+${parsedShortcut.key}`
      : parsedShortcut.key
  }

  function isZoomAction(pluginType: string): pluginType is 'zoomIn' | 'zoomOut' {
    return pluginType === 'zoomIn' || pluginType === 'zoomOut'
  }

  function isHistoryAction(pluginType: string): pluginType is 'undo' | 'redo' {
    return pluginType === 'undo' || pluginType === 'redo'
  }

  function createShortcutMapping(): ShortcutMapping {
    const shortcutMapping = new Map<string, { pluginId: string; toolType: ShortcutActionType }>()
    const pluginsMetadata = pluginRegistry.getAllPluginMetadata()

    for (const metadata of pluginsMetadata) {
      if (!metadata.shortcut) continue

      const parsedShortcut = parseShortcut(metadata.shortcut)
      if (!parsedShortcut) continue

      const shortcutKeyString = buildShortcutKeyString(parsedShortcut)
      const shortcutEntry = {
        pluginId: metadata.id,
        toolType: metadata.type as ShortcutActionType,
      }

      if (isZoomAction(metadata.type)) {
        shortcutMapping.set(shortcutKeyString, shortcutEntry)
      } else if (isHistoryAction(metadata.type)) {
        shortcutMapping.set(shortcutKeyString, shortcutEntry)
      } else if (isValidToolType(metadata.type)) {
        shortcutMapping.set(shortcutKeyString, shortcutEntry)
      }
    }

    return shortcutMapping
  }

  const shortcutMapping = ref(createShortcutMapping())

  function handleSpaceKeyDown() {
    store.enablePanWithSpace()
  }

  function handleSpaceKeyUp() {
    store.disablePanWithSpace()
  }

  function handleZoomAction(toolType: 'zoomIn' | 'zoomOut'): boolean {
    if (toolType === 'zoomIn') {
      zoomIn()
      return true
    }
    if (toolType === 'zoomOut') {
      zoomOut()
      return true
    }
    return false
  }

  function handleHistoryAction(toolType: 'undo' | 'redo'): boolean {
    if (toolType === 'undo') {
      undo()
      return true
    }
    if (toolType === 'redo') {
      redo()
      return true
    }
    return false
  }

  async function handleExportPluginAction(pluginId: string): Promise<boolean> {
    try {
      const plugin = await pluginRegistry.get(pluginId)
      const isExportPlugin =
        plugin && EXPORT_PLUGIN_IDS.includes(plugin.id as (typeof EXPORT_PLUGIN_IDS)[number])

      if (!isExportPlugin) {
        return false
      }

      const toolInstance = await createToolInstanceForPlugin(pluginId)
      if (toolInstance?.onActivate) {
        toolInstance.onActivate()
      }
      return true
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to handle export plugin action`,
        error instanceof Error ? error : undefined,
        { pluginId, operation: 'handleExportPluginAction' }
      )
      return false
    }
  }

  function handleToolSwitchAction(toolType: ShortcutActionType): boolean {
    if (!isValidToolType(toolType)) {
      return false
    }

    const isPanTool = toolType === TOOL_TYPES.PAN
    const shouldPreventPanSwitch = isPanTool && store.isPanningWithSpace
    if (shouldPreventPanSwitch) {
      return false
    }

    store.setTool(toolType)
    return true
  }

  async function processMatchedShortcut(
    pluginId: string,
    toolType: ShortcutActionType
  ): Promise<boolean> {
    if (isZoomAction(toolType)) {
      return handleZoomAction(toolType)
    }

    if (isHistoryAction(toolType)) {
      return handleHistoryAction(toolType)
    }

    const handledExport = await handleExportPluginAction(pluginId)
    if (handledExport) {
      return true
    }

    return handleToolSwitchAction(toolType)
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if (event.code === SPACE_KEY_CODE) {
      handleSpaceKeyDown()
      return
    }

    try {
      for (const [shortcutKeyString, { pluginId, toolType }] of shortcutMapping.value.entries()) {
        const parsedShortcut = parseShortcut(shortcutKeyString)
        if (!parsedShortcut) continue

        const isShortcutMatch = matchShortcut(event, parsedShortcut)
        if (!isShortcutMatch) continue

        try {
          const wasHandled = await processMatchedShortcut(pluginId, toolType)
          if (wasHandled) {
            return
          }
        } catch (error) {
          errorHandler.handleRuntimeError(
            `Failed to handle keyboard shortcut`,
            error instanceof Error ? error : undefined,
            { shortcut: shortcutKeyString, pluginId, toolType, operation: 'handleKeyDown' }
          )
        }
        break
      }
    } catch (error) {
      errorHandler.handleRuntimeError(
        `Failed to process keyboard shortcut`,
        error instanceof Error ? error : undefined,
        { operation: 'handleKeyDown' }
      )
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.code === SPACE_KEY_CODE) {
      handleSpaceKeyUp()
    }
  }

  function handleZoom(_event: ZoomEvent) {
    const currentZoom = app.tree.scale as number
    store.setZoom(currentZoom)
    throttledEmitCanvasZoom({ zoom: currentZoom })

    if (elementPopover?.showPopover.value) {
      elementPopover.hidePopover()
    }
  }

  const keyDownEventId = app.on_(KeyEvent.DOWN, handleKeyDown)
  const keyUpEventId = app.on_(KeyEvent.UP, handleKeyUp)
  const zoomEventId = app.on_(ZoomEvent.ZOOM, handleZoom)

  function cleanup() {
    app.off_(keyDownEventId)
    app.off_(keyUpEventId)
    app.off_(zoomEventId)
  }

  return {
    cleanup,
  }
}
