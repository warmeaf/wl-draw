/**
 * Rectangle tool composable for drawing rectangles on canvas
 */
import { Rect } from 'leafer-ui'
import type { Ref } from 'vue'
import type { useCanvasStore } from '@/stores/canvas'
import type { Point, Tree, LeaferElement } from './types'

export function useRectTool(
  tree: Tree,
  store: ReturnType<typeof useCanvasStore>,
  isDrawing: Ref<boolean>,
  startPoint: Ref<Point | null>,
  currentElement: Ref<LeaferElement>,
  isShiftPressed: Ref<boolean>
) {
  function handleMouseDown(point: Point) {
    if (!tree) return

    isDrawing.value = true
    startPoint.value = point

    const rect = new Rect({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
      fill: store.fillColor,
      strokeWidth: 0,
      editable: true,
    })

    currentElement.value = rect
    tree.add(rect)
  }

  function updateDrawing(bounds: { x: number; y: number; width: number; height: number }) {
    if (!currentElement.value || !startPoint.value) return

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

    const rect = currentElement.value
    if (!(rect instanceof Rect)) return

    const width = rect.width ?? 0
    const height = rect.height ?? 0
    const x = rect.x ?? 0
    const y = rect.y ?? 0

    if (width < 0) {
      rect.x = x + width
      rect.width = Math.abs(width)
    }
    if (height < 0) {
      rect.y = y + height
      rect.height = Math.abs(height)
    }

    const finalWidth = rect.width ?? 0
    const finalHeight = rect.height ?? 0

    if (finalWidth < 5 || finalHeight < 5) {
      tree.remove(rect)
      currentElement.value = null
      return
    }

    const id = `rect-${Date.now()}`
    store.addObject({
      id,
      type: 'rect',
      element: rect,
    })

    rect.draggable = true
    currentElement.value = null
    store.setTool('select')
    store.selectObject(id)
  }

  return {
    handleMouseDown,
    updateDrawing,
    finishDrawing,
  }
}
