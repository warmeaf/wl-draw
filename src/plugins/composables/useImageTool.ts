/**
 * Image tool composable for adding image elements on canvas
 */

import type { PointerEvent } from 'leafer-ui'
import { Image } from 'leafer-ui'
import { TOOL_TYPES } from '@/constants'
import { useHistory } from '@/plugins/composables/useHistory'
import type { useCanvasStore } from '@/stores/canvas'
import type { Tree } from '@/types'

export function useImageTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  const { addSnapshot } = useHistory()

  function handleTap(e: PointerEvent) {
    const point = e.getPagePoint()

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !tree) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        if (!url) return

        const img = new Image({
          x: point.x,
          y: point.y,
          url,
          editable: true,
        })

        tree.add(img)

        const id = `image-${Date.now()}`
        store.addObject({
          id,
          type: 'image',
          element: img,
        })

        store.setTool(TOOL_TYPES.SELECT)
        store.selectObject(id)

        addSnapshot()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return {
    handleTap,
  }
}
