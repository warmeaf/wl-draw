/**
 * Text tool composable for adding text elements on canvas
 */

import type { PointerEvent } from 'leafer-ui'
import { Text } from 'leafer-ui'
import { TOOL_TYPES } from '@/constants'
import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from '@/types'

export function useTextTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function handleTap(e: PointerEvent) {
    if (!tree) return
    const point = e.getPagePoint()

    const text = new Text({
      x: point.x,
      y: point.y,
      text: '双击编辑文本',
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

    store.setTool(TOOL_TYPES.SELECT)
    store.selectObject(id)
  }

  return {
    handleTap,
  }
}
