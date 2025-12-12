/**
 * Circle tool composable for drawing circles and ellipses on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Ellipse } from 'leafer-ui'
import type { Ref } from 'vue'
import { TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

const MINIMUM_ELLIPSE_SIZE = 5
const DEFAULT_STROKE_COLOR = '#000000'
const DEFAULT_STROKE_WIDTH = 0

export function useCircleTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const initialEllipse = new Ellipse({
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

    currentElement.value = initialEllipse
    tree.add(initialEllipse)
  }

  function calculateSquareDimensions(
    width: number,
    height: number
  ): { width: number; height: number } {
    const maxDimension = Math.max(Math.abs(width), Math.abs(height))
    const widthSign = width < 0 ? -1 : 1
    const heightSign = height < 0 ? -1 : 1
    return {
      width: widthSign * maxDimension,
      height: heightSign * maxDimension,
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

  function normalizeNegativeDimensions(ellipse: Ellipse) {
    const currentWidth = ellipse.width ?? 0
    const currentHeight = ellipse.height ?? 0
    const currentX = ellipse.x ?? 0
    const currentY = ellipse.y ?? 0

    if (currentWidth < 0) {
      ellipse.x = currentX + currentWidth
      ellipse.width = Math.abs(currentWidth)
    }
    if (currentHeight < 0) {
      ellipse.y = currentY + currentHeight
      ellipse.height = Math.abs(currentHeight)
    }
  }

  function removeElementIfTooSmall(ellipse: Ellipse): boolean {
    const finalWidth = ellipse.width ?? 0
    const finalHeight = ellipse.height ?? 0
    const isTooSmall = finalWidth < MINIMUM_ELLIPSE_SIZE || finalHeight < MINIMUM_ELLIPSE_SIZE

    if (isTooSmall) {
      tree.remove(ellipse)
      currentElement.value = null
      return true
    }
    return false
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const ellipse = currentElement.value
    if (!(ellipse instanceof Ellipse)) return

    normalizeNegativeDimensions(ellipse)

    if (removeElementIfTooSmall(ellipse)) {
      return
    }

    const circleId = `circle-${Date.now()}`
    store.addObject({
      id: circleId,
      type: 'circle',
      element: ellipse,
    })

    store.setTool(TOOL_TYPES.SELECT)
    store.selectObject(circleId)
  }

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
  }
}
