/**
 * Delete tool composable for deleting selected elements
 */

import { type App, KeyEvent } from 'leafer-ui'
import { useHistory } from '@/plugins/composables/useHistory'
import type { useCanvasStore } from '@/stores/canvas'

export function useDeleteTool(app: App | null, store: ReturnType<typeof useCanvasStore>) {
  if (!app) return () => {}

  const { addSnapshot } = useHistory()

  const handleKeyDown = (e: { code?: string }) => {
    if (e.code === 'Delete' || e.code === 'Backspace') {
      const list = app.editor.list || []
      let hasDeleted = false

      list.forEach((item) => {
        const obj = store.objects.find((o) => o.element.innerId === item.innerId)
        if (obj) {
          store.removeObject(obj.id)
          hasDeleted = true
        }
      })

      if (hasDeleted) {
        addSnapshot()
      }
    }
  }

  app.on(KeyEvent.DOWN, handleKeyDown)

  return () => {
    app.off(KeyEvent.DOWN, handleKeyDown)
  }
}
