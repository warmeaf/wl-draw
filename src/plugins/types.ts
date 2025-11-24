/**
 * Plugin system type definitions for tool plugins
 */

import type { DragEvent, PointerEvent } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'
import type { PluginEventBus } from './events'

export type PluginCategory = 'drawing' | 'selection' | 'utility'

export interface PluginMetadata {
  version: string
  description?: string
  author?: string
  dependencies?: string[]
  minCoreVersion?: string
}

export interface PluginCapabilities {
  requiresDrawMode?: boolean
  requiresNormalMode?: boolean
  handlesDragStart?: boolean
  handlesDrag?: boolean
  handlesDragEnd?: boolean
  handlesTap?: boolean
  enablesDrag?: boolean
}

export type HookHandler<T = unknown> = (context: T) => void | Promise<void>
export type HookInterceptor<T = unknown> = (context: T) => boolean | Promise<boolean>

export interface ToolSwitchContext {
  from: string
  to: string
}

export interface DrawingStartContext {
  toolType: string
  point: Point
}

export interface DrawingFinishContext {
  toolType: string
  objectId?: string
}

export interface PluginHooks {
  beforeToolSwitch?: HookInterceptor<ToolSwitchContext>
  afterToolSwitch?: HookHandler<ToolSwitchContext>
  beforeDrawingStart?: HookInterceptor<DrawingStartContext>
  afterDrawingStart?: HookHandler<DrawingStartContext>
  beforeDrawingFinish?: HookInterceptor<DrawingFinishContext>
  afterDrawingFinish?: HookHandler<DrawingFinishContext>
}

export interface ToolContext {
  tree: Tree
  store: ReturnType<typeof useCanvasStore>
  isDrawing: Ref<boolean>
  startPoint: Ref<Point | null>
  currentElement: Ref<LeaferElement>
  isShiftPressed: Ref<boolean>
  penPathPoints?: Ref<Array<Point>>
  eventBus: PluginEventBus
}

export interface ToolInstance {
  startDrawing?: () => void
  updateDrawing?: (e: DragEvent) => void
  finishDrawing?: () => void
  handleTap?: (e: PointerEvent) => void
  onActivate?: () => void
  onDeactivate?: () => void
  onDestroy?: () => void
}

export interface ToolPluginUI {
  label: string
  iconComponent: string
  dividerAfter?: boolean
}

export interface ToolPlugin {
  id: string
  name: string
  type: string
  metadata: PluginMetadata
  category?: PluginCategory
  capabilities?: PluginCapabilities
  ui?: ToolPluginUI
  shortcut?: string
  hooks?: PluginHooks
  onInstall?: () => void | Promise<void>
  onUninstall?: () => void | Promise<void>
  createTool: (context: ToolContext) => ToolInstance
}

export type LazyPluginLoader = () => Promise<ToolPlugin>

export type PluginDefinition = ToolPlugin | LazyPluginLoader

export interface PluginMetadataInfo {
  id: string
  name: string
  type: string
  metadata: PluginMetadata
  category?: PluginCategory
  ui?: ToolPluginUI
  shortcut?: string
}
