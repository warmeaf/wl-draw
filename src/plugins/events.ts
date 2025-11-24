/**
 * Plugin event bus system for inter-plugin and plugin-core communication
 * Uses VueUse's useEventBus for Vue 3 integration and automatic cleanup
 */

import { useEventBus } from '@vueuse/core'
import type { LeaferElement } from '@/types'
import { errorHandler } from '@/utils/errorHandler'

type CanvasObjectType = 'rect' | 'circle' | 'line' | 'arrow' | 'pen' | 'text' | 'image'

export interface PluginEventMap {
  /**
   * Emitted when a plugin is activated.
   *
   * Triggered: When a tool plugin becomes the active tool through tool switching
   * Payload: { pluginId: string; toolType: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('plugin:activated', ({ pluginId, toolType }) => {
   *   console.log(`Plugin ${pluginId} (${toolType}) activated`)
   * })
   * ```
   */
  'plugin:activated': { pluginId: string; toolType: string }

  /**
   * Emitted when a plugin is deactivated.
   *
   * Triggered: When a tool plugin is switched away from
   * Payload: { pluginId: string; toolType: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('plugin:deactivated', ({ pluginId, toolType }) => {
   *   console.log(`Plugin ${pluginId} (${toolType}) deactivated`)
   * })
   * ```
   */
  'plugin:deactivated': { pluginId: string; toolType: string }

  /**
   * Emitted when a tool is switched.
   *
   * Triggered: When the active tool changes from one to another
   * Payload: { from: string; to: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('tool:switched', ({ from, to }) => {
   *   console.log(`Tool switched from ${from} to ${to}`)
   * })
   * ```
   */
  'tool:switched': { from: string; to: string }

  /**
   * Emitted when a drawing object is created.
   *
   * Triggered: When a new drawing object (rect, circle, line, etc.) is created on the canvas
   * Payload: { id: string; type: CanvasObject['type']; element: LeaferElement }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('object:created', ({ id, type, element }) => {
   *   console.log(`Object ${id} of type ${type} created`)
   * })
   * ```
   */
  'object:created': { id: string; type: CanvasObjectType; element: LeaferElement }

  /**
   * Emitted when a drawing object is deleted.
   *
   * Triggered: When a drawing object is removed from the canvas
   * Payload: { id: string; type: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('object:deleted', ({ id, type }) => {
   *   console.log(`Object ${id} of type ${type} deleted`)
   * })
   * ```
   */
  'object:deleted': { id: string; type: CanvasObjectType }

  /**
   * Emitted when a drawing object is selected.
   *
   * Triggered: When a drawing object is selected by the user
   * Payload: { id: string; type: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('object:selected', ({ id, type }) => {
   *   console.log(`Object ${id} of type ${type} selected`)
   * })
   * ```
   */
  'object:selected': { id: string; type: CanvasObjectType }

  /**
   * Emitted when a drawing object is modified.
   *
   * Triggered: When properties of a drawing object are changed (position, size, style, etc.)
   * Payload: { id: string; type: CanvasObject['type']; changes: Record<string, unknown> }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('object:modified', ({ id, type, changes }) => {
   *   console.log(`Object ${id} of type ${type} modified:`, changes)
   * })
   * ```
   */
  'object:modified': { id: string; type: CanvasObjectType; changes: Record<string, unknown> }

  /**
   * Emitted when the canvas zoom level changes.
   *
   * Triggered: When the user zooms in or out on the canvas
   * Payload: { zoom: number }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('canvas:zoom', ({ zoom }) => {
   *   console.log(`Canvas zoom changed to ${zoom}`)
   * })
   * ```
   */
  'canvas:zoom': { zoom: number }

  /**
   * Emitted when the canvas is panned.
   *
   * Triggered: When the canvas viewport is moved
   * Payload: { x: number; y: number }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('canvas:pan', ({ x, y }) => {
   *   console.log(`Canvas panned to (${x}, ${y})`)
   * })
   * ```
   */
  'canvas:pan': { x: number; y: number }

  /**
   * Emitted when drawing starts.
   *
   * Triggered: When the user starts drawing with a drawing tool (mouse down)
   * Payload: { toolType: string; point: { x: number; y: number } }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('drawing:start', ({ toolType, point }) => {
   *   console.log(`Drawing started with ${toolType} at (${point.x}, ${point.y})`)
   * })
   * ```
   */
  'drawing:start': { toolType: string; point: { x: number; y: number } }

  /**
   * Emitted during drawing updates.
   *
   * Triggered: When the user drags while drawing (mouse move during draw)
   * Payload: { toolType: string; bounds: { x: number; y: number; width: number; height: number } }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('drawing:update', ({ toolType, bounds }) => {
   *   console.log(`Drawing updated with ${toolType}:`, bounds)
   * })
   * ```
   */
  'drawing:update': {
    toolType: string
    bounds: { x: number; y: number; width: number; height: number }
  }

  /**
   * Emitted when drawing finishes.
   *
   * Triggered: When the user completes a drawing operation (mouse up)
   * Payload: { toolType: string; objectId: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('drawing:finish', ({ toolType, objectId }) => {
   *   console.log(`Drawing finished with ${toolType}, object ID: ${objectId}`)
   * })
   * ```
   */
  'drawing:finish': { toolType: string; objectId: string }

  /**
   * Emitted when a keyboard shortcut is triggered.
   *
   * Triggered: When a plugin shortcut key combination is pressed
   * Payload: { shortcut: string; toolType: string }
   *
   * @example
   * ```typescript
   * pluginEventBus.on('shortcut:triggered', ({ shortcut, toolType }) => {
   *   console.log(`Shortcut ${shortcut} triggered for tool ${toolType}`)
   * })
   * ```
   */
  'shortcut:triggered': { shortcut: string; toolType: string }
}

