/**
 * Type definitions for the drawing application
 */

import type { App, DragEvent, Ellipse, Image, Line, Path, Pen, Rect, Text } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'

export interface Point {
  x: number
  y: number
}

export type Tree = App['tree']

export type LeaferElement = Rect | Ellipse | Path | Line | Pen | Text | Image | null

export interface ToolContext {
  tree: Tree
  store: ReturnType<typeof useCanvasStore>
  isDrawing: Ref<boolean>
  startPoint: Ref<Point | null>
  currentElement: Ref<LeaferElement>
  isShiftPressed: Ref<boolean>
}

export type ToolType =
  | 'select'
  | 'pan'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'image'

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
