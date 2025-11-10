/**
 * Text tool composable for adding text elements on canvas
 */

import type { PointerEvent } from 'leafer-ui'
import { Text } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from '@/types'

export function useTextTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function handleTap(e: PointerEvent) {
    if (!tree) return
    const point = e.getPagePoint()

    const text = new Text({
      x: point.x,
      y: point.y,
      text: '文本',
      fontSize: store.fontSize,
      fill: store.textColor,
      editable: true,
    })

    tree.add(text)

    const id = `text-${Date.now()}`
    store.addObject({
      id,
      type: 'text',
      element: text,
    })

    store.setTool('select')
    store.selectObject(id)
  }

  return {
    handleTap,
  }
}
