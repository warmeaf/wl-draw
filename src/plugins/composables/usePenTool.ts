/**
 * Pen tool composable for freehand drawing on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Line } from 'leafer-ui'
import type { Ref } from 'vue'
import { THRESHOLDS, TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export function usePenTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  penPathPoints: Ref<Array<Point>>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const line = new Line({
      points: [startPoint.value.x, startPoint.value.y, startPoint.value.x, startPoint.value.y],
      stroke: store.strokeColor,
      strokeWidth: store.strokeWidth,
      dashPattern: undefined,
      strokeCap: 'round',
      strokeJoin: 'round',
      curve: true,
      editable: true,
    })

    currentElement.value = line
    tree.add(line)
  }

  function updateDrawing(e: DragEvent) {
    if (!currentElement.value || !penPathPoints.value.length) return

    const line = currentElement.value
    if (!(line instanceof Line)) return

    const point = e.getPagePoint()
    if (!point) return

    const currentPoint = { x: point.x, y: point.y }
    const points = penPathPoints.value
    const lastPoint = points[points.length - 1]

    // Filter out points that are too close together to reduce noise and improve performance
    // This prevents creating too many path segments for small movements
    if (lastPoint) {
      const dx = currentPoint.x - lastPoint.x
      const dy = currentPoint.y - lastPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < THRESHOLDS.PEN_POINT_MIN_DISTANCE) return
    }

    penPathPoints.value.push(currentPoint)

    const updatedPoints = penPathPoints.value
    if (updatedPoints.length < 2) return

    // Convert points array to flat format [x1, y1, x2, y2, ...]
    const flatPoints: number[] = []
    for (const p of updatedPoints) {
      flatPoints.push(p.x, p.y)
    }
    line.points = flatPoints
  }

  function finishDrawing() {
    if (!currentElement.value || !penPathPoints.value.length) return

    const line = currentElement.value
    if (!(line instanceof Line)) return

    const id = `pen-${Date.now()}`
    store.addObject({
      id,
      type: 'pen',
      element: line,
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
