/**
 * Circle tool composable for drawing circles and ellipses on canvas
 */

import type { DragEvent } from 'leafer-ui'
import { Ellipse } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { LeaferElement, Point, Tree } from '@/types'

export function useCircleTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function startDrawing() {
    if (!tree || !startPoint.value) return

    const ellipse = new Ellipse({
      x: startPoint.value.x,
      y: startPoint.value.y,
      width: 0,
      height: 0,
      fill: store.fillColor,
      strokeWidth: 0,
      editable: true,
    })

    currentElement.value = ellipse
    tree.add(ellipse)
  }

  function updateDrawing(e: DragEvent) {
    if (!currentElement.value || !startPoint.value) return
    const bounds = e.getPageBounds()

    let width = bounds.width
    let height = bounds.height

    if (isShiftPressed.value) {
      const size = Math.max(Math.abs(width), Math.abs(height))
      width = width < 0 ? -size : size
      height = height < 0 ? -size : size
    }

    currentElement.value.set({
      x: bounds.x,
      y: bounds.y,
      width: Math.abs(width),
      height: Math.abs(height),
    })
  }

  function finishDrawing() {
    if (!currentElement.value || !startPoint.value) return

    const ellipse = currentElement.value
    if (!(ellipse instanceof Ellipse)) return

    const width = ellipse.width ?? 0
    const height = ellipse.height ?? 0
    const x = ellipse.x ?? 0
    const y = ellipse.y ?? 0

    if (width < 0) {
      ellipse.x = x + width
      ellipse.width = Math.abs(width)
    }
    if (height < 0) {
      ellipse.y = y + height
      ellipse.height = Math.abs(height)
    }

    const finalWidth = ellipse.width ?? 0
    const finalHeight = ellipse.height ?? 0

    if (finalWidth < 5 || finalHeight < 5) {
      tree.remove(ellipse)
      currentElement.value = null
      return
    }

    const id = `circle-${Date.now()}`
    store.addObject({
      id,
      type: 'circle',
      element: ellipse,
    })

    store.setTool('select')
    store.selectObject(id)
  }

  return {
    startDrawing,
    updateDrawing,
    finishDrawing,
  }
}