type EventKey = keyof PluginEventMap
type EventHandler<T extends EventKey> = (payload: PluginEventMap[T]) => void

const pluginActivatedBus = useEventBus<PluginEventMap['plugin:activated']>('plugin:activated')
const pluginDeactivatedBus = useEventBus<PluginEventMap['plugin:deactivated']>('plugin:deactivated')
const toolSwitchedBus = useEventBus<PluginEventMap['tool:switched']>('tool:switched')
const objectCreatedBus = useEventBus<PluginEventMap['object:created']>('object:created')
const objectDeletedBus = useEventBus<PluginEventMap['object:deleted']>('object:deleted')
const objectSelectedBus = useEventBus<PluginEventMap['object:selected']>('object:selected')
const objectModifiedBus = useEventBus<PluginEventMap['object:modified']>('object:modified')
const canvasZoomBus = useEventBus<PluginEventMap['canvas:zoom']>('canvas:zoom')
const canvasPanBus = useEventBus<PluginEventMap['canvas:pan']>('canvas:pan')
const drawingStartBus = useEventBus<PluginEventMap['drawing:start']>('drawing:start')
const drawingUpdateBus = useEventBus<PluginEventMap['drawing:update']>('drawing:update')
const drawingFinishBus = useEventBus<PluginEventMap['drawing:finish']>('drawing:finish')
const shortcutTriggeredBus = useEventBus<PluginEventMap['shortcut:triggered']>('shortcut:triggered')

// biome-ignore lint/suspicious/noExplicitAny: Internal implementation detail, external API is type-safe
const busMap: Record<EventKey, ReturnType<typeof useEventBus<any>>> = {
  'plugin:activated': pluginActivatedBus,
  'plugin:deactivated': pluginDeactivatedBus,
  'tool:switched': toolSwitchedBus,
  'object:created': objectCreatedBus,
  'object:deleted': objectDeletedBus,
  'object:selected': objectSelectedBus,
  'object:modified': objectModifiedBus,
  'canvas:zoom': canvasZoomBus,
  'canvas:pan': canvasPanBus,
  'drawing:start': drawingStartBus,
  'drawing:update': drawingUpdateBus,
  'drawing:finish': drawingFinishBus,
  'shortcut:triggered': shortcutTriggeredBus,
  // biome-ignore lint/suspicious/noExplicitAny: Internal implementation detail, external API is type-safe
} as Record<EventKey, ReturnType<typeof useEventBus<any>>>

export class PluginEventBus {
  on<T extends EventKey>(event: T, handler: EventHandler<T>): () => void {
    const bus = busMap[event]
    const wrappedHandler = (payload: PluginEventMap[T]) => {
      try {
        handler(payload)
      } catch (error) {
        errorHandler.handleRuntimeError(
          `Event handler failed for "${event}"`,
          error instanceof Error ? error : undefined,
          { event, operation: 'emit' }
        )
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: Type-safe wrapper around useEventBus
    return bus.on(wrappedHandler as any)
  }

  off<T extends EventKey>(event: T, handler: EventHandler<T>): void {
    const bus = busMap[event]
    // biome-ignore lint/suspicious/noExplicitAny: Type-safe wrapper around useEventBus
    bus.off(handler as any)
  }

  emit<T extends EventKey>(event: T, payload: PluginEventMap[T]): void {
    const bus = busMap[event]
    // biome-ignore lint/suspicious/noExplicitAny: Type-safe wrapper around useEventBus
    bus.emit(payload as any)
  }

  once<T extends EventKey>(event: T, handler: EventHandler<T>): () => void {
    const bus = busMap[event]
    // biome-ignore lint/suspicious/noExplicitAny: Type-safe wrapper around useEventBus
    const unsubscribe = bus.on((payload: any) => {
      try {
        handler(payload)
      } catch (error) {
        errorHandler.handleRuntimeError(
          `Event handler failed for "${event}"`,
          error instanceof Error ? error : undefined,
          { event, operation: 'emit' }
        )
      } finally {
        unsubscribe()
      }
    })
    return unsubscribe
  }
}

export const pluginEventBus = new PluginEventBus()

/**
 * Plugin event subscription manager for automatic cleanup
 * Tracks event subscriptions per plugin and provides cleanup on plugin uninstall
 */
export class PluginEventManager {
  private subscriptions = new Map<string, Array<() => void>>()

  /**
   * Subscribe to an event and track the subscription for a plugin
   *
   * @param pluginId - The ID of the plugin subscribing to the event
   * @param unsubscribe - The unsubscribe function returned from eventBus.on()
   */
  subscribe(pluginId: string, unsubscribe: () => void): void {
    if (!this.subscriptions.has(pluginId)) {
      this.subscriptions.set(pluginId, [])
    }
    this.subscriptions.get(pluginId)?.push(unsubscribe)
  }

  /**
   * Unsubscribe all events for a plugin
   *
   * @param pluginId - The ID of the plugin to unsubscribe
   */
  unsubscribeAll(pluginId: string): void {
    const unsubscribes = this.subscriptions.get(pluginId)
    if (unsubscribes) {
      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }
      this.subscriptions.delete(pluginId)
    }
  }

  /**
   * Get all plugin IDs that have active subscriptions
   */
  getSubscribedPlugins(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * Clear all subscriptions (use with caution)
   */
  clear(): void {
    for (const unsubscribes of this.subscriptions.values()) {
      for (const unsubscribe of unsubscribes) {
        unsubscribe()
      }
    }
    this.subscriptions.clear()
  }
}

export const pluginEventManager = new PluginEventManager()
