/**
 * Line tool composable for drawing straight lines on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Path } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export function useLineTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function handleMouseDown() {
    if (!tree || !startPoint.value) return

    const linePath = new Path({
      path: `M ${startPoint.value.x} ${startPoint.value.y} L ${startPoint.value.x} ${startPoint.value.y}`,
      stroke: store.strokeColor,
      strokeWidth: store.strokeWidth,
      editable: true,
    })

    currentElement.value = linePath
    tree.add(linePath)
  }

  function updateDrawing(e: DragEvent) {
    if (!currentElement.value || !startPoint.value) return

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

    currentElement.value.path = `M ${startPoint.value.x} ${startPoint.value.y} L ${finalEndX} ${finalEndY}`
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const line = currentElement.value
    const id = `line-${Date.now()}`
    store.addObject({
      id,
      type: 'line',
      element: line,
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
