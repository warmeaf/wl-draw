/**
 * Plugin system type definitions for tool plugins
 */

import type { DragEvent, PointerEvent } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export type PluginCategory = 'drawing' | 'selection' | 'utility'

export interface ToolContext {
  tree: Tree
  store: ReturnType<typeof useCanvasStore>
  isDrawing: Ref<boolean>
  startPoint: Ref<Point | null>
  currentElement: Ref<LeaferElement>
  isShiftPressed: Ref<boolean>
  penPathPoints?: Ref<Array<Point>>
}

export interface ToolInstance {
  handleMouseDown?: () => void
  updateDrawing?: (e: DragEvent) => void
  finishDrawing?: () => void
  handleTap?: (e: PointerEvent) => void
  onActivate?: () => void
  onDeactivate?: () => void
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
  category?: PluginCategory
  ui?: ToolPluginUI
  createTool: (context: ToolContext) => ToolInstance
}

export interface DrawingTool {
  handleMouseDown: (point: Point) => void
  updateDrawing?: (e: DragEvent) => void
  finishDrawing?: () => void
}

export interface PanTool {
  handleDragStart: (e: DragEvent) => void
  handleDrag: (e: DragEvent) => void
  handleDragEnd: () => void
}
