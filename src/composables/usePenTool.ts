/**
 * Pen tool composable for freehand drawing on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Pen } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export function usePenTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  penPathPoints: Ref<Array<Point>>
) {
  function handleMouseDown() {
    if (!tree || !startPoint.value) return

    const pen = new Pen()
    pen.setStyle({
      stroke: store.strokeColor,
      strokeWidth: store.strokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round',
    })
    pen.editable = true

    currentElement.value = pen
    tree.add(pen)
  }

  function updateDrawing(e: DragEvent) {
    if (!currentElement.value || !penPathPoints.value.length) return

    const pen = currentElement.value
    if (!(pen instanceof Pen)) return

    const point = e.getPagePoint()
    if (!point) return

    const currentPoint = { x: point.x, y: point.y }
    const points = penPathPoints.value
    const lastPoint = points[points.length - 1]

    if (lastPoint) {
      const dx = currentPoint.x - lastPoint.x
      const dy = currentPoint.y - lastPoint.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 0.5) return
    }

    penPathPoints.value.push(currentPoint)

    const updatedPoints = penPathPoints.value
    if (updatedPoints.length < 2) return

    pen.drawPoints(updatedPoints, true)
  }

  function finishDrawing() {
    if (!currentElement.value || !penPathPoints.value.length) return

    const pen = currentElement.value
    if (!(pen instanceof Pen)) return

    pen.fill = 'transparent'

    const id = `pen-${Date.now()}`
    store.addObject({
      id,
      type: 'pen',
      element: pen,
    })

    store.setTool('select')
    store.selectObject(id)
  }

  return {
    handleMouseDown,
    updateDrawing,
    finishDrawing,
  }
}
