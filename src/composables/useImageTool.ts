/**
 * Image tool composable for adding image elements on canvas
 */
import { Image } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'
import type { Point, Tree } from './types'

export function useImageTool(tree: Tree, store: ReturnType<typeof useCanvasStore>) {
  function handleMouseDown(point: Point) {
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

        img.draggable = true
        store.setTool('select')
        store.selectObject(id)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return {
    handleMouseDown,
  }
}
