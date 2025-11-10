/**
 * Delete tool composable for deleting selected elements
 */

import { type App, KeyEvent } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'

export function useDeleteTool(app: App | null, store: ReturnType<typeof useCanvasStore>) {
  if (!app) return () => {}

  const handleKeyDown = (e: { code?: string }) => {
    if (e.code === 'Delete' || e.code === 'Backspace') {
      const list = app.editor.list || []

      list.forEach((item) => {
        const obj = store.objects.find((o) => o.element.innerId === item.innerId)
        if (obj) {
          store.removeObject(obj.id)
        }
      })
    }
  }

  app.on(KeyEvent.DOWN, handleKeyDown)

  return () => {
    app.off(KeyEvent.DOWN, handleKeyDown)
  }
}
