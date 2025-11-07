/**
 * Select tool composable for managing element selection
 * Handles synchronization between Editor selection and store state
 */
import { watch } from 'vue'
import type { Editor } from '@leafer-in/editor'
import type { useCanvasStore } from '@/stores/canvas'

export function useSelectTool(editor: Editor | null, store: ReturnType<typeof useCanvasStore>) {
  if (!editor) return () => {}

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

  editor.on('select', handleEditorSelect)

  const stopWatch = watch(
    () => store.selectedObjectId,
    (selectedId) => {
      if (!editor) return

      try {
        if (selectedId) {
          const obj = store.objects.find((o) => o.id === selectedId)
          if (obj?.element) {
            if (obj.element.editable !== false) {
              obj.element.editable = true
            }
            if (editor.target !== obj.element) {
              editor.select(obj.element)
            }
          }
        } else {
          if (editor.target) {
            editor.select([])
          }
        }
      } catch (error) {
        console.error('Error syncing selection:', error)
      }
    }
  )

  return () => {
    editor.off('select', handleEditorSelect)
    stopWatch()
  }
}
