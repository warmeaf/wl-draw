/** * Canvas component - Main drawing canvas using Leafer App and Editor * Handles canvas
initialization, Editor integration, and viewport controls */
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { App } from 'leafer-ui'
import { Editor } from '@leafer-in/editor'
import '@leafer-in/arrow'
import { useCanvasStore } from '@/stores/canvas'
import { useCanvasTools } from '@/composables/useCanvasTools'
import { useDeleteTool } from '@/composables/useDeleteTool'
import { useSelectTool } from '@/composables/useSelectTool'
import { themeColors } from '@/config/theme'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()

let app: App | null = null
let editor: Editor | null = null
let cleanupDeleteTool: (() => void) | null = null
let cleanupSelectTool: (() => void) | null = null

onMounted(() => {
  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    tree: { fill: themeColors.canvasBackground },
    sky: {},
  })

  store.setAppInstance(app)

  editor = new Editor({
    target: app.tree,
    stroke: themeColors.selectionBox,
    pointStroke: themeColors.controlPoint,
  })
  app.sky.add(editor)
  app.editor = editor
  store.setEditorInstance(editor)

  useCanvasTools(app, canvasContainer.value)
  cleanupSelectTool = useSelectTool(app, store)
  cleanupDeleteTool = useDeleteTool(app, store)

  setupKeyboardEvents()
  updateCursor()
})

onBeforeUnmount(() => {
  cleanupSelectTool?.()
  cleanupDeleteTool?.()
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
