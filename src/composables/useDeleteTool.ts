/**
 * Delete tool composable for deleting selected elements
 * Handles keyboard events to delete selected objects from the canvas
 */
import { KeyEvent, type App } from 'leafer-ui'
import type { Editor } from '@leafer-in/editor'
import type { useCanvasStore } from '@/stores/canvas'

export function useDeleteTool(
  app: App | null,
  editor: Editor | null,
  store: ReturnType<typeof useCanvasStore>
) {
  if (!app || !editor) return () => {}

  const handleKeyDown = (e: { code?: string }) => {
    if (e.code === 'Delete' || e.code === 'Backspace') {
      const list = editor.list || []

      list.forEach((item) => {
        const obj = store.objects.find((o) => o.element === item)
        if (obj) {
          store.removeObject(obj.id)
        } else {
          item.remove()
        }
      })
    }
  }

  app.on(KeyEvent.DOWN, handleKeyDown)

  return () => {
    app.off(KeyEvent.DOWN, handleKeyDown)
  }
}
