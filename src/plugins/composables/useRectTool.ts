/**
 * Rectangle tool composable for drawing rectangles on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Rect } from 'leafer-ui'
import type { Ref } from 'vue'
import { TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

const MINIMUM_RECT_SIZE = 5
const DEFAULT_STROKE_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 0

export function useRectTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const initialRect = new Rect({
      x: startPoint.value.x,
      y: startPoint.value.y,
      width: 0,
      height: 0,
      fill: store.fillColor,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      stroke: DEFAULT_STROKE_COLOR,
      dashPattern: undefined,
      editable: true,
    })

    currentElement.value = initialRect
    tree.add(initialRect)
  }

  function calculateSquareDimensions(
    width: number,
    height: number
  ): { width: number; height: number } {
    const maxDimension = Math.max(Math.abs(width), Math.abs(height))
    return {
      width: width < 0 ? -maxDimension : maxDimension,
      height: height < 0 ? -maxDimension : maxDimension,
    }
  }

  function updateDrawing(dragEvent: DragEvent) {
    if (!currentElement.value || !startPoint.value) return

    const dragBounds = dragEvent.getPageBounds()
    let adjustedWidth = dragBounds.width
    let adjustedHeight = dragBounds.height

    if (isShiftPressed.value) {
      const squareDimensions = calculateSquareDimensions(adjustedWidth, adjustedHeight)
      adjustedWidth = squareDimensions.width
      adjustedHeight = squareDimensions.height
    }

    currentElement.value.set({
      x: dragBounds.x,
      y: dragBounds.y,
      width: Math.abs(adjustedWidth),
      height: Math.abs(adjustedHeight),
    })
  }

  function normalizeNegativeDimensions(rect: Rect) {
    const currentWidth = rect.width ?? 0
    const currentHeight = rect.height ?? 0
    const currentX = rect.x ?? 0
    const currentY = rect.y ?? 0

    if (currentWidth < 0) {
      rect.x = currentX + currentWidth
      rect.width = Math.abs(currentWidth)
    }
    if (currentHeight < 0) {
      rect.y = currentY + currentHeight
      rect.height = Math.abs(currentHeight)
    }
  }

  function removeElementIfTooSmall(rect: Rect): boolean {
    const finalWidth = rect.width ?? 0
    const finalHeight = rect.height ?? 0
    const isTooSmall = finalWidth < MINIMUM_RECT_SIZE || finalHeight < MINIMUM_RECT_SIZE

    if (isTooSmall) {
      tree.remove(rect)
      currentElement.value = null
      return true
    }
    return false
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const rect = currentElement.value
    if (!(rect instanceof Rect)) return

    normalizeNegativeDimensions(rect)

    if (removeElementIfTooSmall(rect)) {
      return
    }

    const rectId = `rect-${Date.now()}`
    store.addObject({
      id: rectId,
      type: 'rect',
      element: rect,
    })

    store.setTool(TOOL_TYPES.SELECT)
    store.selectObject(rectId)
  }

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
  }
}
