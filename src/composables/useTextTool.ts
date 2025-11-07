/**
 * Text tool composable for adding text elements on canvas
 */
import { Text } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'
import { themeColors } from '@/config/theme'
import type { Point, Tree } from './types'

export function useTextTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function handleMouseDown(point: Point) {
    if (!tree) return

    const text = new Text({
      x: point.x,
      y: point.y,
      text: '文本',
      fontSize: store.fontSize || 16,
      fill: store.textColor || themeColors.text,
      editable: true,
    })

    tree.add(text)

    const id = `text-${Date.now()}`
    store.addObject({
      id,
      type: 'text',
      element: text,
    })

    text.draggable = true
    store.setTool('select')
    store.selectObject(id)
  }

  return {
    handleMouseDown,
  }
}
