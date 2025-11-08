/** * Canvas component - Main drawing canvas using Leafer App and Editor * Handles canvas
initialization, Editor integration, and viewport controls */
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { App } from 'leafer-ui'
import '@leafer-in/editor'
import '@leafer-in/viewport'
import '@leafer-in/view'
import '@leafer-in/arrow'

import { useCanvasTools } from '@/composables/useCanvasTools'
import { useDeleteTool } from '@/composables/useDeleteTool'
import { useSelectTool } from '@/composables/useSelectTool'

import { useCanvasStore } from '@/stores/canvas'

import { themeColors } from '@/config/theme'

const canvasContainer = ref<HTMLElement | null>(null)
const store = useCanvasStore()

let app: App | null = null
let cleanupDeleteTool: (() => void) | null = null
let cleanupSelectTool: (() => void) | null = null

onMounted(() => {
  if (!canvasContainer.value) return

  app = new App({
    view: canvasContainer.value,
    editor: {
      stroke: themeColors.selectionBox,
      pointStroke: themeColors.controlPoint,
    },
    zoom: { min: 0.02, max: 256 },
    wheel: {
      zoomSpeed: 0.1,
    },
  })
  app.tree.fill = themeColors.canvasBackground

  store.setAppInstance(app)

  useCanvasTools(app)
  cleanupSelectTool = useSelectTool(app, store)
  cleanupDeleteTool = useDeleteTool(app, store)
})

onBeforeUnmount(() => {
  cleanupSelectTool?.()
  cleanupDeleteTool?.()

  if (app) {
    app.destroy()
    app = null
  }
})
</script>

<template>
  <div ref="canvasContainer" class="w-full h-full relative overflow-hidden bg-white"></div>
</template>
