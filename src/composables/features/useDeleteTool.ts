/**
 * Delete tool composable for deleting selected elements
 */

import { type App, KeyEvent } from 'leafer-ui'
import { useHistory } from '@/plugins/composables/useHistory'
import type { useCanvasStore } from '@/stores/canvas'

export function useDeleteTool(
  app: App | null,
  store: ReturnType<typeof useCanvasStore>,
  elementPopover: ReturnType<
    typeof import('@/composables/state/useElementPopover').useElementPopover
  >
) {
  if (!app) return () => {}

  const { addSnapshot } = useHistory()

  const handleKeyDown = (keyEvent: { code?: string }) => {
    const isDeleteKey = keyEvent.code === 'Delete' || keyEvent.code === 'Backspace'
    if (!isDeleteKey) return

    const selectedElements = app.editor.list || []
    let hasDeletedAnyElement = false

    selectedElements.forEach((selectedElement) => {
      const objectToDelete = store.objects.find(
        (canvasObject) => canvasObject.element.innerId === selectedElement.innerId
      )
      if (objectToDelete) {
        store.removeObject(objectToDelete.id)
        hasDeletedAnyElement = true
      }
    })

    if (hasDeletedAnyElement) {
      addSnapshot()
      elementPopover.hidePopover()
    }
  }

  app.on(KeyEvent.DOWN, handleKeyDown)

  return () => {
    app.off(KeyEvent.DOWN, handleKeyDown)
  }
}
