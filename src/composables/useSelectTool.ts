/**
 * Select tool composable for managing element selection
 * Handles synchronization between Editor selection and store state
 */
import { watch } from 'vue'
import { type App } from 'leafer-ui'
import type { useCanvasStore } from '@/stores/canvas'

export function useSelectTool(app: App | null, store: ReturnType<typeof useCanvasStore>) {
  if (!app) return () => {}

  const handleEditorSelect = (event: { list?: unknown[] }) => {
    const selectedElements = event.list || []
    if (selectedElements.length > 0) {
      const selectedElement = selectedElements[0]
      const obj = store.objects.find((o) => o.element === selectedElement)
      if (obj) {
        store.selectObject(obj.id)
      } else {
        store.selectObject(null)
      }
    } else {
      store.selectObject(null)
    }
  }

  app.on('select', handleEditorSelect)

  const stopWatch = watch(
    () => store.selectedObjectId,
    (selectedId) => {
      if (!app) return

      try {
        if (selectedId) {
          const obj = store.objects.find((o) => o.id === selectedId)
          if (obj?.element) {
            if (obj.element.editable !== false) {
              obj.element.editable = true
            }
            if (app.editor.target !== obj.element) {
              app.editor.select(obj.element)
            }
          }
        } else {
          if (app.editor.target) {
            app.editor.select([])
          }
        }
      } catch (error) {
        console.error('Error syncing selection:', error)
      }
    }
  )

  return () => {
    app.off('select', handleEditorSelect)
    stopWatch()
  }
}
