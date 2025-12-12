/**
 * Arrow tool composable for drawing arrows on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Line } from 'leafer-ui'
import type { Ref } from 'vue'
import { TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

const ANGLE_SNAP_INTERVAL = Math.PI / 4

export function useArrowTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const initialX = startPoint.value.x
    const initialY = startPoint.value.y

    const arrowLine = new Line({
      points: [initialX, initialY, initialX, initialY],
      stroke: store.strokeColor,
      strokeWidth: store.strokeWidth,
      dashPattern: undefined,
      startArrow: 'none',
      endArrow: 'arrow',
      editable: true,
    })

    currentElement.value = arrowLine
    tree.add(arrowLine)
  }

  function calculateSnappedEndPoint(
    startX: number,
    startY: number,
    currentX: number,
    currentY: number
  ): { x: number; y: number } {
    const deltaX = currentX - startX
    const deltaY = currentY - startY
    const absoluteDeltaX = Math.abs(deltaX)
    const absoluteDeltaY = Math.abs(deltaY)

    const isHorizontalDominant = absoluteDeltaX > absoluteDeltaY
    const isVerticalDominant = absoluteDeltaY > absoluteDeltaX

    if (isHorizontalDominant) {
      return { x: currentX, y: startY }
    }
    if (isVerticalDominant) {
      return { x: startX, y: currentY }
    }

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const currentAngle = Math.atan2(deltaY, deltaX)
    const snappedAngle = Math.round(currentAngle / ANGLE_SNAP_INTERVAL) * ANGLE_SNAP_INTERVAL
    return {
      x: startX + distance * Math.cos(snappedAngle),
      y: startY + distance * Math.sin(snappedAngle),
    }
  }

  function updateDrawing(dragEvent: DragEvent) {
    if (!currentElement.value || !startPoint.value) return

    const arrowLine = currentElement.value
    if (!(arrowLine instanceof Line)) return

    const currentPoint = dragEvent.getPagePoint()
    if (!currentPoint) return

    const startX = startPoint.value.x
    const startY = startPoint.value.y
    let endX = currentPoint.x
    let endY = currentPoint.y

    if (isShiftPressed.value) {
      const snappedPoint = calculateSnappedEndPoint(startX, startY, currentPoint.x, currentPoint.y)
      endX = snappedPoint.x
      endY = snappedPoint.y
    }

    arrowLine.points = [startX, startY, endX, endY]
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const arrow = currentElement.value
    if (!(arrow instanceof Line)) return

    const arrowId = `arrow-${Date.now()}`
    store.addObject({
      id: arrowId,
      type: 'arrow',
      element: arrow,
    })

    store.setTool(TOOL_TYPES.SELECT)
    store.selectObject(arrowId)
  }

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
  }
}
