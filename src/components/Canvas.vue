/** * Canvas component - Main drawing canvas using Leafer App and Editor * Handles canvas
initialization, Editor integration, and viewport controls */
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { App } from 'leafer-ui'
import { Editor } from '@leafer-in/editor'
import '@leafer-in/arrow'
import { useCanvasStore } from '@/stores/canvas'
import { useCanvasTools } from '@/composables/useCanvasTools'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()

let app: App | null = null
let editor: Editor | null = null

onMounted(() => {
  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    tree: { fill: '#ffffff' },
    editor: {},
    sky: {},
  })

  store.setAppInstance(app)

  editor = new Editor({ target: app.tree })
  app.sky.add(editor)
  app.editor = editor
  store.setEditorInstance(editor)

  editor.on('select', (event: { list?: unknown[] }) => {
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
  })

  useCanvasTools(app, editor, canvasContainer.value)

  setupKeyboardEvents()
  updateCursor()
})

onBeforeUnmount(() => {
  cleanupKeyboardEvents()

  if (editor) {
    editor.destroy()
    editor = null
  }

  if (app) {
    app.destroy()
    app = null
  }
})

// Watch zoom changes and update zoomLayer
watch(
  () => store.zoom,
  (newZoom) => {
    if (app?.tree?.zoomLayer) {
      app.tree.zoomLayer.scaleX = newZoom
      app.tree.zoomLayer.scaleY = newZoom
    }
  }
)

// Sync store selection to Editor
watch(
  () => store.selectedObjectId,
  (selectedId) => {
    if (!editor) return

    try {
      if (selectedId) {
        const obj = store.objects.find((o) => o.id === selectedId)
        if (obj?.element) {
          // Ensure element is editable
          if (obj.element.editable !== false) {
            obj.element.editable = true
          }
          // Only select if not already selected to avoid infinite loop
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

// Update cursor based on current tool
watch(
  () => store.currentTool,
  () => {
    updateAppMode()
    updateCursor()
  }
)

function updateAppMode() {
  if (!app) return
  if (store.currentTool === 'select') {
    app.mode = 'normal'
  } else {
    app.mode = 'draw'
  }
}

function updateCursor() {
  if (!canvasContainer.value) return

  switch (store.currentTool) {
    case 'pan':
      canvasContainer.value.style.cursor = 'grab'
      break
    case 'select':
      canvasContainer.value.style.cursor = 'default'
      break
    default:
      canvasContainer.value.style.cursor = 'crosshair'
  }
}

let keyboardEventHandlers: {
  keydown?: (e: KeyboardEvent) => void
  keyup?: (e: KeyboardEvent) => void
} = {}

function setupKeyboardEvents() {
  keyboardEventHandlers.keydown = (e: KeyboardEvent) => {
    // Space key for panning
    if (e.code === 'Space') {
      const target = e.target as HTMLElement
      const isInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if (!isInput) {
        e.preventDefault()
        store.enablePanWithSpace()
      }
    }
  }

  keyboardEventHandlers.keyup = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault()
      store.disablePanWithSpace()
    }
  }

  window.addEventListener('keydown', keyboardEventHandlers.keydown)
  window.addEventListener('keyup', keyboardEventHandlers.keyup)
}

function cleanupKeyboardEvents() {
  if (keyboardEventHandlers.keydown) {
    window.removeEventListener('keydown', keyboardEventHandlers.keydown)
  }
  if (keyboardEventHandlers.keyup) {
    window.removeEventListener('keyup', keyboardEventHandlers.keyup)
  }
  keyboardEventHandlers = {}
}
</script>

<template>

  <div ref="canvasContainer" class="w-full h-full relative overflow-hidden bg-white"></div>

</template>

