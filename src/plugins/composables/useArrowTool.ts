/**
 * Arrow tool composable for drawing arrows on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Line } from 'leafer-ui'
import type { Ref } from 'vue'
import { TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export function useArrowTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const arrowLine = new Line({
      points: [startPoint.value.x, startPoint.value.y, startPoint.value.x, startPoint.value.y],
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

  function updateDrawing(e: DragEvent) {
    if (!currentElement.value || !startPoint.value) return

    const arrowLine = currentElement.value
    if (!(arrowLine instanceof Line)) return

    const currentPoint = e.getPagePoint()
    if (!currentPoint) return

    let finalEndX = currentPoint.x
    let finalEndY = currentPoint.y

    if (isShiftPressed.value) {
      const dx = currentPoint.x - startPoint.value.x
      const dy = currentPoint.y - startPoint.value.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDx > absDy) {
        finalEndY = startPoint.value.y
      } else if (absDy > absDx) {
        finalEndX = startPoint.value.x
      } else {
        const distance = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4)
        finalEndX = startPoint.value.x + distance * Math.cos(snapAngle)
        finalEndY = startPoint.value.y + distance * Math.sin(snapAngle)
      }
    }

    arrowLine.points = [startPoint.value.x, startPoint.value.y, finalEndX, finalEndY]
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const arrow = currentElement.value
    if (!(arrow instanceof Line)) return

    const id = `arrow-${Date.now()}`
    store.addObject({
      id,
      type: 'arrow',
      element: arrow,
    })

    store.setTool(TOOL_TYPES.SELECT)
    store.selectObject(id)
  }

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
  }
}
